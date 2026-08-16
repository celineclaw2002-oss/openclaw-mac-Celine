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
export declare function runBtcAnchorMappingAudit(options?: BtcAnchorMappingAuditOptions): Promise<BtcAnchorMappingAuditSummary>;
