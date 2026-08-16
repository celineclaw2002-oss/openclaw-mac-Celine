import type { NormalizedStatus } from "../shared/enums.js";
import type { ReplayLineage } from "../shared/identity.js";
export interface ContractQuoteState extends ReplayLineage {
    contractId: string;
    quoteTimeMs: number;
    bestYesBid?: number;
    bestYesAsk?: number;
    bestNoBid?: number;
    bestNoAsk?: number;
    depthLevels: Record<string, unknown>;
    quoteQualityScore: number;
    derivedQuoteFlags: string[];
}
export interface ContractLifecycleState extends ReplayLineage {
    contractId: string;
    stateTimeMs: number;
    normalizedStatus: NormalizedStatus;
    secondsToClose?: number;
    secondsToExpectedResolution?: number;
    secondsSinceListing?: number;
    secondsSinceLastStatusChange?: number;
}
export interface ContractExecutionState extends ReplayLineage {
    contractId: string;
    stateTimeMs: number;
    orderBookImbalance?: number;
    depthAsymmetry?: number;
    tradeIntensityShort?: number;
    quoteUpdateIntensity?: number;
    queueEstimationConfidence?: number;
}
export interface ContractFeeState extends ReplayLineage {
    contractId: string;
    stateTimeMs: number;
    feeScheduleId: string;
    feeFormulaType: string;
    feeParameters: Record<string, unknown>;
    roundingRules: Record<string, unknown>;
}
