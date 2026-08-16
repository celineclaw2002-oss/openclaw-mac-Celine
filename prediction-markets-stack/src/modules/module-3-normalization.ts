import type {
  BucketDefinition,
  CanonicalContract,
  EventFamily,
  ResolutionRuleRecord,
  ThresholdDefinition
} from "../domain/contracts.js";
import type { DiscoveryStageRecord, MetadataStageRecord } from "../domain/source-events.js";
import { deterministicKey } from "../shared/identity.js";

const NORMALIZATION_VERSION = "norm-v1";
const RULE_PARSER_VERSION = "rule-v1";
const FEE_MODEL_VERSION = "fee-v1";

export interface NormalizationModule {
  buildFamily(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): EventFamily;
  buildContract(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): CanonicalContract;
  buildThreshold(contract: CanonicalContract, metadata: MetadataStageRecord): ThresholdDefinition | null;
  buildBucket(contract: CanonicalContract, metadata: MetadataStageRecord): BucketDefinition | null;
  buildRule(contract: CanonicalContract, metadata: MetadataStageRecord): ResolutionRuleRecord;
}

export class KalshiNormalizationModule implements NormalizationModule {
  buildFamily(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): EventFamily {
    const referenceVariable = inferReferenceVariable(discovery.questionText, metadata.rulesText);
    return {
      eventFamilyId: deterministicKey(["family", discovery.familyClass, referenceVariable ?? "unknown"]),
      familyClass: discovery.familyClass,
      familyKey: deterministicKey([discovery.familyClass, referenceVariable ?? discovery.venueContractId]),
      ...(referenceVariable ? { referenceVariable } : {}),
      notes: buildFamilyNotes(discovery, metadata)
    };
  }

  buildContract(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): CanonicalContract {
    const contractType = inferContractType(discovery, metadata);
    const outcomeType = inferOutcomeType(discovery, metadata);
    return {
      contractId: deterministicKey(["contract", discovery.venueContractId]),
      venueId: "kalshi",
      venueContractId: discovery.venueContractId,
      eventFamilyId: this.buildFamily(discovery, metadata).eventFamilyId,
      contractType,
      outcomeType,
      questionText: metadata.questionText || discovery.questionText,
      rulesText: metadata.rulesText,
      rulesHash: metadata.rulesHash,
      ...(metadata.resolutionSourceText ? { resolutionSource: metadata.resolutionSourceText } : {}),
      ...(metadata.settlementTimestampConvention
        ? { settlementTimestampConvention: metadata.settlementTimestampConvention }
        : {}),
      ...(metadata.settlementTimezone ? { settlementTimezone: metadata.settlementTimezone } : {}),
      ...(metadata.observationWindowText ? { observationWindowText: metadata.observationWindowText } : {}),
      tickSize: 1,
      minSize: 1,
      status: normalizeStatus(metadata.rawStatus ?? discovery.rawStatus),
      semanticConfidence: calculateSemanticConfidence(discovery, metadata),
      ambiguityFlags: collectAmbiguityFlags(discovery, metadata),
      normalizationVersion: NORMALIZATION_VERSION,
      ruleParserVersion: RULE_PARSER_VERSION,
      feeModelVersion: FEE_MODEL_VERSION,
      parseVersion: metadata.parseVersion
    };
  }

  buildThreshold(contract: CanonicalContract, metadata: MetadataStageRecord): ThresholdDefinition | null {
    if (contract.contractType !== "threshold_binary") {
      return null;
    }
    const match = extractThresholdMetadata(`${contract.questionText} ${metadata.rulesText}`);
    if (!match) {
      return null;
    }
    return {
      thresholdId: deterministicKey(["threshold", contract.contractId]),
      contractId: contract.contractId,
      referenceVariable: inferReferenceVariable(contract.questionText, metadata.rulesText) ?? "unknown",
      comparisonOperator: match.operator,
      thresholdValue: match.value,
      ...(metadata.evaluationTimestampMs === undefined
        ? {}
        : { evaluationTimestampMs: metadata.evaluationTimestampMs }),
      evaluationTimezone: metadata.settlementTimezone ?? "UTC",
      ...(metadata.settlementTimestampConvention
        ? { settlementTimestampConvention: metadata.settlementTimestampConvention }
        : {}),
      ...(metadata.resolutionSourceText ? { referencePriceDefinition: metadata.resolutionSourceText } : {}),
      confidence: contract.semanticConfidence,
      ambiguityFlags: contract.ambiguityFlags
    };
  }

  buildBucket(contract: CanonicalContract, metadata: MetadataStageRecord): BucketDefinition | null {
    if (contract.contractType !== "categorical_bucket" && contract.contractType !== "range_bucket") {
      return null;
    }
    const range = extractBucketRange(`${contract.questionText} ${metadata.rulesText}`);
    if (!range) {
      return null;
    }
    return {
      bucketId: deterministicKey(["bucket", contract.contractId]),
      contractId: contract.contractId,
      bucketGroupId: deterministicKey(["bucket_group", inferReferenceVariable(contract.questionText, metadata.rulesText) ?? "unknown"]),
      label: contract.questionText,
      ...(range.lowerBound === undefined ? {} : { lowerBound: range.lowerBound }),
      ...(range.upperBound === undefined ? {} : { upperBound: range.upperBound }),
      inclusiveLower: range.inclusiveLower,
      inclusiveUpper: range.inclusiveUpper,
      bucketOrder: 0,
      isExhaustiveClaimed: false,
      isMutuallyExclusiveClaimed: true,
      confidence: contract.semanticConfidence
    };
  }

  buildRule(contract: CanonicalContract, metadata: MetadataStageRecord): ResolutionRuleRecord {
    return {
      ruleId: deterministicKey(["rule", contract.contractId]),
      contractId: contract.contractId,
      ...(metadata.resolutionSourceText ? { resolutionSourceName: metadata.resolutionSourceText } : {}),
      ...(metadata.settlementTimestampConvention
        ? { settlementTimestampConvention: metadata.settlementTimestampConvention }
        : {}),
      ...(metadata.settlementTimezone ? { settlementTimezone: metadata.settlementTimezone } : {}),
      ...(metadata.observationWindowText ? { observationWindowText: metadata.observationWindowText } : {}),
      revisionHandling: metadata.rulesText.includes("clarification") ? "clarification_possible" : "static_rules",
      clarificationAllowed: metadata.rulesText.toLowerCase().includes("clarif"),
      disputeAllowed: metadata.rulesText.toLowerCase().includes("dispute"),
      manualOverridePossible: metadata.rulesText.toLowerCase().includes("sole discretion"),
      ruleConfidence: calculateSemanticConfidence(
        {
          ...metadataToDiscovery(metadata),
          familyClass: inferFamilyClassFromText(metadata.questionText)
        },
        metadata
      ),
      structuredSummary: {
        questionText: contract.questionText,
        ruleLength: metadata.rulesText.length,
        resolutionSource: metadata.resolutionSourceText ?? null
      },
      parserFlags: collectAmbiguityFlags(
        {
          ...metadataToDiscovery(metadata),
          familyClass: inferFamilyClassFromText(metadata.questionText)
        },
        metadata
      )
    };
  }
}

function metadataToDiscovery(metadata: MetadataStageRecord): Omit<DiscoveryStageRecord, "familyClass"> {
  return {
    sourceEventId: metadata.sourceEventId,
    venueContractId: metadata.venueContractId,
    questionText: metadata.questionText,
    ...(metadata.rawStatus ? { rawStatus: metadata.rawStatus } : {}),
    parseVersion: metadata.parseVersion,
    parseSuccess: metadata.parseSuccess,
    qualityFlags: metadata.qualityFlags
  };
}

function inferReferenceVariable(...texts: Array<string | undefined>): string | undefined {
  const merged = texts.filter(Boolean).join(" ").toLowerCase();
  if (merged.includes("btc") || merged.includes("bitcoin")) {
    return "btc_usd";
  }
  if (merged.includes("fed") || merged.includes("fomc") || merged.includes("rate")) {
    return "fed_target_rate";
  }
  return undefined;
}

function inferContractType(
  discovery: DiscoveryStageRecord,
  metadata: MetadataStageRecord
): CanonicalContract["contractType"] {
  const text = `${discovery.questionText} ${metadata.rulesText}`.toLowerCase();
  if (extractThresholdMetadata(text)) {
    return "threshold_binary";
  }
  if (text.includes("between") || text.includes("range")) {
    return extractBucketRange(text) ? "range_bucket" : "categorical_bucket";
  }
  return "binary";
}

function inferOutcomeType(
  discovery: DiscoveryStageRecord,
  metadata: MetadataStageRecord
): CanonicalContract["outcomeType"] {
  const text = `${discovery.questionText} ${metadata.rulesText}`.toLowerCase();
  const threshold = extractThresholdMetadata(text);
  if (threshold) {
    return threshold.operator.startsWith(">") ? "threshold_above" : "threshold_below";
  }
  if (extractBucketRange(text)) {
    return "range_inclusive";
  }
  return "yes_no";
}

function extractThresholdMetadata(text: string): { operator: ThresholdDefinition["comparisonOperator"]; value: number } | null {
  const normalized = text.toLowerCase();
  const patterns: Array<[RegExp, ThresholdDefinition["comparisonOperator"]]> = [
    [/(?:exceed|above|over)\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/, ">"],
    [/(?:at least|greater than or equal to)\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/, ">="],
    [/(?:below|under|less than)\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/, "<"],
    [/(?:at most|less than or equal to)\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/, "<="]
  ];
  for (const [pattern, operator] of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return {
        operator,
        value: Number(match[1].replaceAll(",", ""))
      };
    }
  }
  return null;
}

function extractBucketRange(text: string): {
  lowerBound?: number;
  upperBound?: number;
  inclusiveLower: boolean;
  inclusiveUpper: boolean;
} | null {
  const normalized = text.toLowerCase();
  const between = normalized.match(/between\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)\s+and\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (between?.[1] && between[2]) {
    return {
      lowerBound: Number(between[1].replaceAll(",", "")),
      upperBound: Number(between[2].replaceAll(",", "")),
      inclusiveLower: true,
      inclusiveUpper: true
    };
  }
  const hyphenated = normalized.match(/between\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)\s*-\s*\$?([0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (hyphenated?.[1] && hyphenated[2]) {
    return {
      lowerBound: Number(hyphenated[1].replaceAll(",", "")),
      upperBound: Number(hyphenated[2].replaceAll(",", "")),
      inclusiveLower: true,
      inclusiveUpper: true
    };
  }
  const toRange = normalized.match(/\$?([0-9][0-9,]*(?:\.[0-9]+)?)\s+to\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (toRange?.[1] && toRange[2]) {
    return {
      lowerBound: Number(toRange[1].replaceAll(",", "")),
      upperBound: Number(toRange[2].replaceAll(",", "")),
      inclusiveLower: true,
      inclusiveUpper: true
    };
  }
  return null;
}

function calculateSemanticConfidence(
  discovery: Pick<DiscoveryStageRecord, "qualityFlags" | "questionText" | "familyClass">,
  metadata: Pick<MetadataStageRecord, "rulesText" | "resolutionSourceText">
): number {
  let score = 0.55;
  if (metadata.rulesText.length > 40) {
    score += 0.15;
  }
  if (metadata.resolutionSourceText) {
    score += 0.15;
  }
  if (discovery.familyClass !== "excluded_v1") {
    score += 0.1;
  }
  score -= discovery.qualityFlags.length * 0.05;
  return Math.max(0, Math.min(0.99, score));
}

function collectAmbiguityFlags(
  discovery: Pick<DiscoveryStageRecord, "questionText" | "familyClass" | "qualityFlags">,
  metadata: Pick<
    MetadataStageRecord,
    "rulesText" | "resolutionSourceText" | "settlementTimestampConvention" | "settlementTimezone"
  >
): string[] {
  const flags = [...discovery.qualityFlags];
  if (!metadata.resolutionSourceText) {
    flags.push("missing_resolution_source");
  }
  if (!metadata.settlementTimestampConvention) {
    flags.push("missing_settlement_timestamp_convention");
  }
  if (!metadata.settlementTimezone) {
    flags.push("missing_settlement_timezone");
  }
  if (
    !extractThresholdMetadata(`${discovery.questionText} ${metadata.rulesText}`) &&
    discovery.familyClass === "btc_threshold_primary"
  ) {
    flags.push("threshold_not_explicitly_parsed");
  }
  if (metadata.rulesText.length < 20) {
    flags.push("short_rules_text");
  }
  return Array.from(new Set(flags));
}

function normalizeStatus(rawStatus: string | undefined): CanonicalContract["status"] {
  const normalized = rawStatus?.toLowerCase();
  switch (normalized) {
    case "open":
    case "active":
      return "active";
    case "closed":
      return "closed";
    case "settled":
    case "resolved":
      return "determined";
    case "finalized":
      return "finalized";
    case "paused":
      return "paused";
    default:
      return "listed";
  }
}

function buildFamilyNotes(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): string {
  return `family=${discovery.familyClass}; contract=${discovery.venueContractId}; has_resolution_source=${String(Boolean(metadata.resolutionSourceText))}`;
}

function inferFamilyClassFromText(questionText: string): DiscoveryStageRecord["familyClass"] {
  const normalized = questionText.toLowerCase();
  if (normalized.includes("btc") || normalized.includes("bitcoin")) {
    return "btc_threshold_primary";
  }
  if (normalized.includes("fed") || normalized.includes("fomc") || normalized.includes("rate")) {
    return "fed_policy_candidate";
  }
  if (normalized.includes("between") || normalized.includes("range")) {
    return "bucket_partition_candidate";
  }
  return "excluded_v1";
}
