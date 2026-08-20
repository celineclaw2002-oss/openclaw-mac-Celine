type PaperSide = "yes" | "no";
interface EntryAction {
    type: "entry";
    marketSlug: string;
    side: PaperSide;
    quantity: number;
    priceCents: number;
    signal: number;
    anchorProbability: number;
    reason: string;
}
interface ExitAction {
    type: "exit";
    marketSlug: string;
    side: PaperSide;
    quantity: number;
    entryPriceCents: number;
    exitPriceCents: number;
    realizedPnlCents: number;
    reason: string;
}
interface HoldAction {
    type: "hold";
    marketSlug: string;
    side: PaperSide;
    quantity: number;
    signal?: number;
    markPriceCents?: number;
    reason: string;
}
interface PerformanceSnapshot {
    initialCapitalCents: number;
    loopCount: number;
    closedTrades: number;
    openTrades: number;
    grossTradedNotionalCents: number;
    turnoverRatio: number;
    currentGrossExposureCents: number;
    currentNetExposureCents: number;
    currentGrossExposureRate: number;
    currentNetExposureRate: number;
    cumulativeReturn: number;
    realizedReturn: number;
    unrealizedReturn: number;
    maxDrawdown: number;
    winRate?: number;
    averageWinCents?: number;
    averageLossCents?: number;
    profitFactor?: number;
    averageHoldingMinutes?: number;
    loopSharpeRatio?: number;
    loopSortinoRatio?: number;
}
interface SegmentImprovement {
    brierImprovement: number;
    logLossImprovement: number;
}
interface CandidatePolicy {
    mode: "fallback" | "segment_aware";
    allowEntry: boolean;
    qualityBucket: "fallback" | "strong" | "medium" | "cautious" | "blocked";
    entryEdgeThreshold: number;
    exitEdgeThreshold: number;
    rationale: string;
    barrierMultiplier: number;
    horizonDays: number;
    barrierBucket?: number;
    horizonBucketDays?: number;
    barrierImprovement?: SegmentImprovement;
    horizonImprovement?: SegmentImprovement;
    qualityScore?: number;
    sourceSummaryPath?: string;
}
interface ResearchSnapshot {
    regime: {
        spotPrice: number;
        annualizedVol: number;
        quoteReadyMarkets: number;
        upsideQuoteReadyMarkets: number;
        downsideQuoteReadyMarkets: number;
        averageSpread: number;
        realizedVol20d?: number;
        momentum20d?: number;
        momentum60d?: number;
        volBucket?: "low" | "medium" | "high";
        trendBucket?: "down" | "flat" | "up";
    };
    candidateBook: {
        allowedEntries: number;
        blockedEntries: number;
        strongSignals: number;
        mediumSignals: number;
        cautiousSignals: number;
        blockedSignals: number;
        averageAllowedSignal: number;
        averageAllowedBarrierMultiplier: number;
        averageAllowedHorizonDays: number;
        averageGrossEdgeToMid?: number;
        averageNetEdgeToEntry?: number;
        averageSpreadCost?: number;
    };
    concentration: {
        openEventGroups: number;
        largestEventExposureCents: number;
        largestEventExposureRate: number;
        largestDirectionExposureCents: number;
        largestDirectionExposureRate: number;
        weightedAverageBarrierMultiplier?: number;
        weightedAverageHorizonDays?: number;
    };
    costDiagnostics: {
        expectedEntryCostCents: number;
        realizedSpreadCaptureCents: number;
    };
    attribution: {
        byDirection: AttributionBucket[];
        byBarrierBucket: AttributionBucket[];
        byHorizonBucket: AttributionBucket[];
        byEvent: AttributionBucket[];
    };
}
interface AttributionBucket {
    bucketId: string;
    openPositions: number;
    grossExposureCents: number;
    realizedPnlCents: number;
    unrealizedPnlCents: number;
    totalPnlCents: number;
}
export interface PolymarketBtcPaperLoopOptions {
    outputRoot?: string;
    portfolioRoot?: string;
    startingCashCents?: number;
    maxOpenPositions?: number;
    maxPositionNotionalCents?: number;
    maxEventExposureCents?: number;
    maxPositionsPerEventDirection?: number;
    minBarrierGapRatio?: number;
    entryEdgeThreshold?: number;
    exitEdgeThreshold?: number;
    annualizedVol?: number;
    backtestSummaryPath?: string;
}
export interface PolymarketBtcPaperLoopSummary {
    outputRoot: string;
    portfolioRoot: string;
    loopTimeIso: string;
    scanAction: "executed" | "reused";
    reservePathVerdict: string;
    policyMode: "fallback" | "segment_aware";
    entryEdgeThreshold: number;
    exitEdgeThreshold: number;
    spotPrice: number;
    annualizedVol: number;
    consideredMarkets: number;
    quoteReadyMarkets: number;
    eligibleEntries: number;
    entriesPlaced: number;
    exitsPlaced: number;
    holdsReviewed: number;
    openPositions: number;
    closedPositions: number;
    cashCents: number;
    realizedPnlCents: number;
    unrealizedPnlCents: number;
    netLiquidationCents: number;
    entryNotionalCents: number;
    exitNotionalCents: number;
    grossTradedNotionalCents: number;
    grossExposureCents: number;
    netExposureCents: number;
    grossExposureRate: number;
    netExposureRate: number;
    bestMarket?: string;
    topSignals: TopSignalDiagnostic[];
    researchSnapshot: ResearchSnapshot;
    performance: PerformanceSnapshot;
    actions: Array<EntryAction | ExitAction | HoldAction>;
    skippedReason?: string;
    policySourceSummaryPath?: string;
}
type TopSignalDiagnostic = {
    marketSlug: string;
    side: PaperSide;
    signal: number;
    anchorProbability: number;
    marketMid: number;
    barrierMultiplier: number;
    horizonDays: number;
    qualityBucket: CandidatePolicy["qualityBucket"];
    entryEdgeThreshold: number;
    allowEntry: boolean;
    policyRationale: string;
};
export declare function runPolymarketBtcPaperLoop(options?: PolymarketBtcPaperLoopOptions): Promise<PolymarketBtcPaperLoopSummary>;
export {};
