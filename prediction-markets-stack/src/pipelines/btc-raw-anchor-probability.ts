import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AnchorProbabilityState } from "../domain/anchors.js";

export interface BtcRawAnchorProbabilityOptions {
  outputRoot?: string;
}

interface MappingAuditSummary {
  rows: Array<{
    contractId: string;
    venueContractId: string;
    marketStructure: "threshold" | "bucket";
    comparisonOperator: ">" | ">=" | "<" | "<=";
    thresholdValue: number;
    bucketLowerBound?: number;
    bucketUpperBound?: number;
    evaluationTimestampMs?: number;
    mappingConfidenceScore: number;
    qualityFlags: string[];
    nearestDeribitFuture?: string;
  }>;
}

interface DeribitFutureSelected {
  instrument_name: string;
  expiration_timestamp: number;
  book?: {
    underlying_price?: number | null;
    mid_price?: number | null;
    mark_price?: number | null;
  };
}

interface DeribitAnchorSummary {
  recordedAtMs?: number;
}

interface DeribitOptionSelected {
  instrument_name: string;
  expiration_timestamp: number;
  strike?: number;
  option_type?: string;
  book?: {
    mark_iv?: number | null;
    underlying_price?: number | null;
  };
}

export interface BtcRawAnchorProbabilitySummary {
  outputRoot: string;
  checkedAtIso: string;
  anchorsBuilt: number;
  anchorModelVersion: string;
}

export async function runBtcRawAnchorProbability(
  options: BtcRawAnchorProbabilityOptions = {}
): Promise<BtcRawAnchorProbabilitySummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const [mappingAudit, selectedFutures, selectedOptions, coinbaseSpot, deribitSummary] = await Promise.all([
    readJsonFile<MappingAuditSummary>(path.join(outputRoot, "anchors", "btc-anchor-mapping-audit.json")),
    readJsonFile<DeribitFutureSelected[]>(path.join(outputRoot, "anchors", "deribit-btc-futures-selected.json")),
    readJsonFile<DeribitOptionSelected[]>(path.join(outputRoot, "anchors", "deribit-btc-options-selected.json")),
    readJsonFile<{ price: number }>(path.join(outputRoot, "anchors", "coinbase-btc-spot-summary.json")),
    readJsonFile<DeribitAnchorSummary>(path.join(outputRoot, "anchors", "deribit-btc-anchor-summary.json"))
  ]);

  const futuresByName = new Map(selectedFutures.map((future) => [future.instrument_name, future]));
  const anchors: AnchorProbabilityState[] = [];

  for (const row of mappingAudit.rows) {
    if (row.evaluationTimestampMs === undefined || !row.nearestDeribitFuture) {
      continue;
    }
    if (deribitSummary.recordedAtMs === undefined || row.evaluationTimestampMs <= deribitSummary.recordedAtMs) {
      continue;
    }
    const future = futuresByName.get(row.nearestDeribitFuture);
    if (!future) {
      continue;
    }
    const forwardPrice =
      future.book?.underlying_price ?? future.book?.mark_price ?? future.book?.mid_price ?? coinbaseSpot.price;
    if (!Number.isFinite(forwardPrice) || forwardPrice <= 0) {
      continue;
    }
    const timeToExpiryYears =
      (row.evaluationTimestampMs - deribitSummary.recordedAtMs) / (365.25 * 24 * 3_600_000);
    const atmVol = estimateAtmVol(selectedOptions, forwardPrice, row.evaluationTimestampMs);
    const rawProbability =
      row.marketStructure === "bucket"
        ? computeBucketProbability(
            row.bucketLowerBound,
            row.bucketUpperBound,
            forwardPrice,
            atmVol,
            timeToExpiryYears
          )
        : computeThresholdProbability(
            row.comparisonOperator,
            forwardPrice,
            row.thresholdValue,
            atmVol,
            timeToExpiryYears
          );
    const uncertaintyBand = Math.max(0.03, Math.min(0.15, atmVol * Math.sqrt(timeToExpiryYears) * 0.25));

    anchors.push({
      anchorFamily: row.marketStructure === "bucket" ? "btc_ranges" : "btc_thresholds",
      contractId: row.contractId,
      observationTimeMs: deribitSummary.recordedAtMs,
      rawProbability,
      uncertaintyBandLow: Math.max(0, rawProbability - uncertaintyBand),
      uncertaintyBandHigh: Math.min(1, rawProbability + uncertaintyBand),
      mappingConfidenceScore: row.mappingConfidenceScore,
      latencyConfidenceScore: row.qualityFlags.length === 0 ? 0.85 : 0.7,
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: "btc-raw-anchor-v1",
      anchorModelVersion: "btc-lognormal-proxy-v1",
      calibrationVersion: "uncalibrated"
    });
  }

  await writeFile(
    path.join(outputRoot, "anchors", "btc-raw-anchor-probabilities.json"),
    `${JSON.stringify(anchors, null, 2)}\n`,
    "utf8"
  );

  const checkedAtMs = deribitSummary.recordedAtMs ?? anchors[0]?.observationTimeMs ?? 0;
  const summary: BtcRawAnchorProbabilitySummary = {
    outputRoot,
    checkedAtIso: checkedAtMs > 0 ? new Date(checkedAtMs).toISOString() : "1970-01-01T00:00:00.000Z",
    anchorsBuilt: anchors.length,
    anchorModelVersion: "btc-lognormal-proxy-v1"
  };

  await writeFile(
    path.join(outputRoot, "anchors", "btc-raw-anchor-summary.json"),
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
  return JSON.parse(await readFile(target, "utf8")) as T;
}

function estimateAtmVol(
  options: DeribitOptionSelected[],
  forwardPrice: number,
  evaluationTimestampMs: number
): number {
  const filtered = options
    .filter(
      (option) =>
        option.expiration_timestamp >= evaluationTimestampMs &&
        option.expiration_timestamp - evaluationTimestampMs <= 7 * 24 * 3_600_000
    )
    .filter((option) => option.strike !== undefined && option.book?.mark_iv != null)
    .sort((left, right) => {
      return Math.abs((left.strike ?? forwardPrice) - forwardPrice) - Math.abs((right.strike ?? forwardPrice) - forwardPrice);
    })
    .slice(0, 6)
    .map((option) => (option.book?.mark_iv ?? 50) / 100);

  if (filtered.length === 0) {
    return 0.5;
  }
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function computeThresholdProbability(
  operator: ">" | ">=" | "<" | "<=",
  forwardPrice: number,
  strike: number,
  sigma: number,
  timeToExpiryYears: number
): number {
  const volSqrtT = Math.max(sigma * Math.sqrt(timeToExpiryYears), 1e-6);
  const d2 = (Math.log(forwardPrice / strike) - 0.5 * sigma * sigma * timeToExpiryYears) / volSqrtT;
  const aboveProbability = normalCdf(d2);
  if (operator === ">" || operator === ">=") {
    return clamp01(aboveProbability);
  }
  return clamp01(1 - aboveProbability);
}

function computeBucketProbability(
  lowerBound: number | undefined,
  upperBound: number | undefined,
  forwardPrice: number,
  sigma: number,
  timeToExpiryYears: number
): number {
  if (lowerBound === undefined || upperBound === undefined) {
    return 0;
  }
  const aboveLower = computeThresholdProbability(">", forwardPrice, lowerBound, sigma, timeToExpiryYears);
  const aboveUpper = computeThresholdProbability(">", forwardPrice, upperBound, sigma, timeToExpiryYears);
  return clamp01(aboveLower - aboveUpper);
}

function normalCdf(value: number): number {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
