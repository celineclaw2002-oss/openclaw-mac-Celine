import type { ContractType, FamilyClass, NormalizedStatus, OutcomeType, VenueId } from "../shared/enums.js";
import type { ReplayLineage } from "../shared/identity.js";
export interface EventFamily {
    eventFamilyId: string;
    familyClass: FamilyClass;
    familyKey: string;
    referenceVariable?: string;
    notes?: string;
}
export interface CanonicalContract extends ReplayLineage {
    contractId: string;
    venueId: VenueId;
    venueContractId: string;
    eventFamilyId: string;
    contractType: ContractType;
    outcomeType: OutcomeType;
    questionText: string;
    rulesText: string;
    rulesHash: string;
    resolutionSource?: string;
    settlementTimestampConvention?: string;
    settlementTimezone?: string;
    observationWindowText?: string;
    tickSize?: number;
    minSize?: number;
    status: NormalizedStatus;
    semanticConfidence: number;
    ambiguityFlags: string[];
}
export interface ThresholdDefinition {
    thresholdId: string;
    contractId: string;
    referenceVariable: string;
    comparisonOperator: ">" | ">=" | "<" | "<=";
    thresholdValue: number;
    lowerBound?: number;
    upperBound?: number;
    boundaryInclusiveLower?: boolean;
    boundaryInclusiveUpper?: boolean;
    evaluationTimestampMs?: number;
    evaluationTimezone?: string;
    settlementTimestampConvention?: string;
    referencePriceDefinition?: string;
    confidence: number;
    ambiguityFlags: string[];
}
export interface BucketDefinition {
    bucketId: string;
    contractId: string;
    bucketGroupId: string;
    label: string;
    lowerBound?: number;
    upperBound?: number;
    inclusiveLower?: boolean;
    inclusiveUpper?: boolean;
    bucketOrder: number;
    isExhaustiveClaimed: boolean;
    isMutuallyExclusiveClaimed: boolean;
    confidence: number;
}
export interface ResolutionRuleRecord {
    ruleId: string;
    contractId: string;
    resolutionSourceName?: string;
    settlementTimestampConvention?: string;
    settlementTimezone?: string;
    observationWindowText?: string;
    revisionHandling?: string;
    clarificationAllowed?: boolean;
    disputeAllowed?: boolean;
    manualOverridePossible?: boolean;
    ruleConfidence: number;
    structuredSummary: Record<string, unknown>;
    parserFlags: string[];
}
