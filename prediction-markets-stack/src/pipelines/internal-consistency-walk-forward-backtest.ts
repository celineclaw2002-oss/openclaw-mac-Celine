import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RelationshipEdge } from "../domain/graph.js";
import type {
  InternalConsistencyEdgeObservation,
  InternalConsistencyTradeSimulation
} from "../domain/observations.js";
import type { ExecutionTemplateId } from "../shared/enums.js";
import { writeRunManifest } from "../shared/run-manifest.js";

interface EdgeContext {
  edgeId: string;
  seriesKey: string;
  eventKey: string;
  edgeType: RelationshipEdge["edgeType"];
}

interface CaptureSlice {
  captureId: string;
  captureRoot: string;
  observations: InternalConsistencyEdgeObservation[];
  simulationsByObservationId: Map<string, Map<ExecutionTemplateId, InternalConsistencyTradeSimulation>>;
  edgeContexts: Map<string, EdgeContext>;
}

interface EligibleOpportunity {
  captureId: string;
  eventKey: string;
  observation: InternalConsistencyEdgeObservation;
  simulationsByTemplate: Map<ExecutionTemplateId, InternalConsistencyTradeSimulation>;
  simulation: InternalConsistencyTradeSimulation;
  selectedTemplateId: ExecutionTemplateId;
  trailingMedianDepthAdjustedResidual: number;
  rankingScore: number;
  templateSource: "event" | "global" | "static";
}

interface TrainingSnapshot {
  edgeResidualMedians: Map<string, number>;
  eventResidualMedians: Map<string, number>;
}

interface PolicyConfig {
  policyId: "baseline_all_aggressive" | "walk_forward_top_1" | "walk_forward_top_3";
  title: string;
  maxTradesPerCapture: number;
  selector: "static_aggressive" | "walk_forward";
}

export interface PolicyCaptureResult {
  captureId: string;
  eligibleOpportunities: number;
  trades: number;
  pnlToResolution: number;
}

export interface PolicyTradeResult {
  captureId: string;
  eventKey: string;
  edgeId: string;
  observationId: string;
  executionTemplateId: ExecutionTemplateId;
  templateSource: "event" | "global" | "static";
  rankingScore: number;
  trailingMedianDepthAdjustedResidual: number;
  depthAdjustedResidual: number;
  entryFillProbability: number | null;
  pnlToResolution: number;
}

export interface PolicyPerformanceSummary {
  policyId: PolicyConfig["policyId"];
  title: string;
  totalTrades: number;
  uniqueEdgesTraded: number;
  tradedCaptures: number;
  cumulativePnlToResolution: number;
  averagePnlPerTrade: number;
  medianPnlPerTrade: number | null;
  hitRate: number;
  profitFactor: number | null;
  maxDrawdown: number;
  sharpeLike: number | null;
  averageTradesPerTradedCapture: number;
  averageEntryFillProbability: number | null;
  bestCapturePnl: number | null;
  worstCapturePnl: number | null;
  templateUsage: Record<string, number>;
  topEvents: Array<{
    eventKey: string;
    trades: number;
    cumulativePnlToResolution: number;
    averagePnlPerTrade: number;
  }>;
}

export interface InternalConsistencyWalkForwardBacktestSummary {
  outputRoot: string;
  seriesKey: string;
  requiredEdgeType: RelationshipEdge["edgeType"];
  totalCapturesSeen: number;
  warmupCaptures: number;
  evaluatedCaptures: number;
  minTrainingCaptures: number;
  trainingWindowCaptures: number;
  minDepthAdjustedResidual: number;
  duplicateEdgePolicy: "trade_each_edge_once";
  policies: PolicyPerformanceSummary[];
}

export interface InternalConsistencyWalkForwardBacktestOptions {
  capturesRoot?: string;
  outputRoot?: string;
  seriesKey?: string;
  minTrainingCaptures?: number;
  trainingWindowCaptures?: number;
  minDepthAdjustedResidual?: number;
  requiredEdgeType?: RelationshipEdge["edgeType"];
}

const policyConfigs: PolicyConfig[] = [
  {
    policyId: "baseline_all_aggressive",
    title: "Baseline All Aggressive",
    maxTradesPerCapture: Number.POSITIVE_INFINITY,
    selector: "static_aggressive"
  },
  {
    policyId: "walk_forward_top_1",
    title: "Walk-Forward Top 1",
    maxTradesPerCapture: 1,
    selector: "walk_forward"
  },
  {
    policyId: "walk_forward_top_3",
    title: "Walk-Forward Top 3",
    maxTradesPerCapture: 3,
    selector: "walk_forward"
  }
];

export async function runInternalConsistencyWalkForwardBacktest(
  options: InternalConsistencyWalkForwardBacktestOptions = {}
): Promise<InternalConsistencyWalkForwardBacktestSummary> {
  const capturesRoot = options.capturesRoot ?? path.resolve(process.cwd(), "data", "kalshi-live");
  const seriesKey = options.seriesKey ?? "KXFED";
  const minTrainingCaptures = options.minTrainingCaptures ?? 6;
  const trainingWindowCaptures = options.trainingWindowCaptures ?? 12;
  const minDepthAdjustedResidual = options.minDepthAdjustedResidual ?? 5;
  const requiredEdgeType = options.requiredEdgeType ?? "temporal_nested";
  const outputRoot =
    options.outputRoot ??
    path.resolve(
      process.cwd(),
      "data",
      "backtests",
      "internal-consistency-walk-forward",
      timestampId(new Date())
    );

  await mkdir(outputRoot, { recursive: true });
  const slices = await loadCaptureSlices(capturesRoot, seriesKey, minDepthAdjustedResidual, requiredEdgeType);
  const evaluatedSlices = slices.slice(minTrainingCaptures);
  const policyState = new Map(
    policyConfigs.map((policy) => [
      policy.policyId,
      {
        tradedEdgeIds: new Set<string>(),
        trades: [] as PolicyTradeResult[],
        captures: [] as PolicyCaptureResult[]
      }
    ])
  );

  for (let index = minTrainingCaptures; index < slices.length; index += 1) {
    const currentSlice = slices[index]!;
    const trainingSlices = slices.slice(Math.max(0, index - trainingWindowCaptures), index);
    const trainingSnapshot = buildTrainingSnapshot(trainingSlices);
    const eligible = buildEligibleOpportunities(currentSlice, trainingSnapshot, seriesKey, minDepthAdjustedResidual);

    for (const policy of policyConfigs) {
      const state = policyState.get(policy.policyId)!;
      const selected = selectTradesForPolicy({
        policy,
        eligible,
        tradedEdgeIds: state.tradedEdgeIds
      });
      const capturePnl = selected.reduce((sum, trade) => sum + trade.pnlToResolution, 0);
      state.trades.push(...selected);
      selected.forEach((trade) => state.tradedEdgeIds.add(trade.edgeId));
      state.captures.push({
        captureId: currentSlice.captureId,
        eligibleOpportunities: eligible.length,
        trades: selected.length,
        pnlToResolution: capturePnl
      });
    }
  }

  const policies = policyConfigs.map((policy) =>
    summarizePolicy(policy, policyState.get(policy.policyId)!.trades, policyState.get(policy.policyId)!.captures)
  );
  const sortedPolicies = [...policies].sort((left, right) => right.cumulativePnlToResolution - left.cumulativePnlToResolution);
  const summary: InternalConsistencyWalkForwardBacktestSummary = {
    outputRoot,
    seriesKey,
    requiredEdgeType,
    totalCapturesSeen: slices.length,
    warmupCaptures: Math.min(minTrainingCaptures, slices.length),
    evaluatedCaptures: evaluatedSlices.length,
    minTrainingCaptures,
    trainingWindowCaptures,
    minDepthAdjustedResidual,
    duplicateEdgePolicy: "trade_each_edge_once",
    policies: sortedPolicies
  };

  await writeFile(path.join(outputRoot, "walk-forward-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(outputRoot, "walk-forward-trades.json"),
    `${JSON.stringify(Object.fromEntries([...policyState.entries()].map(([key, value]) => [key, value.trades])), null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    path.join(outputRoot, "walk-forward-captures.json"),
    `${JSON.stringify(Object.fromEntries([...policyState.entries()].map(([key, value]) => [key, value.captures])), null, 2)}\n`,
    "utf8"
  );
  await writeRunManifest({
    pipelineId: "internal-consistency-walk-forward-backtest",
    outputRoot,
    sourceArtifacts: [
      path.join(outputRoot, "walk-forward-summary.json"),
      path.join(outputRoot, "walk-forward-trades.json"),
      path.join(outputRoot, "walk-forward-captures.json")
    ],
    parameters: {
      seriesKey,
      minTrainingCaptures,
      trainingWindowCaptures,
      minDepthAdjustedResidual,
      requiredEdgeType
    },
    summary: {
      totalCapturesSeen: summary.totalCapturesSeen,
      evaluatedCaptures: summary.evaluatedCaptures,
      topPolicy: sortedPolicies[0]?.policyId,
      topPolicyPnlToResolution: sortedPolicies[0]?.cumulativePnlToResolution
    }
  });
  return summary;
}

async function loadCaptureSlices(
  capturesRoot: string,
  seriesKey: string,
  minDepthAdjustedResidual: number,
  requiredEdgeType: RelationshipEdge["edgeType"]
): Promise<CaptureSlice[]> {
  const directories = (await readdir(capturesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const slices = await Promise.all(
    directories.map(async (captureId) => {
      const captureRoot = path.join(capturesRoot, captureId);
      const [observations, simulations, edges] = await Promise.all([
        readJsonFile<InternalConsistencyEdgeObservation[]>(
          path.join(captureRoot, "observations", "internal-consistency.json")
        ).catch(() => []),
        readJsonFile<InternalConsistencyTradeSimulation[]>(
          path.join(captureRoot, "simulations", "internal-consistency.json")
        ).catch(() => []),
        readJsonFile<RelationshipEdge[]>(path.join(captureRoot, "graphs", "edges.json")).catch(() => [])
      ]);
      const edgeContexts = buildEdgeContexts(edges);
      const filteredObservations = observations.filter((observation) => {
        const context = edgeContexts.get(observation.edgeId);
        return (
          context?.seriesKey === seriesKey &&
          context.edgeType === requiredEdgeType &&
          observation.executionSafeFlag &&
          observation.depthAdjustedResidual > minDepthAdjustedResidual
        );
      });
      if (filteredObservations.length === 0) {
        return undefined;
      }
      return {
        captureId,
        captureRoot,
        observations: filteredObservations,
        simulationsByObservationId: buildSimulationMap(simulations),
        edgeContexts
      };
    })
  );

  return slices.filter((slice): slice is CaptureSlice => slice !== undefined);
}

function buildEdgeContexts(edges: RelationshipEdge[]): Map<string, EdgeContext> {
  const contexts = new Map<string, EdgeContext>();
  for (const edge of edges) {
    const contractId = edge.sourceContractIds[0] ?? edge.targetContractIds[0];
    if (!contractId) {
      continue;
    }
    contexts.set(edge.edgeId, {
      edgeId: edge.edgeId,
      seriesKey: extractSeriesKey(contractId),
      eventKey: extractEventKey(contractId),
      edgeType: edge.edgeType
    });
  }
  return contexts;
}

function buildSimulationMap(
  simulations: InternalConsistencyTradeSimulation[]
): Map<string, Map<ExecutionTemplateId, InternalConsistencyTradeSimulation>> {
  const simulationsByObservationId = new Map<string, Map<ExecutionTemplateId, InternalConsistencyTradeSimulation>>();
  for (const simulation of simulations) {
    const byTemplate = simulationsByObservationId.get(simulation.observationId);
    if (byTemplate) {
      byTemplate.set(simulation.executionTemplateId, simulation);
      continue;
    }
    simulationsByObservationId.set(simulation.observationId, new Map([[simulation.executionTemplateId, simulation]]));
  }
  return simulationsByObservationId;
}

function buildTrainingSnapshot(slices: CaptureSlice[]): TrainingSnapshot {
  const edgeResidualRows = new Map<string, number[]>();
  const eventResidualRows = new Map<string, number[]>();

  for (const slice of slices) {
    for (const observation of slice.observations) {
      const context = slice.edgeContexts.get(observation.edgeId);
      if (!context) {
        continue;
      }
      appendResidual(edgeResidualRows, observation.edgeId, observation.depthAdjustedResidual);
      appendResidual(eventResidualRows, context.eventKey, observation.depthAdjustedResidual);
    }
  }

  return {
    edgeResidualMedians: new Map([...edgeResidualRows.entries()].map(([key, values]) => [key, median(values)])),
    eventResidualMedians: new Map([...eventResidualRows.entries()].map(([key, values]) => [key, median(values)]))
  };
}

function buildEligibleOpportunities(
  slice: CaptureSlice,
  trainingSnapshot: TrainingSnapshot,
  seriesKey: string,
  minDepthAdjustedResidual: number
): EligibleOpportunity[] {
  const eligible: EligibleOpportunity[] = [];
  for (const observation of slice.observations) {
    const context = slice.edgeContexts.get(observation.edgeId);
    const simulations = slice.simulationsByObservationId.get(observation.observationId);
    if (!context || !simulations || context.seriesKey !== seriesKey || observation.depthAdjustedResidual <= minDepthAdjustedResidual) {
      continue;
    }

    const selectedTemplateId = "aggressive_all_legs";
    const selectedSimulation = simulations.get(selectedTemplateId);
    if (!selectedSimulation || selectedSimulation.simulatedPnlToResolution === undefined) {
      continue;
    }

    const trailingMedianDepthAdjustedResidual =
      trainingSnapshot.edgeResidualMedians.get(observation.edgeId) ??
      trainingSnapshot.eventResidualMedians.get(context.eventKey) ??
      observation.depthAdjustedResidual;
    eligible.push({
      captureId: slice.captureId,
      eventKey: context.eventKey,
      observation,
      simulationsByTemplate: simulations,
      simulation: selectedSimulation,
      selectedTemplateId,
      trailingMedianDepthAdjustedResidual,
      rankingScore:
        trailingMedianDepthAdjustedResidual * 100 +
        clamp(selectedSimulation.entryFillProbability ?? observation.modeledEntryFillProbability ?? 0.5, 0, 1),
      templateSource: trainingSnapshot.edgeResidualMedians.has(observation.edgeId) ? "event" : "global"
    });
  }
  return eligible.sort((left, right) => right.rankingScore - left.rankingScore);
}

function selectTradesForPolicy(inputs: {
  policy: PolicyConfig;
  eligible: EligibleOpportunity[];
  tradedEdgeIds: Set<string>;
}): PolicyTradeResult[] {
  const ranked = inputs.eligible
    .map((opportunity) => {
      if (inputs.policy.selector === "static_aggressive") {
        const aggressiveSimulation = opportunity.simulationsByTemplate.get("aggressive_all_legs");
        if (!aggressiveSimulation || aggressiveSimulation.simulatedPnlToResolution === undefined) {
          return undefined;
        }
        return {
          ...opportunity,
          selectedTemplateId: "aggressive_all_legs" as ExecutionTemplateId,
          simulation: aggressiveSimulation,
          rankingScore: opportunity.observation.depthAdjustedResidual,
          templateSource: "static" as const
        };
      }
      return opportunity;
    })
    .filter((opportunity): opportunity is EligibleOpportunity => opportunity !== undefined)
    .filter((opportunity) => !inputs.tradedEdgeIds.has(opportunity.observation.edgeId));

  const selected: PolicyTradeResult[] = [];
  const seenEdges = new Set<string>();
  for (const opportunity of ranked) {
    if (inputs.policy.selector === "static_aggressive" && opportunity.selectedTemplateId !== "aggressive_all_legs") {
      continue;
    }
    if (seenEdges.has(opportunity.observation.edgeId)) {
      continue;
    }
    if (selected.length >= inputs.policy.maxTradesPerCapture) {
      break;
    }
    selected.push({
      captureId: opportunity.captureId,
      eventKey: opportunity.eventKey,
      edgeId: opportunity.observation.edgeId,
      observationId: opportunity.observation.observationId,
      executionTemplateId: opportunity.selectedTemplateId,
      templateSource: opportunity.templateSource,
      rankingScore: opportunity.rankingScore,
      trailingMedianDepthAdjustedResidual: opportunity.trailingMedianDepthAdjustedResidual,
      depthAdjustedResidual: opportunity.observation.depthAdjustedResidual,
      entryFillProbability: opportunity.simulation.entryFillProbability ?? null,
      pnlToResolution: opportunity.simulation.simulatedPnlToResolution ?? 0
    });
    seenEdges.add(opportunity.observation.edgeId);
  }
  return selected;
}

function summarizePolicy(
  policy: PolicyConfig,
  trades: PolicyTradeResult[],
  captures: PolicyCaptureResult[]
): PolicyPerformanceSummary {
  const gains = trades.filter((trade) => trade.pnlToResolution > 0).map((trade) => trade.pnlToResolution);
  const losses = trades.filter((trade) => trade.pnlToResolution < 0).map((trade) => trade.pnlToResolution);
  const cumulativeCurve = captures.map((_, index) => sum(captures.slice(0, index + 1).map((capture) => capture.pnlToResolution)));
  const eventGroups = new Map<string, PolicyTradeResult[]>();
  const templateUsage = new Map<string, number>();

  for (const trade of trades) {
    const rows = eventGroups.get(trade.eventKey);
    if (rows) {
      rows.push(trade);
    } else {
      eventGroups.set(trade.eventKey, [trade]);
    }
    templateUsage.set(trade.executionTemplateId, (templateUsage.get(trade.executionTemplateId) ?? 0) + 1);
  }

  const tradedCaptures = captures.filter((capture) => capture.trades > 0);
  return {
    policyId: policy.policyId,
    title: policy.title,
    totalTrades: trades.length,
    uniqueEdgesTraded: new Set(trades.map((trade) => trade.edgeId)).size,
    tradedCaptures: tradedCaptures.length,
    cumulativePnlToResolution: sum(trades.map((trade) => trade.pnlToResolution)),
    averagePnlPerTrade: mean(trades.map((trade) => trade.pnlToResolution)),
    medianPnlPerTrade: trades.length === 0 ? null : median(trades.map((trade) => trade.pnlToResolution)),
    hitRate: ratio(gains.length, trades.length),
    profitFactor: losses.length === 0 ? (gains.length === 0 ? null : null) : sum(gains) / Math.abs(sum(losses)),
    maxDrawdown: computeMaxDrawdown(cumulativeCurve),
    sharpeLike: computeSharpeLike(captures.map((capture) => capture.pnlToResolution)),
    averageTradesPerTradedCapture: ratio(trades.length, tradedCaptures.length),
    averageEntryFillProbability: nullableMean(trades.map((trade) => trade.entryFillProbability)),
    bestCapturePnl: captures.length === 0 ? null : Math.max(...captures.map((capture) => capture.pnlToResolution)),
    worstCapturePnl: captures.length === 0 ? null : Math.min(...captures.map((capture) => capture.pnlToResolution)),
    templateUsage: Object.fromEntries([...templateUsage.entries()].sort(([left], [right]) => left.localeCompare(right))),
    topEvents: [...eventGroups.entries()]
      .map(([eventKey, rows]) => ({
        eventKey,
        trades: rows.length,
        cumulativePnlToResolution: sum(rows.map((row) => row.pnlToResolution)),
        averagePnlPerTrade: mean(rows.map((row) => row.pnlToResolution))
      }))
      .sort((left, right) => right.cumulativePnlToResolution - left.cumulativePnlToResolution)
      .slice(0, 10)
  };
}

function appendResidual(target: Map<string, number[]>, key: string, value: number): void {
  const rows = target.get(key);
  if (rows) {
    rows.push(value);
  } else {
    target.set(key, [value]);
  }
}

async function readJsonFile<T>(target: string): Promise<T> {
  return JSON.parse(await readFile(target, "utf8")) as T;
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

function extractVenueTicker(contractId: string): string {
  return contractId.startsWith("contract::") ? contractId.slice("contract::".length) : contractId;
}

function computeMaxDrawdown(values: number[]): number {
  let peak = 0;
  let running = 0;
  let maxDrawdown = 0;
  for (const value of values) {
    running = value;
    peak = Math.max(peak, running);
    maxDrawdown = Math.min(maxDrawdown, running - peak);
  }
  return maxDrawdown;
}

function computeSharpeLike(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 2) {
    return null;
  }
  const deviation = standardDeviation(clean);
  if (deviation === 0) {
    return null;
  }
  return mean(clean) / deviation * Math.sqrt(clean.length);
}

function nullableMean(values: Array<number | null>): number | null {
  const clean = values.filter((value): value is number => value !== null);
  return clean.length === 0 ? null : mean(clean);
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const ordered = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 0) {
    return ((ordered[midpoint - 1] ?? 0) + (ordered[midpoint] ?? 0)) / 2;
  }
  return ordered[midpoint] ?? 0;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function timestampId(now: Date): string {
  return now.toISOString().replaceAll("-", "").replaceAll(":", "").replaceAll(".", "");
}
