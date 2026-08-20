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
export interface PolymarketBtcPaperLoopOptions {
    outputRoot?: string;
    portfolioRoot?: string;
    startingCashCents?: number;
    maxOpenPositions?: number;
    maxPositionNotionalCents?: number;
    entryEdgeThreshold?: number;
    exitEdgeThreshold?: number;
    annualizedVol?: number;
}
export interface PolymarketBtcPaperLoopSummary {
    outputRoot: string;
    portfolioRoot: string;
    loopTimeIso: string;
    scanAction: "executed" | "reused";
    reservePathVerdict: string;
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
    topSignals: Array<{
        marketSlug: string;
        side: PaperSide;
        signal: number;
        anchorProbability: number;
        marketMid: number;
    }>;
    performance: PerformanceSnapshot;
    actions: Array<EntryAction | ExitAction | HoldAction>;
    skippedReason?: string;
}
export declare function runPolymarketBtcPaperLoop(options?: PolymarketBtcPaperLoopOptions): Promise<PolymarketBtcPaperLoopSummary>;
export {};
