import type { ExecutionTemplateId } from "../shared/enums.js";
export interface AlphaScoutRow {
    groupType: "series_key" | "event_key" | "family_class";
    groupId: string;
    capturesSeen: number;
    observations: number;
    grossPositiveRate: number;
    feeAdjustedPositiveRate: number;
    depthAdjustedPositiveRate: number;
    meanGrossResidual: number;
    meanNetFeeAdjustedResidual: number;
    meanDepthAdjustedResidual: number;
    simulationCount: number;
    bestExecutionTemplate?: ExecutionTemplateId;
    bestMeanPnlToResolution?: number;
    bestPositivePnlToResolutionRate?: number;
    scoutScore: number;
    verdict: "promising" | "watchlist" | "weak" | "avoid";
}
export interface InternalConsistencyAlphaScoutSummary {
    generatedAtIso: string;
    capturesInspected: number;
    latestCaptureRoot?: string;
    scoutNote: string;
    topSeries: AlphaScoutRow[];
    topEvents: AlphaScoutRow[];
    topFamilyClasses: AlphaScoutRow[];
}
export declare function runInternalConsistencyAlphaScout(options?: {
    outputRoot?: string;
    maxCaptures?: number;
}): Promise<InternalConsistencyAlphaScoutSummary>;
