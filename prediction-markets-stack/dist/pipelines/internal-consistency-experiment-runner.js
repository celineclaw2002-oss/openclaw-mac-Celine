import path from "node:path";
import { readFile, readdir, writeFile } from "node:fs/promises";
export async function runInternalConsistencyExperimentRunner(options = {}) {
    const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
    const [observations, simulations, edges] = await Promise.all([
        readJsonFile(path.join(outputRoot, "observations", "internal-consistency.json")),
        readJsonFile(path.join(outputRoot, "simulations", "internal-consistency.json")),
        readJsonFile(path.join(outputRoot, "graphs", "edges.json"))
    ]);
    const edgeContexts = new Map();
    for (const edge of edges) {
        edgeContexts.set(edge.edgeId, {
            edgeId: edge.edgeId,
            edgeType: edge.edgeType,
            hardnessClass: edge.hardnessClass,
            seriesKey: extractSeriesKey(edge.sourceContractIds[0] ?? edge.edgeId),
            eventKey: extractEventKey(edge.sourceContractIds[0] ?? edge.edgeId)
        });
    }
    const semanticQuality = buildSemanticScorecard(observations, edgeContexts);
    const structuralOpportunity = buildOpportunityScorecards(observations, edgeContexts);
    const executionScorecard = buildExecutionScorecard(simulations);
    const seriesOpportunity = buildSeriesOpportunityScorecards(observations, edgeContexts);
    const seriesExecutionScorecard = buildGroupedExecutionScorecard(simulations, observations, edgeContexts, "series_key");
    const simulationCoverage = buildSimulationCoverageSummary(observations, simulations);
    const summary = {
        outputRoot,
        scopeNote: "This baseline summarizes live internal-consistency observations and deterministic execution-template simulations from the latest replay slice. Probability calibration remains unavailable here because the slice contains unresolved markets rather than realized outcomes.",
        observations: observations.length,
        simulations: simulations.length,
        simulationCoverage,
        semanticQuality,
        structuralOpportunity,
        executionScorecard,
        seriesOpportunity,
        seriesExecutionScorecard,
        probabilityScorecard: {
            available: false,
            reason: "Live replay slices do not yet include realized-resolution labels for Brier/log-loss calibration."
        },
        economicScorecard: executionScorecard
    };
    await writeFile(path.join(outputRoot, "summaries", "internal-consistency-scorecard.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    return summary;
}
function buildSemanticScorecard(observations, edgeContexts) {
    const edgeTypeCounts = new Map();
    const hardnessCounts = new Map();
    let semanticSafeObservations = 0;
    let executionSafeObservations = 0;
    let observationsWithQualityFlags = 0;
    let hardEdgeObservations = 0;
    for (const observation of observations) {
        if (observation.semanticSafeFlag) {
            semanticSafeObservations += 1;
        }
        if (observation.executionSafeFlag) {
            executionSafeObservations += 1;
        }
        if (observation.qualityFlags.length > 0) {
            observationsWithQualityFlags += 1;
        }
        const context = edgeContexts.get(observation.edgeId);
        if (!context) {
            continue;
        }
        edgeTypeCounts.set(context.edgeType, (edgeTypeCounts.get(context.edgeType) ?? 0) + 1);
        hardnessCounts.set(context.hardnessClass, (hardnessCounts.get(context.hardnessClass) ?? 0) + 1);
        if (context.hardnessClass === "hard") {
            hardEdgeObservations += 1;
        }
    }
    return {
        observations: observations.length,
        semanticSafeObservations,
        executionSafeObservations,
        observationsWithQualityFlags,
        semanticSafeRate: ratio(semanticSafeObservations, observations.length),
        executionSafeRate: ratio(executionSafeObservations, observations.length),
        flaggedObservationRate: ratio(observationsWithQualityFlags, observations.length),
        hardEdgeRate: ratio(hardEdgeObservations, observations.length),
        edgeTypeCounts: Object.fromEntries([...edgeTypeCounts.entries()].sort(([left], [right]) => left.localeCompare(right))),
        hardnessCounts: Object.fromEntries([...hardnessCounts.entries()].sort(([left], [right]) => left.localeCompare(right)))
    };
}
function buildOpportunityScorecards(observations, edgeContexts) {
    const groups = new Map();
    groups.set("overall", observations);
    for (const observation of observations) {
        const context = edgeContexts.get(observation.edgeId);
        if (!context) {
            continue;
        }
        appendGroup(groups, `edge_type:${context.edgeType}`, observation);
        appendGroup(groups, `hardness_class:${context.hardnessClass}`, observation);
    }
    return [...groups.entries()]
        .map(([groupKey, rows]) => buildOpportunityRow(groupKey, rows))
        .sort((left, right) => left.groupId.localeCompare(right.groupId));
}
function buildSeriesOpportunityScorecards(observations, edgeContexts) {
    const groups = new Map();
    for (const observation of observations) {
        const context = edgeContexts.get(observation.edgeId);
        if (!context) {
            continue;
        }
        appendGroup(groups, `series_key:${context.seriesKey}`, observation);
        appendGroup(groups, `event_key:${context.eventKey}`, observation);
    }
    return [...groups.entries()]
        .map(([groupKey, rows]) => buildOpportunityRow(groupKey, rows))
        .sort((left, right) => left.groupId.localeCompare(right.groupId));
}
function buildOpportunityRow(groupKey, observations) {
    const grossPositive = observations.filter((observation) => observation.grossResidual > 0).length;
    const feeAdjustedPositive = observations.filter((observation) => observation.netFeeAdjustedResidual > 0).length;
    const depthAdjustedPositive = observations.filter((observation) => observation.depthAdjustedResidual > 0).length;
    const grossOpportunityCount = observations.filter((observation) => Math.abs(observation.grossResidual) > 0).length;
    const feeAdjustedOpportunityCount = observations.filter((observation) => observation.netFeeAdjustedResidual > 0).length;
    const depthAdjustedOpportunityCount = observations.filter((observation) => observation.depthAdjustedResidual > 0).length;
    const [groupType, groupId] = parseGroupedKey(groupKey);
    return {
        groupId,
        groupType,
        observations: observations.length,
        grossPositive,
        feeAdjustedPositive,
        depthAdjustedPositive,
        grossOpportunityCount,
        feeAdjustedOpportunityCount,
        depthAdjustedOpportunityCount,
        grossPositiveRate: ratio(grossPositive, observations.length),
        feeAdjustedPositiveRate: ratio(feeAdjustedPositive, observations.length),
        depthAdjustedPositiveRate: ratio(depthAdjustedPositive, observations.length),
        grossOpportunityRate: ratio(grossOpportunityCount, observations.length),
        feeAdjustedOpportunityRate: ratio(feeAdjustedOpportunityCount, observations.length),
        depthAdjustedOpportunityRate: ratio(depthAdjustedOpportunityCount, observations.length),
        meanGrossResidual: mean(observations.map((observation) => observation.grossResidual)),
        meanNetFeeAdjustedResidual: mean(observations.map((observation) => observation.netFeeAdjustedResidual)),
        meanDepthAdjustedResidual: mean(observations.map((observation) => observation.depthAdjustedResidual)),
        meanGrossOpportunityMagnitude: mean(observations.map((observation) => Math.abs(observation.grossResidual)))
    };
}
function buildExecutionScorecard(simulations) {
    const grouped = new Map();
    for (const simulation of simulations) {
        appendTemplateGroup(grouped, simulation.executionTemplateId, simulation);
    }
    return [...grouped.entries()]
        .map(([executionTemplateId, rows]) => ({
        executionTemplateId,
        simulations: rows.length,
        meanEntryFillProbability: nullableMean(rows.map((row) => row.entryFillProbability)),
        meanFullCompletionProbability: nullableMean(rows.map((row) => row.fullCompletionProbability)),
        meanExpectedSlippage: nullableMean(rows.map((row) => row.expectedSlippage)),
        meanPnlToClose: nullableMean(rows.map((row) => row.simulatedPnlToClose)),
        meanPnlToResolution: nullableMean(rows.map((row) => row.simulatedPnlToResolution)),
        medianPnlToClose: nullableMedian(rows.map((row) => row.simulatedPnlToClose)),
        medianPnlToResolution: nullableMedian(rows.map((row) => row.simulatedPnlToResolution)),
        positivePnlToCloseRate: nullableRate(rows.map((row) => row.simulatedPnlToClose)),
        positivePnlToResolutionRate: nullableRate(rows.map((row) => row.simulatedPnlToResolution))
    }))
        .sort((left, right) => left.executionTemplateId.localeCompare(right.executionTemplateId));
}
function buildGroupedExecutionScorecard(simulations, observations, edgeContexts, grouping) {
    const observationsById = new Map(observations.map((observation) => [observation.observationId, observation]));
    const grouped = new Map();
    for (const simulation of simulations) {
        const observation = observationsById.get(simulation.observationId);
        if (!observation) {
            continue;
        }
        const context = edgeContexts.get(observation.edgeId);
        if (!context) {
            continue;
        }
        const groupId = grouping === "series_key" ? context.seriesKey : context.eventKey;
        const key = `${grouping}:${groupId}:${simulation.executionTemplateId}`;
        const rows = grouped.get(key);
        if (rows) {
            rows.push(simulation);
        }
        else {
            grouped.set(key, [simulation]);
        }
    }
    return [...grouped.entries()]
        .map(([key, rows]) => {
        const [groupType, groupId, executionTemplateId] = key.split(":");
        return {
            groupId: groupId ?? "unknown",
            groupType: groupType,
            executionTemplateId: executionTemplateId,
            simulations: rows.length,
            meanEntryFillProbability: nullableMean(rows.map((row) => row.entryFillProbability)),
            meanFullCompletionProbability: nullableMean(rows.map((row) => row.fullCompletionProbability)),
            meanExpectedSlippage: nullableMean(rows.map((row) => row.expectedSlippage)),
            meanPnlToClose: nullableMean(rows.map((row) => row.simulatedPnlToClose)),
            meanPnlToResolution: nullableMean(rows.map((row) => row.simulatedPnlToResolution)),
            medianPnlToClose: nullableMedian(rows.map((row) => row.simulatedPnlToClose)),
            medianPnlToResolution: nullableMedian(rows.map((row) => row.simulatedPnlToResolution)),
            positivePnlToCloseRate: nullableRate(rows.map((row) => row.simulatedPnlToClose)),
            positivePnlToResolutionRate: nullableRate(rows.map((row) => row.simulatedPnlToResolution))
        };
    })
        .sort((left, right) => `${left.groupType}:${left.groupId}:${left.executionTemplateId}`.localeCompare(`${right.groupType}:${right.groupId}:${right.executionTemplateId}`));
}
function buildSimulationCoverageSummary(observations, simulations) {
    const expectedTemplatesPerObservation = 3;
    const simulatableObservations = observations.filter((observation) => observation.executionSafeFlag).length;
    const expectedSimulations = simulatableObservations * expectedTemplatesPerObservation;
    return {
        expectedTemplatesPerObservation,
        expectedSimulations,
        actualSimulations: simulations.length,
        coverageComplete: simulations.length === expectedSimulations
    };
}
function appendGroup(groups, groupKey, observation) {
    const rows = groups.get(groupKey);
    if (rows) {
        rows.push(observation);
        return;
    }
    groups.set(groupKey, [observation]);
}
function appendTemplateGroup(groups, key, simulation) {
    const rows = groups.get(key);
    if (rows) {
        rows.push(simulation);
        return;
    }
    groups.set(key, [simulation]);
}
function parseGroupedKey(groupKey) {
    if (groupKey === "overall") {
        return ["overall", "overall"];
    }
    const separator = groupKey.indexOf(":");
    if (separator === -1) {
        return ["overall", groupKey];
    }
    return [
        groupKey.slice(0, separator),
        groupKey.slice(separator + 1)
    ];
}
function nullableMean(values) {
    const clean = values.filter((value) => value !== undefined);
    return clean.length === 0 ? null : mean(clean);
}
function nullableMedian(values) {
    const clean = values.filter((value) => value !== undefined).sort((left, right) => left - right);
    if (clean.length === 0) {
        return null;
    }
    const mid = Math.floor(clean.length / 2);
    if (clean.length % 2 === 0) {
        const left = clean[mid - 1];
        const right = clean[mid];
        return (left + right) / 2;
    }
    return clean[mid];
}
function nullableRate(values) {
    const clean = values.filter((value) => value !== undefined);
    if (clean.length === 0) {
        return null;
    }
    return clean.filter((value) => value > 0).length / clean.length;
}
function mean(values) {
    return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}
function ratio(numerator, denominator) {
    return denominator === 0 ? 0 : numerator / denominator;
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
function extractSeriesKey(contractId) {
    const ticker = extractVenueTicker(contractId);
    return ticker.split("-")[0] ?? ticker;
}
function extractEventKey(contractId) {
    const ticker = extractVenueTicker(contractId);
    const parts = ticker.split("-");
    return parts.length <= 2 ? ticker : parts.slice(0, -1).join("-");
}
function extractVenueTicker(contractId) {
    return contractId.startsWith("contract::") ? contractId.slice("contract::".length) : contractId;
}
