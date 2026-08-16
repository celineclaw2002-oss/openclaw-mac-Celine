import type { BucketDefinition, CanonicalContract, EventFamily, ResolutionRuleRecord, ThresholdDefinition } from "../domain/contracts.js";
import type { DiscoveryStageRecord, MetadataStageRecord } from "../domain/source-events.js";
export interface NormalizationModule {
    buildFamily(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): EventFamily;
    buildContract(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): CanonicalContract;
    buildThreshold(contract: CanonicalContract, metadata: MetadataStageRecord): ThresholdDefinition | null;
    buildBucket(contract: CanonicalContract, metadata: MetadataStageRecord): BucketDefinition | null;
    buildRule(contract: CanonicalContract, metadata: MetadataStageRecord): ResolutionRuleRecord;
}
export declare class KalshiNormalizationModule implements NormalizationModule {
    buildFamily(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): EventFamily;
    buildContract(discovery: DiscoveryStageRecord, metadata: MetadataStageRecord): CanonicalContract;
    buildThreshold(contract: CanonicalContract, metadata: MetadataStageRecord): ThresholdDefinition | null;
    buildBucket(contract: CanonicalContract, metadata: MetadataStageRecord): BucketDefinition | null;
    buildRule(contract: CanonicalContract, metadata: MetadataStageRecord): ResolutionRuleRecord;
}
