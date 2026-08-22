import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CanonicalContract } from "../domain/contracts.js";
import type { RelationshipEdge } from "../domain/graph.js";
import type {
  InternalConsistencyEdgeObservation,
  InternalConsistencyTradeSimulation
} from "../domain/observations.js";
import type { ExecutionTemplateId } from "../shared/enums.js";
import { writeRunManifest } from "../shared/run-manifest.js";

interface CandidateMarketRow {
  ticker: string;
  familyClass?: string;
}

interface EdgeContext {
  edgeId: string;
  seriesKey: string;
  eventKey: string;
  familyClass: string;
  eventFamilyId: string;
  edgeType: RelationshipEdge["edgeType"];
}

interface SimulationRollup {
  simulationCount: number;
  meanPnlToResolution: number;
  positivePnlToResolutionRate: number;
}

export interface AlphaScoutRow {
  groupType: "series_key" | "event_key" | "family_class";
  groupId: string;
  capturesSeen: number;
  observations: number;
  grossPositiveRate: number;
  feeAdjustedPositiveRate: number;
  depthAdjustedPositiveRate: number;
  meanGrossResidual: number;
  meanNetFeeAdjustedResidual: number;
  meanDepthAdjustedResidual: number;
  simulationCount: number;
  bestExecutionTemplate?: ExecutionTemplateId;
  bestMeanPnlToResolution?: number;
  bestPositivePnlToResolutionRate?: number;
  scoutScore: number;
  verdict: "promising" | "watchlist" | "weak" | "avoid";
}

export interface InternalConsistencyAlphaScoutSummary {
  generatedAtIso: string;
  capturesInspected: number;
  latestCaptureRoot?: string;
  scoutNote: string;
  topSeries: AlphaScoutRow[];
  topEvents: AlphaScoutRow[];
  topFamilyClasses: AlphaScoutRow[];
}

export async function runInternalConsistencyAlphaScout(
  options: { outputRoot?: string; maxCaptures?: number } = {}
): Promise<InternalConsistencyAlphaScoutSummary> {
  const cwd = process.cwd();
  const captureRoots = await resolveCaptureRoots(cwd, options.maxCaptures ?? 8);
  const aggregates = new Map<string, AggregateBucket>();

  for (const captureRoot of captureRoots) {
    const [observations, simulations, edges, contracts, candidateMarkets] = await Promise.all([
      readJsonFile<InternalConsistencyEdgeObservation[]>(path.join(captureRoot, "observations", "internal-consistency.json")),
      readJsonFile<InternalConsistencyTradeSimulation[]>(path.join(captureRoot, "simulations", "internal-consistency.json")),
      readJsonFile<RelationshipEdge[]>(path.join(captureRoot, "graphs", "edges.json")),
      readJsonFile<CanonicalContract[]>(path.join(captureRoot, "normalized", "contracts.json")),
      readJsonFile<CandidateMarketRow[]>(path.join(captureRoot, "summaries", "candidate-markets.json")).catch(() => [])
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
  const summary: InternalConsistencyAlphaScoutSummary = {
    generatedAtIso: new Date().toISOString(),
    capturesInspected: captureRoots.length,
    ...(captureRoots.at(-1) === undefined ? {} : { latestCaptureRoot: captureRoots.at(-1)! }),
    scoutNote:
      "This scout ranks persistent internal-consistency opportunity clusters across recent Kalshi live captures. It emphasizes fee-adjusted and depth-adjusted survivability, not just raw residual count.",
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

interface AggregateBucket {
  captureRoots: Set<string>;
  observations: number;
  grossPositive: number;
  feeAdjustedPositive: number;
  depthAdjustedPositive: number;
  grossResiduals: number[];
  netFeeAdjustedResiduals: number[];
  depthAdjustedResiduals: number[];
  simulationsByTemplate: Map<ExecutionTemplateId, number[]>;
}

function createAggregateBucket(): AggregateBucket {
  return {
    captureRoots: new Set<string>(),
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

function buildEdgeContexts(
  edges: RelationshipEdge[],
  contracts: CanonicalContract[],
  candidateMarkets: CandidateMarketRow[]
): Map<string, EdgeContext> {
  const contractsById = new Map(contracts.map((contract) => [contract.contractId, contract]));
  const familyClassByTicker = new Map(candidateMarkets.map((row) => [row.ticker, row.familyClass ?? "unknown"]));
  const contexts = new Map<string, EdgeContext>();
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

function updateAggregate(
  aggregates: Map<string, AggregateBucket>,
  groupKey: string,
  captureRoot: string,
  observation: InternalConsistencyEdgeObservation
): void {
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

function updateSimulationAggregate(
  aggregates: Map<string, AggregateBucket>,
  groupKey: string,
  simulation: InternalConsistencyTradeSimulation
): void {
  const bucket = aggregates.get(groupKey) ?? createAggregateBucket();
  if (simulation.simulatedPnlToResolution === undefined) {
    aggregates.set(groupKey, bucket);
    return;
  }
  const rows = bucket.simulationsByTemplate.get(simulation.executionTemplateId);
  if (rows) {
    rows.push(simulation.simulatedPnlToResolution);
  } else {
    bucket.simulationsByTemplate.set(simulation.executionTemplateId, [simulation.simulatedPnlToResolution]);
  }
  aggregates.set(groupKey, bucket);
}

function finalizeAggregate(groupKey: string, bucket: AggregateBucket, captureCount: number): AlphaScoutRow {
  const [groupType, groupId] = parseGroupKey(groupKey);
  const simulations = [...bucket.simulationsByTemplate.entries()].map(([executionTemplateId, pnls]) => ({
    executionTemplateId,
    simulationCount: pnls.length,
    meanPnlToResolution: mean(pnls),
    positivePnlToResolutionRate: ratio(pnls.filter((value) => value > 0).length, pnls.length)
  }));
  const bestSimulation = simulations.sort(compareSimulationRollups)[0];
  const persistence = ratio(bucket.captureRoots.size, Math.max(captureCount, 1));
  const scoutScore =
    bucket.depthAdjustedPositive / Math.max(bucket.observations, 1) * 45 +
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

function compareSimulationRollups(left: SimulationRollup & { executionTemplateId: ExecutionTemplateId }, right: SimulationRollup & { executionTemplateId: ExecutionTemplateId }): number {
  if (right.meanPnlToResolution !== left.meanPnlToResolution) {
    return right.meanPnlToResolution - left.meanPnlToResolution;
  }
  return right.positivePnlToResolutionRate - left.positivePnlToResolutionRate;
}

function compareScoutRows(left: AlphaScoutRow, right: AlphaScoutRow): number {
  if (right.scoutScore !== left.scoutScore) {
    return right.scoutScore - left.scoutScore;
  }
  return right.observations - left.observations;
}

function parseGroupKey(groupKey: string): ["series_key" | "event_key" | "family_class", string] {
  const separator = groupKey.indexOf(":");
  if (separator === -1) {
    return ["series_key", groupKey];
  }
  return [groupKey.slice(0, separator) as "series_key" | "event_key" | "family_class", groupKey.slice(separator + 1)];
}

async function resolveCaptureRoots(cwd: string, maxCaptures: number): Promise<string[]> {
  const capturesRoot = path.resolve(cwd, "data", "kalshi-live");
  const entries = (await readdir(capturesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const captures: string[] = [];
  for (const entry of entries) {
    const root = path.join(capturesRoot, entry);
    try {
      await readFile(path.join(root, "observations", "internal-consistency.json"), "utf8");
      await readFile(path.join(root, "simulations", "internal-consistency.json"), "utf8");
      captures.push(root);
    } catch {
      continue;
    }
  }
  return captures.slice(-Math.max(1, maxCaptures));
}

async function readJsonFile<T>(target: string): Promise<T> {
  return JSON.parse(await readFile(target, "utf8")) as T;
}

function extractVenueTicker(contractId: string): string {
  return contractId.startsWith("contract::") ? contractId.slice("contract::".length) : contractId;
}

function extractSeriesKey(contractId: string): string {
  const ticker = extractVenueTicker(contractId);
  return ticker.split("-")[0] ?? ticker;
}

function extractEventKey(contractId: string): string {
  const ticker = extractVenueTicker(contractId);
  const parts = ticker.split("-");
  return parts.length <= 2 ? ticker : parts.slice(0, -1).join("-");
}

function inferFamilyClass(eventFamilyId: string | undefined): string {
  if (!eventFamilyId) {
    return "unknown";
  }
  const parts = eventFamilyId.split("::");
  return parts[1] ?? eventFamilyId;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
