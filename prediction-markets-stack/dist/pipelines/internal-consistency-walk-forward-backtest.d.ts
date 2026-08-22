import type { RelationshipEdge } from "../domain/graph.js";
import type { ExecutionTemplateId } from "../shared/enums.js";
interface PolicyConfig {
    policyId: "baseline_all_aggressive" | "walk_forward_top_1" | "walk_forward_top_3";
    title: string;
    maxTradesPerCapture: number;
    selector: "static_aggressive" | "walk_forward";
}
export interface PolicyCaptureResult {
    captureId: string;
    eligibleOpportunities: number;
    trades: number;
    pnlToResolution: number;
}
export interface PolicyTradeResult {
    captureId: string;
    eventKey: string;
    edgeId: string;
    observationId: string;
    executionTemplateId: ExecutionTemplateId;
    templateSource: "event" | "global" | "static";
    rankingScore: number;
    trailingMedianDepthAdjustedResidual: number;
    depthAdjustedResidual: number;
    entryFillProbability: number | null;
    pnlToResolution: number;
}
export interface PolicyPerformanceSummary {
    policyId: PolicyConfig["policyId"];
    title: string;
    totalTrades: number;
    uniqueEdgesTraded: number;
    tradedCaptures: number;
    cumulativePnlToResolution: number;
    averagePnlPerTrade: number;
    medianPnlPerTrade: number | null;
    hitRate: number;
    profitFactor: number | null;
    maxDrawdown: number;
    sharpeLike: number | null;
    averageTradesPerTradedCapture: number;
    averageEntryFillProbability: number | null;
    bestCapturePnl: number | null;
    worstCapturePnl: number | null;
    templateUsage: Record<string, number>;
    topEvents: Array<{
        eventKey: string;
        trades: number;
        cumulativePnlToResolution: number;
        averagePnlPerTrade: number;
    }>;
}
export interface InternalConsistencyWalkForwardBacktestSummary {
    outputRoot: string;
    seriesKey: string;
    requiredEdgeType: RelationshipEdge["edgeType"];
    totalCapturesSeen: number;
    warmupCaptures: number;
    evaluatedCaptures: number;
    minTrainingCaptures: number;
    trainingWindowCaptures: number;
    minDepthAdjustedResidual: number;
    duplicateEdgePolicy: "trade_each_edge_once";
    policies: PolicyPerformanceSummary[];
}
export interface InternalConsistencyWalkForwardBacktestOptions {
    capturesRoot?: string;
    outputRoot?: string;
    seriesKey?: string;
    minTrainingCaptures?: number;
    trainingWindowCaptures?: number;
    minDepthAdjustedResidual?: number;
    requiredEdgeType?: RelationshipEdge["edgeType"];
}
export declare function runInternalConsistencyWalkForwardBacktest(options?: InternalConsistencyWalkForwardBacktestOptions): Promise<InternalConsistencyWalkForwardBacktestSummary>;
export {};
