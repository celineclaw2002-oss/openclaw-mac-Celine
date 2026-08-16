import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeterministicObservationModule } from "../modules/module-6-observations.js";
export async function runBtcAnchorResiduals(options = {}) {
    const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
    const [anchors, quotes, lifecycleStates, discoveryRecords, contracts] = await Promise.all([
        readJsonFile(path.join(outputRoot, "anchors", "btc-raw-anchor-probabilities.json")),
        readJsonFile(path.join(outputRoot, "state", "quote-states.json")),
        readJsonFile(path.join(outputRoot, "state", "lifecycle-states.json")),
        readJsonFile(path.join(outputRoot, "staging", "discovery-records.json")),
        readJsonFile(path.join(outputRoot, "normalized", "contracts.json"))
    ]);
    const module = new DeterministicObservationModule({
        anchorsByContractId: new Map(anchors.map((anchor) => [anchor.contractId, anchor])),
        edgesById: new Map(),
        executionByContractId: new Map(),
        feeByContractId: new Map(),
        quotesByContractId: new Map(quotes.map((quote) => [quote.contractId, quote]))
    });
    const quoteByContractId = new Map(quotes.map((quote) => [quote.contractId, quote]));
    const lifecycleByContractId = new Map(lifecycleStates.map((state) => [state.contractId, state]));
    const contractById = new Map(contracts.map((contract) => [contract.contractId, contract]));
    const discoveryByVenueContractId = new Map(discoveryRecords.map((record) => [record.venueContractId, record]));
    const observations = [];
    const inactiveReasons = new Map();
    for (const anchor of anchors) {
        const contract = contractById.get(anchor.contractId);
        const lifecycle = lifecycleByContractId.get(anchor.contractId);
        const discovery = contract ? discoveryByVenueContractId.get(contract.venueContractId) : undefined;
        const quote = quoteByContractId.get(anchor.contractId);
        const reason = classifyAnchorEligibility(anchor.observationTimeMs, lifecycle?.normalizedStatus, discovery?.openTimeMs, quote);
        if (reason === "tradable") {
            const observation = await module.buildExternalAnchorObservation(anchor.contractId, anchor.observationTimeMs);
            if (observation) {
                observations.push(observation);
                continue;
            }
            inactiveReasons.set("observation_builder_rejected", (inactiveReasons.get("observation_builder_rejected") ?? 0) + 1);
            observations.push(buildInactiveObservation(anchor, lifecycle?.normalizedStatus, discovery?.openTimeMs, "observation_builder_rejected"));
            continue;
        }
        inactiveReasons.set(reason, (inactiveReasons.get(reason) ?? 0) + 1);
        observations.push(buildInactiveObservation(anchor, lifecycle?.normalizedStatus, discovery?.openTimeMs, reason));
    }
    await writeFile(path.join(outputRoot, "observations", "external-anchor-btc.json"), `${JSON.stringify(observations, null, 2)}\n`, "utf8");
    const summary = {
        outputRoot,
        mappedAnchors: anchors.length,
        diagnosticRows: observations.length,
        observationsBuilt: observations.length,
        tradableObservations: observations.filter((observation) => observation.tradableFlag).length,
        nonTradableAnchors: observations.filter((observation) => !observation.tradableFlag).length,
        inactiveReasons: Object.fromEntries([...inactiveReasons.entries()].sort(([left], [right]) => left.localeCompare(right))),
        ...(anchors.length === 0
            ? {
                coverageStatus: "no_anchor_contracts_captured",
                blockerReason: "No tradable BTC contracts were captured for the current slice, so the anchor sleeve has no evaluable coverage."
            }
            : { coverageStatus: "anchors_evaluated" }),
        ...(observations.length === 0
            ? {}
            : { observationTimeMs: Math.max(...observations.map((observation) => observation.observationTimeMs)) })
    };
    await writeFile(path.join(outputRoot, "observations", "external-anchor-btc-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    return summary;
}
async function resolveLatestCaptureRoot(cwd) {
    const capturesRoot = path.resolve(cwd, "data", "kalshi-live");
    const entries = await readdir(capturesRoot, { withFileTypes: true });
    const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    const latest = directories.at(-1);
    if (!latest) {
        throw new Error("No Kalshi live capture directories found.");
    }
    return path.join(capturesRoot, latest);
}
async function readJsonFile(target) {
    return JSON.parse(await readFile(target, "utf8"));
}
function classifyAnchorEligibility(observationTimeMs, normalizedStatus, openTimeMs, quote) {
    if (normalizedStatus && normalizedStatus !== "active") {
        if (openTimeMs !== undefined && observationTimeMs < openTimeMs) {
            return "pre_open_market";
        }
        return `non_active_status:${normalizedStatus}`;
    }
    if (openTimeMs !== undefined && observationTimeMs < openTimeMs) {
        return "pre_open_market";
    }
    if (!quote) {
        return "missing_quote_state";
    }
    if (quote.bestYesBid === 0 && quote.bestYesAsk === 0 && quote.bestNoBid === 100 && quote.bestNoAsk === 100) {
        return "non_tradable_placeholder_quote";
    }
    if ((quote.bestYesBid === undefined || quote.bestYesAsk === undefined) && quote.bestNoBid === undefined) {
        return "missing_executable_quote";
    }
    return "tradable";
}
function buildInactiveObservation(anchor, marketStatus, openTimeMs, eligibilityReason) {
    return {
        observationId: `obs::anchor::inactive::${anchor.contractId}::${anchor.observationTimeMs}`,
        contractId: anchor.contractId,
        anchorFamily: anchor.anchorFamily,
        observationTimeMs: anchor.observationTimeMs,
        mappingSafeFlag: anchor.mappingConfidenceScore >= 0.75,
        tradableFlag: false,
        ...(marketStatus ? { marketStatus } : {}),
        ...(openTimeMs === undefined ? {} : { openTimeMs }),
        eligibilityReason,
        qualityFlags: [eligibilityReason],
        normalizationVersion: anchor.normalizationVersion,
        ruleParserVersion: anchor.ruleParserVersion,
        feeModelVersion: anchor.feeModelVersion,
        parseVersion: "obs-v1",
        ...(anchor.anchorModelVersion ? { anchorModelVersion: anchor.anchorModelVersion } : {}),
        ...(anchor.calibrationVersion ? { calibrationVersion: anchor.calibrationVersion } : {}),
        simulationVersion: "sim-v1"
    };
}
