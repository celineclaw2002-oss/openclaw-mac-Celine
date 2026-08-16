import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BucketDefinition, CanonicalContract, ThresholdDefinition } from "../domain/contracts.js";
import type { MetadataStageRecord } from "../domain/source-events.js";

export interface BtcAnchorMappingAuditOptions {
  outputRoot?: string;
}

export interface BtcAnchorMappingRow {
  contractId: string;
  venueContractId: string;
  marketStructure: "threshold" | "bucket";
  comparisonOperator: ">" | ">=" | "<" | "<=";
  thresholdValue: number;
  bucketLowerBound?: number;
  bucketUpperBound?: number;
  evaluationTimestampMs?: number;
  evaluationTimezone?: string;
  referencePriceDefinition?: string;
  settlementTimestampConvention?: string;
  referenceSpotPrice?: number;
  thresholdDistanceFromSpot?: number;
  thresholdDistancePctFromSpot?: number;
  nearestDeribitFuture?: string;
  nearestDeribitFutureExpiryMs?: number;
  nearestFutureTimeGapHours?: number;
  relevantDeribitOptionCount: number;
  mappingConfidenceScore: number;
  qualityFlags: string[];
}

export interface BtcAnchorMappingAuditSummary {
  outputRoot: string;
  checkedAtIso: string;
  btcContractsInCapture: number;
  btcThresholdContracts: number;
  btcBucketContracts: number;
  scopeNote: string;
  rows: BtcAnchorMappingRow[];
}

interface DeribitSelectedFuture {
  instrument_name: string;
  expiration_timestamp: number;
}

interface DeribitSelectedOption {
  instrument_name: string;
  expiration_timestamp: number;
  strike?: number;
}

export async function runBtcAnchorMappingAudit(
  options: BtcAnchorMappingAuditOptions = {}
): Promise<BtcAnchorMappingAuditSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const [captureSummary, contracts, thresholds, buckets, metadataRecords, coinbaseSpot, deribitFutures, deribitOptions] = await Promise.all([
    readOptionalJsonFile<{ captureCompletedAtMs?: number }>(path.join(outputRoot, "summaries", "capture-summary.json")),
    readJsonFile<CanonicalContract[]>(path.join(outputRoot, "normalized", "contracts.json")),
    readJsonFile<ThresholdDefinition[]>(path.join(outputRoot, "normalized", "thresholds.json")),
    readJsonFile<BucketDefinition[]>(path.join(outputRoot, "normalized", "buckets.json")),
    readJsonFile<MetadataStageRecord[]>(path.join(outputRoot, "staging", "metadata-records.json")),
    readOptionalJsonFile<{ price?: number }>(path.join(outputRoot, "anchors", "coinbase-btc-spot-summary.json")),
    readOptionalJsonFile<DeribitSelectedFuture[]>(path.join(outputRoot, "anchors", "deribit-btc-futures-selected.json")),
    readOptionalJsonFile<DeribitSelectedOption[]>(path.join(outputRoot, "anchors", "deribit-btc-options-selected.json"))
  ]);

  const contractById = new Map(contracts.map((contract) => [contract.contractId, contract]));
  const metadataByVenueContractId = new Map(
    metadataRecords.map((record) => [record.venueContractId, record] as const)
  );
  const btcContracts = contracts.filter((contract) => contract.eventFamilyId === "family::btc_threshold_primary::btc_usd");
  const btcThresholds = thresholds.filter((threshold) => threshold.referenceVariable === "btc_usd");
  const btcBuckets = buckets.filter((bucket) => bucket.bucketGroupId === "bucket_group::btc_usd");
  const referenceSpotPrice = coinbaseSpot?.price;

  const thresholdRows = btcThresholds.map((threshold) => {
    const contract = contractById.get(threshold.contractId);
    const nearestFuture = chooseNearestFuture(threshold.evaluationTimestampMs, deribitFutures ?? []);
    const relevantOptionCount = countRelevantOptions(
      threshold.evaluationTimestampMs,
      threshold.thresholdValue,
      deribitOptions ?? []
    );
    const thresholdDistanceFromSpot =
      referenceSpotPrice === undefined ? undefined : threshold.thresholdValue - referenceSpotPrice;
    const thresholdDistancePctFromSpot =
      referenceSpotPrice === undefined ? undefined : (threshold.thresholdValue - referenceSpotPrice) / referenceSpotPrice;
    const qualityFlags: string[] = [];
    if (!threshold.referencePriceDefinition) {
      qualityFlags.push("missing_reference_price_definition");
    }
    if (threshold.evaluationTimestampMs === undefined) {
      qualityFlags.push("missing_evaluation_timestamp");
    }
    if (nearestFuture === undefined) {
      qualityFlags.push("missing_nearest_deribit_future");
    }
    if (relevantOptionCount === 0) {
      qualityFlags.push("no_relevant_deribit_options_selected");
    }
    if (referenceSpotPrice === undefined) {
      qualityFlags.push("missing_coinbase_spot_reference");
    }
    const mappingConfidenceScore = qualityFlags.length === 0 ? 0.9 : Math.max(0.3, 0.9 - qualityFlags.length * 0.1);
    return {
      contractId: threshold.contractId,
      venueContractId: contract?.venueContractId ?? threshold.contractId,
      marketStructure: "threshold",
      comparisonOperator: threshold.comparisonOperator,
      thresholdValue: threshold.thresholdValue,
      ...(threshold.evaluationTimestampMs === undefined
        ? {}
        : { evaluationTimestampMs: threshold.evaluationTimestampMs }),
      ...(threshold.evaluationTimezone ? { evaluationTimezone: threshold.evaluationTimezone } : {}),
      ...(threshold.referencePriceDefinition
        ? { referencePriceDefinition: threshold.referencePriceDefinition }
        : {}),
      ...(threshold.settlementTimestampConvention
        ? { settlementTimestampConvention: threshold.settlementTimestampConvention }
        : {}),
      ...(referenceSpotPrice === undefined ? {} : { referenceSpotPrice }),
      ...(thresholdDistanceFromSpot === undefined ? {} : { thresholdDistanceFromSpot }),
      ...(thresholdDistancePctFromSpot === undefined ? {} : { thresholdDistancePctFromSpot }),
      ...(nearestFuture
        ? {
            nearestDeribitFuture: nearestFuture.instrument_name,
            nearestDeribitFutureExpiryMs: nearestFuture.expiration_timestamp,
            ...(threshold.evaluationTimestampMs === undefined
              ? {}
              : {
                  nearestFutureTimeGapHours:
                    Math.abs(nearestFuture.expiration_timestamp - threshold.evaluationTimestampMs) / 3_600_000
                })
          }
        : {}),
      relevantDeribitOptionCount: relevantOptionCount,
      mappingConfidenceScore,
      qualityFlags
    } satisfies BtcAnchorMappingRow;
  });

  const bucketRows = btcBuckets.map((bucket) => {
    const contract = contractById.get(bucket.contractId);
    const centerValue = deriveBucketCenter(bucket);
    const evaluationTimestampMs = inferBucketEvaluationTimestamp(contract, metadataByVenueContractId);
    const nearestFuture = chooseNearestFuture(evaluationTimestampMs, deribitFutures ?? []);
    const relevantOptionCount = countRelevantOptions(evaluationTimestampMs, centerValue, deribitOptions ?? []);
    const thresholdDistanceFromSpot =
      referenceSpotPrice === undefined ? undefined : centerValue - referenceSpotPrice;
    const thresholdDistancePctFromSpot =
      referenceSpotPrice === undefined ? undefined : (centerValue - referenceSpotPrice) / referenceSpotPrice;
    const qualityFlags: string[] = [];
    if (bucket.lowerBound === undefined || bucket.upperBound === undefined) {
      qualityFlags.push("missing_bucket_bounds");
    }
    if (evaluationTimestampMs === undefined) {
      qualityFlags.push("missing_evaluation_timestamp");
    }
    if (nearestFuture === undefined) {
      qualityFlags.push("missing_nearest_deribit_future");
    }
    if (relevantOptionCount === 0) {
      qualityFlags.push("no_relevant_deribit_options_selected");
    }
    if (referenceSpotPrice === undefined) {
      qualityFlags.push("missing_coinbase_spot_reference");
    }
    const mappingConfidenceScore = qualityFlags.length === 0 ? 0.85 : Math.max(0.3, 0.85 - qualityFlags.length * 0.1);
    return {
      contractId: bucket.contractId,
      venueContractId: contract?.venueContractId ?? bucket.contractId,
      marketStructure: "bucket",
      comparisonOperator: ">=",
      thresholdValue: centerValue,
      ...(bucket.lowerBound === undefined ? {} : { bucketLowerBound: bucket.lowerBound }),
      ...(bucket.upperBound === undefined ? {} : { bucketUpperBound: bucket.upperBound }),
      ...(evaluationTimestampMs === undefined ? {} : { evaluationTimestampMs }),
      ...(contract?.settlementTimezone ? { evaluationTimezone: contract.settlementTimezone } : {}),
      ...(contract?.resolutionSource ? { referencePriceDefinition: contract.resolutionSource } : {}),
      ...(contract?.settlementTimestampConvention
        ? { settlementTimestampConvention: contract.settlementTimestampConvention }
        : {}),
      ...(referenceSpotPrice === undefined ? {} : { referenceSpotPrice }),
      ...(thresholdDistanceFromSpot === undefined ? {} : { thresholdDistanceFromSpot }),
      ...(thresholdDistancePctFromSpot === undefined ? {} : { thresholdDistancePctFromSpot }),
      ...(nearestFuture
        ? {
            nearestDeribitFuture: nearestFuture.instrument_name,
            nearestDeribitFutureExpiryMs: nearestFuture.expiration_timestamp,
            ...(evaluationTimestampMs === undefined
              ? {}
              : {
                  nearestFutureTimeGapHours:
                    Math.abs(nearestFuture.expiration_timestamp - evaluationTimestampMs) / 3_600_000
                })
          }
        : {}),
      relevantDeribitOptionCount: relevantOptionCount,
      mappingConfidenceScore,
      qualityFlags
    } satisfies BtcAnchorMappingRow;
  });

  const rows = [...thresholdRows, ...bucketRows];

  const summary: BtcAnchorMappingAuditSummary = {
    outputRoot,
    checkedAtIso:
      captureSummary?.captureCompletedAtMs !== undefined
        ? new Date(captureSummary.captureCompletedAtMs).toISOString()
        : "1970-01-01T00:00:00.000Z",
    btcContractsInCapture: btcContracts.length,
    btcThresholdContracts: thresholdRows.length,
    btcBucketContracts: bucketRows.length,
    scopeNote: "This audit now covers both BTC threshold binaries and BTC bucket/range contracts within the captured BTC family.",
    rows
  };

  await writeFile(
    path.join(outputRoot, "anchors", "btc-anchor-mapping-audit.json"),
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

async function readOptionalJsonFile<T>(target: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(target, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function chooseNearestFuture(
  evaluationTimestampMs: number | undefined,
  futures: DeribitSelectedFuture[]
): DeribitSelectedFuture | undefined {
  if (futures.length === 0) {
    return undefined;
  }
  if (evaluationTimestampMs === undefined) {
    return futures[0];
  }
  const nonExpired = futures.filter((future) => future.expiration_timestamp >= evaluationTimestampMs);
  const candidates = nonExpired.length > 0 ? nonExpired : futures;
  return [...candidates].sort((left, right) => {
    return Math.abs(left.expiration_timestamp - evaluationTimestampMs) - Math.abs(right.expiration_timestamp - evaluationTimestampMs);
  })[0];
}

function countRelevantOptions(
  evaluationTimestampMs: number | undefined,
  targetValue: number,
  options: DeribitSelectedOption[]
): number {
  return options.filter((option) => {
    const strikeClose = option.strike === undefined ? false : Math.abs(option.strike - targetValue) <= 5_000;
    const expiryClose =
      evaluationTimestampMs === undefined
        ? true
        : option.expiration_timestamp >= evaluationTimestampMs &&
          option.expiration_timestamp - evaluationTimestampMs <= 7 * 24 * 3_600_000;
    return strikeClose && expiryClose;
  }).length;
}

function deriveBucketCenter(bucket: BucketDefinition): number {
  const lower = bucket.lowerBound ?? bucket.upperBound ?? 0;
  const upper = bucket.upperBound ?? bucket.lowerBound ?? 0;
  return (lower + upper) / 2;
}

function inferBucketEvaluationTimestamp(
  contract: CanonicalContract | undefined,
  metadataByVenueContractId: Map<string, MetadataStageRecord>
): number | undefined {
  if (!contract || contract.eventFamilyId !== "family::btc_threshold_primary::btc_usd") {
    return undefined;
  }
  const directMetadata = metadataByVenueContractId.get(contract.venueContractId);
  if (directMetadata?.evaluationTimestampMs !== undefined) {
    return directMetadata.evaluationTimestampMs;
  }
  return undefined;
}
