type PaperSide = "yes" | "no";
interface EntryAction {
    type: "entry";
    contractId: string;
    venueContractId: string;
    side: PaperSide;
    quantity: number;
    priceCents: number;
    signal: number;
    reason: string;
}
interface ExitAction {
    type: "exit";
    contractId: string;
    venueContractId: string;
    side: PaperSide;
    quantity: number;
    entryPriceCents: number;
    exitPriceCents: number;
    realizedPnlCents: number;
    reason: string;
}
interface HoldAction {
    type: "hold";
    contractId: string;
    venueContractId: string;
    side: PaperSide;
    quantity: number;
    signal?: number;
    markPriceCents?: number;
    reason: string;
}
interface PaperPerformanceSnapshot {
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
export interface BtcPaperTradingLoopOptions {
    outputRoot?: string;
    portfolioRoot?: string;
    startingCashCents?: number;
    maxOpenPositions?: number;
    maxPositionNotionalCents?: number;
    entryResidualThreshold?: number;
    exitResidualThreshold?: number;
}
export interface BtcPaperTradingLoopSummary {
    outputRoot: string;
    portfolioRoot: string;
    loopTimeIso: string;
    observationSessionAction: "executed" | "reused";
    btcCaptureAction: "run_now" | "wait_for_open" | "no_visible_btc_families";
    entryResidualThreshold: number;
    exitResidualThreshold: number;
    consideredObservations: number;
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
    performance: PaperPerformanceSnapshot;
    actions: Array<EntryAction | ExitAction | HoldAction>;
    skippedReason?: string;
}
export declare function runBtcPaperTradingLoop(options?: BtcPaperTradingLoopOptions): Promise<BtcPaperTradingLoopSummary>;
export {};
