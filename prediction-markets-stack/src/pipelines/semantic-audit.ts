import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BucketDefinition, CanonicalContract, ThresholdDefinition } from "../domain/contracts.js";
import type { RelationshipEdge } from "../domain/graph.js";
import type { SourceEvent } from "../domain/source-events.js";

export interface SemanticAuditOptions {
  outputRoot?: string;
}

export interface SemanticAuditFinding {
  severity: "high" | "medium" | "low";
  code: string;
  message: string;
  evidence?: Record<string, unknown>;
}

export interface SemanticAuditSummary {
  outputRoot: string;
  checkedAtIso: string;
  findings: SemanticAuditFinding[];
  metrics: Record<string, number>;
}

export async function runSemanticAudit(
  options: SemanticAuditOptions = {}
): Promise<SemanticAuditSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const [contracts, thresholds, buckets, edges, candidateMarkets, captureSummary, discoveryEvents, internalObservations, externalAnchorSummary, btcReadiness] =
    await Promise.all([
      readJsonFile<CanonicalContract[]>(path.join(outputRoot, "normalized", "contracts.json")),
      readJsonFile<ThresholdDefinition[]>(path.join(outputRoot, "normalized", "thresholds.json")),
      readJsonFile<BucketDefinition[]>(path.join(outputRoot, "normalized", "buckets.json")),
      readJsonFile<RelationshipEdge[]>(path.join(outputRoot, "graphs", "edges.json")),
      readJsonFile<Array<{ ticker: string }>>(path.join(outputRoot, "summaries", "candidate-markets.json")),
      readJsonFile<{
        targetSeriesTickers?: string[];
        seriesSelectionDiagnostics?: Array<{
          seriesTicker: string;
          tradableCandidates: number;
          selectedCandidates: number;
          selectionMode: string;
        }>;
      }>(path.join(outputRoot, "summaries", "capture-summary.json")),
      readJsonLines<SourceEvent>(path.join(outputRoot, "raw", "discovery")),
      readJsonFile<Array<{ qualityFlags: string[]; executionSafeFlag: boolean }>>(
        path.join(outputRoot, "observations", "internal-consistency.json")
      ),
      readOptionalJsonFile<{
        mappedAnchors: number;
        tradableObservations: number;
        nonTradableAnchors: number;
        inactiveReasons?: Record<string, number>;
        coverageStatus?: string;
        blockerReason?: string;
      }>(path.join(outputRoot, "observations", "external-anchor-btc-summary.json")),
      readOptionalJsonFile<{
        tradableFamilies: number;
        bestTradableFamily?: string;
        nextOpenFamily?: string;
        nextOpenTimeMs?: number;
      }>(path.join(outputRoot, "summaries", "btc-market-readiness.json"))
    ]);

  const findings: SemanticAuditFinding[] = [];
  const bucketByContractId = new Map(buckets.map((bucket) => [bucket.contractId, bucket]));
  const thresholdByContractId = new Map(thresholds.map((threshold) => [threshold.contractId, threshold]));
  const contractById = new Map(contracts.map((contract) => [contract.contractId, contract]));

  for (const event of discoveryEvents) {
    const payload = parseJsonSafely<{ markets?: unknown[] }>(event.rawPayload);
    if (!payload || !Array.isArray(payload.markets)) {
      findings.push({
        severity: "high",
        code: "discovery_not_page_payload",
        message: "A discovery raw event does not contain a paginated /markets payload.",
        evidence: {
          sourceEventId: event.sourceEventId,
          endpointOrStream: event.endpointOrStream
        }
      });
    }
  }

  const coveredSeries = new Set(
    candidateMarkets
      .map((candidate) => candidate.ticker.split("-")[0])
      .filter((value): value is string => Boolean(value))
  );
  const seriesDiagnostics = new Map(
    (captureSummary.seriesSelectionDiagnostics ?? []).map((row) => [row.seriesTicker, row] as const)
  );
  for (const seriesTicker of captureSummary.targetSeriesTickers ?? []) {
    if (!coveredSeries.has(seriesTicker)) {
      const diagnostic = seriesDiagnostics.get(seriesTicker);
      if (diagnostic?.selectionMode === "skipped_no_tradable_candidates") {
        findings.push({
          severity: "high",
          code: "target_series_skipped_no_tradable_candidates",
          message: "A requested target series had no tradable candidates and was intentionally excluded from capture.",
          evidence: {
            seriesTicker,
            tradableCandidates: diagnostic.tradableCandidates,
            ...(btcReadiness?.nextOpenFamily ? { nextOpenFamily: btcReadiness.nextOpenFamily } : {}),
            ...(btcReadiness?.nextOpenTimeMs ? { nextOpenTimeMs: btcReadiness.nextOpenTimeMs } : {})
          }
        });
        continue;
      }
      findings.push({
        severity: "medium",
        code: "target_series_not_covered",
        message: "A target series ticker was requested but did not appear in candidate markets.",
        evidence: { seriesTicker }
      });
    }
  }

  const flaggedObservations = internalObservations.filter((observation) => observation.qualityFlags.length > 0).length;
  if (flaggedObservations === internalObservations.length && internalObservations.length > 0) {
    findings.push({
      severity: "high",
      code: "all_internal_observations_flagged",
      message: "Every internal-consistency observation carries quality flags, so the slice is not decision-ready.",
      evidence: { observations: internalObservations.length }
    });
  }
  if (
    internalObservations.length > 0 &&
    internalObservations.every(
      (observation) =>
        observation.qualityFlags.includes("missing_settlement_source") && observation.executionSafeFlag
    )
  ) {
    findings.push({
      severity: "high",
      code: "execution_safe_with_blocking_flags",
      message: "Internal observations were marked execution-safe despite blocking quality flags.",
      evidence: { observations: internalObservations.length }
    });
  }

  if (externalAnchorSummary?.coverageStatus === "no_anchor_contracts_captured") {
    findings.push({
      severity: "high",
      code: "anchor_slice_without_contract_coverage",
      message: "The BTC anchor sleeve captured no evaluable BTC contracts for this slice.",
      evidence: {
        blockerReason: externalAnchorSummary.blockerReason ?? "unknown",
        targetSeriesTicker: "KXBTC",
        ...(btcReadiness?.nextOpenFamily ? { nextOpenFamily: btcReadiness.nextOpenFamily } : {}),
        ...(btcReadiness?.nextOpenTimeMs ? { nextOpenTimeMs: btcReadiness.nextOpenTimeMs } : {}),
        ...(btcReadiness?.bestTradableFamily ? { bestTradableFamily: btcReadiness.bestTradableFamily } : {})
      }
    });
  }

  if (
    externalAnchorSummary &&
    externalAnchorSummary.mappedAnchors > 0 &&
    externalAnchorSummary.tradableObservations === 0
  ) {
    findings.push({
      severity: "high",
      code: "anchor_slice_without_tradable_observations",
      message: "The BTC anchor slice mapped contracts but produced zero tradable observations.",
      evidence: {
        mappedAnchors: externalAnchorSummary.mappedAnchors,
        nonTradableAnchors: externalAnchorSummary.nonTradableAnchors,
        inactiveReasons: externalAnchorSummary.inactiveReasons ?? {}
      }
    });
  }

  for (const threshold of thresholds) {
    if (threshold.evaluationTimestampMs === undefined) {
      findings.push({
        severity: "medium",
        code: "threshold_missing_evaluation_time",
        message: "A threshold contract is missing its evaluation timestamp.",
        evidence: { thresholdId: threshold.thresholdId, contractId: threshold.contractId }
      });
    }
    if (!threshold.referencePriceDefinition) {
      findings.push({
        severity: "low",
        code: "threshold_missing_reference_source",
        message: "A threshold contract is missing a parsed reference-price definition.",
        evidence: { thresholdId: threshold.thresholdId, contractId: threshold.contractId }
      });
    }
  }

  for (const edge of edges) {
    if (edge.edgeType === "partition_sum") {
      const involvedBuckets = edge.sourceContractIds
        .map((contractId) => bucketByContractId.get(contractId))
        .filter((bucket): bucket is BucketDefinition => Boolean(bucket));
      if (!involvedBuckets.every((bucket) => bucket.isExhaustiveClaimed)) {
        findings.push({
          severity: "high",
          code: "false_partition_sum",
          message: "A partition_sum edge was emitted for a non-exhaustive bucket set.",
          evidence: { edgeId: edge.edgeId }
        });
      }
    }

    if (edge.edgeType === "threshold_monotone" && edge.sourceContractIds[0] && edge.targetContractIds[0]) {
      const left = thresholdByContractId.get(edge.sourceContractIds[0]);
      const right = thresholdByContractId.get(edge.targetContractIds[0]);
      if (left && right) {
        const leftFamily = left.comparisonOperator === ">" || left.comparisonOperator === ">=" ? "upper" : "lower";
        const rightFamily =
          right.comparisonOperator === ">" || right.comparisonOperator === ">=" ? "upper" : "lower";
        if (left.referenceVariable !== right.referenceVariable || leftFamily !== rightFamily) {
          findings.push({
            severity: "high",
            code: "invalid_threshold_monotone",
            message: "A threshold_monotone edge links incompatible threshold families.",
            evidence: {
              edgeId: edge.edgeId,
              leftContractId: left.contractId,
              rightContractId: right.contractId
            }
          });
        }
      }
    }
  }

  for (const contract of contracts) {
    if (contract.contractType === "threshold_binary" && !contract.settlementTimezone) {
      findings.push({
        severity: "medium",
        code: "threshold_contract_missing_timezone",
        message: "A threshold contract is missing settlement timezone semantics.",
        evidence: { contractId: contract.contractId, venueContractId: contract.venueContractId }
      });
    }
    if (contract.contractType !== "binary" && contract.rulesText.length < 40) {
      findings.push({
        severity: "medium",
        code: "sparse_rules_text",
        message: "A non-binary canonical contract has unusually sparse rules text.",
        evidence: { contractId: contract.contractId, venueContractId: contract.venueContractId }
      });
    }
  }

  for (const bucket of buckets) {
    if (!contractById.has(bucket.contractId)) {
      findings.push({
        severity: "high",
        code: "bucket_without_contract",
        message: "A bucket definition points to a missing contract.",
        evidence: { bucketId: bucket.bucketId, contractId: bucket.contractId }
      });
    }
  }

  const summary: SemanticAuditSummary = {
    outputRoot,
    checkedAtIso: new Date().toISOString(),
    findings,
    metrics: {
      contracts: contracts.length,
      thresholds: thresholds.length,
      buckets: buckets.length,
      edges: edges.length,
      discoveryEvents: discoveryEvents.length,
      findingsHigh: findings.filter((finding) => finding.severity === "high").length,
      findingsMedium: findings.filter((finding) => finding.severity === "medium").length,
      findingsLow: findings.filter((finding) => finding.severity === "low").length
    }
  };

  await writeFile(
    path.join(outputRoot, "summaries", "semantic-audit.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );

  return summary;
}

async function resolveLatestCaptureRoot(cwd: string): Promise<string> {
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

async function readJsonFile<T>(target: string): Promise<T> {
  const raw = await readFile(target, "utf8");
  return JSON.parse(raw) as T;
}

async function readOptionalJsonFile<T>(target: string): Promise<T | null> {
  try {
    await stat(target);
  } catch {
    return null;
  }
  return readJsonFile<T>(target);
}

async function readJsonLines<T>(dir: string): Promise<T[]> {
  const entries = (await readdir(dir)).sort();
  const records: T[] = [];
  for (const entry of entries) {
    const raw = await readFile(path.join(dir, entry), "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) {
        continue;
      }
      records.push(JSON.parse(line) as T);
    }
  }
  return records;
}

function parseJsonSafely<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
