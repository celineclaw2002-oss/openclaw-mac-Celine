import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeRunManifest } from "../shared/run-manifest.js";
export async function runInternalConsistencyAlphaScout(options = {}) {
    const cwd = process.cwd();
    const captureRoots = await resolveCaptureRoots(cwd, options.maxCaptures ?? 8);
    const aggregates = new Map();
    for (const captureRoot of captureRoots) {
        const [observations, simulations, edges, contracts, candidateMarkets] = await Promise.all([
            readJsonFile(path.join(captureRoot, "observations", "internal-consistency.json")),
            readJsonFile(path.join(captureRoot, "simulations", "internal-consistency.json")),
            readJsonFile(path.join(captureRoot, "graphs", "edges.json")),
            readJsonFile(path.join(captureRoot, "normalized", "contracts.json")),
            readJsonFile(path.join(captureRoot, "summaries", "candidate-markets.json")).catch(() => [])
        ]);
        const edgeContexts = buildEdgeContexts(edges, contracts, candidateMarkets);
        const observationsById = new Map(observations.map((observation) => [observation.observationId, observation]));
        for (const observation of observations) {
            const context = edgeContexts.get(observation.edgeId);
            if (!context) {
                continue;
            }
            updateAggregate(aggregates, `series_key:${context.seriesKey}`, captureRoot, observation);
            updateAggregate(aggregates, `event_key:${context.eventKey}`, captureRoot, observation);
            updateAggregate(aggregates, `family_class:${context.familyClass}`, captureRoot, observation);
        }
        for (const simulation of simulations) {
            const observation = observationsById.get(simulation.observationId);
            if (!observation) {
                continue;
            }
            const context = edgeContexts.get(observation.edgeId);
            if (!context) {
                continue;
            }
            updateSimulationAggregate(aggregates, `series_key:${context.seriesKey}`, simulation);
            updateSimulationAggregate(aggregates, `event_key:${context.eventKey}`, simulation);
            updateSimulationAggregate(aggregates, `family_class:${context.familyClass}`, simulation);
        }
    }
    const rows = [...aggregates.entries()].map(([groupKey, bucket]) => finalizeAggregate(groupKey, bucket, captureRoots.length));
    const outputRoot = options.outputRoot ?? path.resolve(cwd, "data", "scouting");
    await mkdir(outputRoot, { recursive: true });
    const summary = {
        generatedAtIso: new Date().toISOString(),
        capturesInspected: captureRoots.length,
        ...(captureRoots.at(-1) === undefined ? {} : { latestCaptureRoot: captureRoots.at(-1) }),
        scoutNote: "This scout ranks persistent internal-consistency opportunity clusters across recent Kalshi live captures. It emphasizes fee-adjusted and depth-adjusted survivability, not just raw residual count.",
        topSeries: rows.filter((row) => row.groupType === "series_key").sort(compareScoutRows).slice(0, 12),
        topEvents: rows.filter((row) => row.groupType === "event_key").sort(compareScoutRows).slice(0, 12),
        topFamilyClasses: rows.filter((row) => row.groupType === "family_class").sort(compareScoutRows).slice(0, 12)
    };
    const outputPath = path.join(outputRoot, "internal-consistency-alpha-scout.json");
    await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeRunManifest({
        pipelineId: "internal-consistency-alpha-scout",
        outputRoot,
        sourceArtifacts: [outputPath],
        summary: {
            capturesInspected: summary.capturesInspected,
            bestSeries: summary.topSeries[0]?.groupId,
            bestSeriesScore: summary.topSeries[0]?.scoutScore
        }
    });
    return summary;
}
function createAggregateBucket() {
    return {
        captureRoots: new Set(),
        observations: 0,
        grossPositive: 0,
        feeAdjustedPositive: 0,
        depthAdjustedPositive: 0,
        grossResiduals: [],
        netFeeAdjustedResiduals: [],
        depthAdjustedResiduals: [],
        simulationsByTemplate: new Map()
    };
}
function buildEdgeContexts(edges, contracts, candidateMarkets) {
    const contractsById = new Map(contracts.map((contract) => [contract.contractId, contract]));
    const familyClassByTicker = new Map(candidateMarkets.map((row) => [row.ticker, row.familyClass ?? "unknown"]));
    const contexts = new Map();
    for (const edge of edges) {
        const contractId = edge.sourceContractIds[0] ?? edge.targetContractIds[0];
        if (!contractId) {
            continue;
        }
        const ticker = extractVenueTicker(contractId);
        const contract = contractsById.get(contractId);
        contexts.set(edge.edgeId, {
            edgeId: edge.edgeId,
            seriesKey: extractSeriesKey(contractId),
            eventKey: extractEventKey(contractId),
            familyClass: familyClassByTicker.get(ticker) ?? inferFamilyClass(contract?.eventFamilyId),
            eventFamilyId: contract?.eventFamilyId ?? "family::unknown",
            edgeType: edge.edgeType
        });
    }
    return contexts;
}
function updateAggregate(aggregates, groupKey, captureRoot, observation) {
    const bucket = aggregates.get(groupKey) ?? createAggregateBucket();
    bucket.captureRoots.add(captureRoot);
    bucket.observations += 1;
    bucket.grossPositive += observation.grossResidual > 0 ? 1 : 0;
    bucket.feeAdjustedPositive += observation.netFeeAdjustedResidual > 0 ? 1 : 0;
    bucket.depthAdjustedPositive += observation.depthAdjustedResidual > 0 ? 1 : 0;
    bucket.grossResiduals.push(observation.grossResidual);
    bucket.netFeeAdjustedResiduals.push(observation.netFeeAdjustedResidual);
    bucket.depthAdjustedResiduals.push(observation.depthAdjustedResidual);
    aggregates.set(groupKey, bucket);
}
function updateSimulationAggregate(aggregates, groupKey, simulation) {
    const bucket = aggregates.get(groupKey) ?? createAggregateBucket();
    if (simulation.simulatedPnlToResolution === undefined) {
        aggregates.set(groupKey, bucket);
        return;
    }
    const rows = bucket.simulationsByTemplate.get(simulation.executionTemplateId);
    if (rows) {
        rows.push(simulation.simulatedPnlToResolution);
    }
    else {
        bucket.simulationsByTemplate.set(simulation.executionTemplateId, [simulation.simulatedPnlToResolution]);
    }
    aggregates.set(groupKey, bucket);
}
function finalizeAggregate(groupKey, bucket, captureCount) {
    const [groupType, groupId] = parseGroupKey(groupKey);
    const simulations = [...bucket.simulationsByTemplate.entries()].map(([executionTemplateId, pnls]) => ({
        executionTemplateId,
        simulationCount: pnls.length,
        meanPnlToResolution: mean(pnls),
        positivePnlToResolutionRate: ratio(pnls.filter((value) => value > 0).length, pnls.length)
    }));
    const bestSimulation = simulations.sort(compareSimulationRollups)[0];
    const persistence = ratio(bucket.captureRoots.size, Math.max(captureCount, 1));
    const scoutScore = bucket.depthAdjustedPositive / Math.max(bucket.observations, 1) * 45 +
        clamp(mean(bucket.depthAdjustedResiduals), -5, 5) * 6 +
        (bestSimulation?.meanPnlToResolution ?? -1) * 8 +
        (bestSimulation?.positivePnlToResolutionRate ?? 0) * 20 +
        persistence * 15;
    return {
        groupType,
        groupId,
        capturesSeen: bucket.captureRoots.size,
        observations: bucket.observations,
        grossPositiveRate: ratio(bucket.grossPositive, bucket.observations),
        feeAdjustedPositiveRate: ratio(bucket.feeAdjustedPositive, bucket.observations),
        depthAdjustedPositiveRate: ratio(bucket.depthAdjustedPositive, bucket.observations),
        meanGrossResidual: mean(bucket.grossResiduals),
        meanNetFeeAdjustedResidual: mean(bucket.netFeeAdjustedResiduals),
        meanDepthAdjustedResidual: mean(bucket.depthAdjustedResiduals),
        simulationCount: simulations.reduce((sum, row) => sum + row.simulationCount, 0),
        ...(bestSimulation
            ? {
                bestExecutionTemplate: bestSimulation.executionTemplateId,
                bestMeanPnlToResolution: bestSimulation.meanPnlToResolution,
                bestPositivePnlToResolutionRate: bestSimulation.positivePnlToResolutionRate
            }
            : {}),
        scoutScore,
        verdict: scoutScore >= 12 ? "promising" : scoutScore >= 4 ? "watchlist" : scoutScore >= -4 ? "weak" : "avoid"
    };
}
function compareSimulationRollups(left, right) {
    if (right.meanPnlToResolution !== left.meanPnlToResolution) {
        return right.meanPnlToResolution - left.meanPnlToResolution;
    }
    return right.positivePnlToResolutionRate - left.positivePnlToResolutionRate;
}
function compareScoutRows(left, right) {
    if (right.scoutScore !== left.scoutScore) {
        return right.scoutScore - left.scoutScore;
    }
    return right.observations - left.observations;
}
function parseGroupKey(groupKey) {
    const separator = groupKey.indexOf(":");
    if (separator === -1) {
        return ["series_key", groupKey];
    }
    return [groupKey.slice(0, separator), groupKey.slice(separator + 1)];
}
async function resolveCaptureRoots(cwd, maxCaptures) {
    const capturesRoot = path.resolve(cwd, "data", "kalshi-live");
    const entries = (await readdir(capturesRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    const captures = [];
    for (const entry of entries) {
        const root = path.join(capturesRoot, entry);
        try {
            await readFile(path.join(root, "observations", "internal-consistency.json"), "utf8");
            await readFile(path.join(root, "simulations", "internal-consistency.json"), "utf8");
            captures.push(root);
        }
        catch {
            continue;
        }
    }
    return captures.slice(-Math.max(1, maxCaptures));
}
async function readJsonFile(target) {
    return JSON.parse(await readFile(target, "utf8"));
}
function extractVenueTicker(contractId) {
    return contractId.startsWith("contract::") ? contractId.slice("contract::".length) : contractId;
}
function extractSeriesKey(contractId) {
    const ticker = extractVenueTicker(contractId);
    return ticker.split("-")[0] ?? ticker;
}
function extractEventKey(contractId) {
    const ticker = extractVenueTicker(contractId);
    const parts = ticker.split("-");
    return parts.length <= 2 ? ticker : parts.slice(0, -1).join("-");
}
function inferFamilyClass(eventFamilyId) {
    if (!eventFamilyId) {
        return "unknown";
    }
    const parts = eventFamilyId.split("::");
    return parts[1] ?? eventFamilyId;
}
function mean(values) {
    return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}
function ratio(numerator, denominator) {
    return denominator === 0 ? 0 : numerator / denominator;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
