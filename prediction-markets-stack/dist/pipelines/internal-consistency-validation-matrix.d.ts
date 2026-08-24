import type { RelationshipEdge } from "../domain/graph.js";
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
export declare function runInternalConsistencyValidationMatrix(options?: InternalConsistencyValidationMatrixOptions): Promise<InternalConsistencyValidationMatrixSummary>;
