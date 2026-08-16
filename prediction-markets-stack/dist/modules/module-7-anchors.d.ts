import type { AnchorProbabilityState } from "../domain/anchors.js";
export interface AnchorModule {
    buildBtcThresholdAnchor(contractId: string, observationTimeMs: number): Promise<AnchorProbabilityState | null>;
}
export interface BtcAnchorSeed {
    contractId: string;
    rawProbability: number;
    calibratedProbability?: number;
    uncertaintyBandLow?: number;
    uncertaintyBandHigh?: number;
    mappingConfidenceScore: number;
    latencyConfidenceScore?: number;
}
export declare class InMemoryAnchorModule implements AnchorModule {
    private readonly seedsByContractId;
    constructor(seedsByContractId: Map<string, BtcAnchorSeed>);
    buildBtcThresholdAnchor(contractId: string, observationTimeMs: number): Promise<AnchorProbabilityState | null>;
}
