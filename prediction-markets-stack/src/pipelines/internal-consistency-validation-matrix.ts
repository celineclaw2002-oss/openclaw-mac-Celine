import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RelationshipEdge } from "../domain/graph.js";
import type { InternalConsistencyEdgeObservation } from "../domain/observations.js";
import { runInternalConsistencyWalkForwardBacktest } from "./internal-consistency-walk-forward-backtest.js";
import { writeRunManifest } from "../shared/run-manifest.js";

interface SeriesDiscoveryStats {
  captures: Set<string>;
  observations: number;
}

interface SeriesEligibilitySummary {
  seriesKey: string;
  capturesSeen: number;
  observationsSeen: number;
  eligibleForWalkForward: boolean;
  eligibilityReasons: string[];
}

export interface ValidationGateConfig {
  minCapturesSeen: number;
  minObservationsSeen: number;
  minEvaluatedCaptures: number;
  minTrades: number;
  minTradedCaptures: number;
  minUniqueEvents: number;
  minAverageEntryFillProbability: number;
  minSharpeLike: number;
  minHitRate: number;
}

export interface InternalConsistencyValidationRow {
  seriesKey: string;
  capturesSeen: number;
  observationsSeen: number;
  requiredEdgeType: RelationshipEdge["edgeType"];
  walkForwardOutputRoot?: string;
  evaluatedCaptures?: number;
  totalTrades?: number;
  tradedCaptures?: number;
  uniqueEvents?: number;
  cumulativePnlToResolution?: number;
  averagePnlPerTrade?: number;
  averageEntryFillProbability?: number | null;
  hitRate?: number;
  sharpeLike?: number | null;
  verdict: "promising" | "watchlist" | "weak" | "insufficient_evidence";
  failedGates: string[];
}

export interface InternalConsistencyValidationMatrixSummary {
  generatedAtIso: string;
  capturesRoot: string;
  requiredEdgeType: RelationshipEdge["edgeType"];
  seriesDiscovered: number;
  eligibleSeries: number;
  gateConfig: ValidationGateConfig;
  rows: InternalConsistencyValidationRow[];
  recommendation: string;
}

export interface InternalConsistencyValidationMatrixOptions {
  capturesRoot?: string;
  outputRoot?: string;
  requiredEdgeType?: RelationshipEdge["edgeType"];
  minCapturesSeen?: number;
  minObservationsSeen?: number;
  minEvaluatedCaptures?: number;
  minTrades?: number;
  minTradedCaptures?: number;
  minUniqueEvents?: number;
  minAverageEntryFillProbability?: number;
  minSharpeLike?: number;
  minHitRate?: number;
  minTrainingCaptures?: number;
  trainingWindowCaptures?: number;
  minDepthAdjustedResidual?: number;
}

export async function runInternalConsistencyValidationMatrix(
  options: InternalConsistencyValidationMatrixOptions = {}
): Promise<InternalConsistencyValidationMatrixSummary> {
  const capturesRoot = options.capturesRoot ?? path.resolve(process.cwd(), "data", "kalshi-live");
  const outputRoot =
    options.outputRoot ??
    path.resolve(process.cwd(), "data", "backtests", "internal-consistency-validation-matrix", timestampId(new Date()));
  const requiredEdgeType = options.requiredEdgeType ?? "temporal_nested";
  const gateConfig: ValidationGateConfig = {
    minCapturesSeen: options.minCapturesSeen ?? 8,
    minObservationsSeen: options.minObservationsSeen ?? 100,
    minEvaluatedCaptures: options.minEvaluatedCaptures ?? 4,
    minTrades: options.minTrades ?? 6,
    minTradedCaptures: options.minTradedCaptures ?? 3,
    minUniqueEvents: options.minUniqueEvents ?? 3,
    minAverageEntryFillProbability: options.minAverageEntryFillProbability ?? 0.7,
    minSharpeLike: options.minSharpeLike ?? 0.5,
    minHitRate: options.minHitRate ?? 0.55
  };
  const minTrainingCaptures = options.minTrainingCaptures ?? 6;
  const trainingWindowCaptures = options.trainingWindowCaptures ?? 12;
  const minDepthAdjustedResidual = options.minDepthAdjustedResidual ?? 5;

  await mkdir(outputRoot, { recursive: true });
  const discovered = await discoverSeries(capturesRoot, requiredEdgeType);
  const eligibility = [...discovered.entries()]
    .map(([seriesKey, stats]) => summarizeEligibility(seriesKey, stats, gateConfig))
    .sort((left, right) => right.observationsSeen - left.observationsSeen);

  const rows: InternalConsistencyValidationRow[] = [];
  for (const series of eligibility) {
    if (!series.eligibleForWalkForward) {
      rows.push({
        seriesKey: series.seriesKey,
        capturesSeen: series.capturesSeen,
        observationsSeen: series.observationsSeen,
        requiredEdgeType,
        verdict: "insufficient_evidence",
        failedGates: series.eligibilityReasons
      });
      continue;
    }

    const walkForward = await runInternalConsistencyWalkForwardBacktest({
      capturesRoot,
      outputRoot: path.join(outputRoot, series.seriesKey),
      seriesKey: series.seriesKey,
      requiredEdgeType,
      minTrainingCaptures,
      trainingWindowCaptures,
      minDepthAdjustedResidual
    });
    const tradesPath = path.join(walkForward.outputRoot, "walk-forward-trades.json");
    const trades = JSON.parse(await readFile(tradesPath, "utf8")) as Record<
      string,
      Array<{ eventKey: string; entryFillProbability: number | null }>
    >;
    const topPolicy = walkForward.policies[0];
    const topPolicyTrades = trades[topPolicy?.policyId ?? ""] ?? [];
    const uniqueEvents = new Set(topPolicyTrades.map((trade) => trade.eventKey)).size;
    const failedGates = evaluateWalkForwardGates(walkForward, topPolicy, uniqueEvents, gateConfig);
    rows.push({
      seriesKey: series.seriesKey,
      capturesSeen: series.capturesSeen,
      observationsSeen: series.observationsSeen,
      requiredEdgeType,
      walkForwardOutputRoot: walkForward.outputRoot,
      evaluatedCaptures: walkForward.evaluatedCaptures,
      totalTrades: topPolicy?.totalTrades ?? 0,
      tradedCaptures: topPolicy?.tradedCaptures ?? 0,
      uniqueEvents,
      cumulativePnlToResolution: topPolicy?.cumulativePnlToResolution ?? 0,
      averagePnlPerTrade: topPolicy?.averagePnlPerTrade ?? 0,
      averageEntryFillProbability: topPolicy?.averageEntryFillProbability ?? null,
      hitRate: topPolicy?.hitRate ?? 0,
      sharpeLike: topPolicy?.sharpeLike ?? null,
      verdict: deriveVerdict(failedGates, topPolicy?.cumulativePnlToResolution ?? 0),
      failedGates
    });
  }

  const summary: InternalConsistencyValidationMatrixSummary = {
    generatedAtIso: new Date().toISOString(),
    capturesRoot,
    requiredEdgeType,
    seriesDiscovered: eligibility.length,
    eligibleSeries: eligibility.filter((row) => row.eligibleForWalkForward).length,
    gateConfig,
    rows: rows.sort(compareValidationRows),
    recommendation: buildRecommendation(rows)
  };

  const summaryPath = path.join(outputRoot, "validation-matrix-summary.json");
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeRunManifest({
    pipelineId: "internal-consistency-validation-matrix",
    outputRoot,
    sourceArtifacts: [summaryPath],
    parameters: {
      requiredEdgeType,
      minTrainingCaptures,
      trainingWindowCaptures,
      minDepthAdjustedResidual,
      gateConfig
    },
    summary: {
      seriesDiscovered: summary.seriesDiscovered,
      eligibleSeries: summary.eligibleSeries,
      promisingSeries: summary.rows.filter((row) => row.verdict === "promising").map((row) => row.seriesKey)
    }
  });
  return summary;
}

async function discoverSeries(
  capturesRoot: string,
  requiredEdgeType: RelationshipEdge["edgeType"]
): Promise<Map<string, SeriesDiscoveryStats>> {
  const directories = (await readdir(capturesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const discovered = new Map<string, SeriesDiscoveryStats>();

  for (const captureId of directories) {
    const captureRoot = path.join(capturesRoot, captureId);
    const observations = await readJsonIfPresent<InternalConsistencyEdgeObservation[]>(
      path.join(captureRoot, "observations", "internal-consistency.json")
    );
    const edges = await readJsonIfPresent<Array<{ edgeId: string; edgeType: RelationshipEdge["edgeType"]; sourceContractIds?: string[]; targetContractIds?: string[] }>>(
      path.join(captureRoot, "graphs", "edges.json")
    );
    if (!observations || !edges) {
      continue;
    }
    const edgeSeries = new Map<string, string>();
    for (const edge of edges) {
      if (edge.edgeType !== requiredEdgeType) {
        continue;
      }
      const contractId = edge.sourceContractIds?.[0] ?? edge.targetContractIds?.[0];
      if (!contractId) {
        continue;
      }
      edgeSeries.set(edge.edgeId, extractSeriesKey(contractId));
    }
    for (const observation of observations) {
      const seriesKey = edgeSeries.get(observation.edgeId);
      if (!seriesKey) {
        continue;
      }
      const stats = discovered.get(seriesKey) ?? { captures: new Set<string>(), observations: 0 };
      stats.captures.add(captureId);
      stats.observations += 1;
      discovered.set(seriesKey, stats);
    }
  }

  return discovered;
}

function summarizeEligibility(
  seriesKey: string,
  stats: SeriesDiscoveryStats,
  gateConfig: ValidationGateConfig
): SeriesEligibilitySummary {
  const reasons: string[] = [];
  if (stats.captures.size < gateConfig.minCapturesSeen) {
    reasons.push(`captures_seen_below_${gateConfig.minCapturesSeen}`);
  }
  if (stats.observations < gateConfig.minObservationsSeen) {
    reasons.push(`observations_seen_below_${gateConfig.minObservationsSeen}`);
  }
  return {
    seriesKey,
    capturesSeen: stats.captures.size,
    observationsSeen: stats.observations,
    eligibleForWalkForward: reasons.length === 0,
    eligibilityReasons: reasons
  };
}

function evaluateWalkForwardGates(
  walkForward: Awaited<ReturnType<typeof runInternalConsistencyWalkForwardBacktest>>,
  topPolicy: Awaited<ReturnType<typeof runInternalConsistencyWalkForwardBacktest>>["policies"][number] | undefined,
  uniqueEvents: number,
  gateConfig: ValidationGateConfig
): string[] {
  const failed: string[] = [];
  if (walkForward.evaluatedCaptures < gateConfig.minEvaluatedCaptures) {
    failed.push(`evaluated_captures_below_${gateConfig.minEvaluatedCaptures}`);
  }
  if ((topPolicy?.totalTrades ?? 0) < gateConfig.minTrades) {
    failed.push(`trades_below_${gateConfig.minTrades}`);
  }
  if ((topPolicy?.tradedCaptures ?? 0) < gateConfig.minTradedCaptures) {
    failed.push(`traded_captures_below_${gateConfig.minTradedCaptures}`);
  }
  if (uniqueEvents < gateConfig.minUniqueEvents) {
    failed.push(`unique_events_below_${gateConfig.minUniqueEvents}`);
  }
  if ((topPolicy?.averageEntryFillProbability ?? 0) < gateConfig.minAverageEntryFillProbability) {
    failed.push(`average_fill_probability_below_${gateConfig.minAverageEntryFillProbability}`);
  }
  if ((topPolicy?.hitRate ?? 0) < gateConfig.minHitRate) {
    failed.push(`hit_rate_below_${gateConfig.minHitRate}`);
  }
  if ((topPolicy?.sharpeLike ?? Number.NEGATIVE_INFINITY) < gateConfig.minSharpeLike) {
    failed.push(`sharpe_like_below_${gateConfig.minSharpeLike}`);
  }
  if ((topPolicy?.cumulativePnlToResolution ?? 0) <= 0) {
    failed.push("non_positive_cumulative_pnl");
  }
  return failed;
}

function deriveVerdict(
  failedGates: string[],
  cumulativePnlToResolution: number
): InternalConsistencyValidationRow["verdict"] {
  if (failedGates.some((gate) => gate.startsWith("captures_seen_below_") || gate.startsWith("observations_seen_below_"))) {
    return "insufficient_evidence";
  }
  if (failedGates.length === 0) {
    return "promising";
  }
  if (cumulativePnlToResolution > 0 && failedGates.length <= 2) {
    return "watchlist";
  }
  return "weak";
}

function buildRecommendation(rows: InternalConsistencyValidationRow[]): string {
  const promising = rows.filter((row) => row.verdict === "promising");
  if (promising.length > 0) {
    return `Promote deeper research on ${promising.map((row) => row.seriesKey).join(", ")} while keeping explicit sample-size gates in place.`;
  }
  const watchlist = rows.filter((row) => row.verdict === "watchlist");
  if (watchlist.length > 0) {
    return `No series clears the full alpha gates yet. Keep ${watchlist.map((row) => row.seriesKey).join(", ")} on watch and collect more independent captures and event diversity before promotion.`;
  }
  return "No internal-consistency series currently clears the minimum validation bar. Collect more captures or expand the target market families before claiming credible alpha.";
}

function compareValidationRows(left: InternalConsistencyValidationRow, right: InternalConsistencyValidationRow): number {
  const verdictScore = verdictRank(right.verdict) - verdictRank(left.verdict);
  if (verdictScore !== 0) {
    return verdictScore;
  }
  return (right.cumulativePnlToResolution ?? 0) - (left.cumulativePnlToResolution ?? 0);
}

function verdictRank(verdict: InternalConsistencyValidationRow["verdict"]): number {
  switch (verdict) {
    case "promising":
      return 4;
    case "watchlist":
      return 3;
    case "weak":
      return 2;
    case "insufficient_evidence":
      return 1;
  }
}

async function readJsonIfPresent<T>(target: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(target, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function extractSeriesKey(contractId: string): string {
  const ticker = contractId.startsWith("contract::") ? contractId.slice("contract::".length) : contractId;
  return ticker.split("-")[0] ?? ticker;
}

function timestampId(now: Date): string {
  return now.toISOString().replaceAll("-", "").replaceAll(":", "").replaceAll(".", "");
}
