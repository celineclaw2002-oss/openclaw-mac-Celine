export interface PolymarketBtcPortfolioReplayOptions {
    backfillRoot?: string;
    outputRoot?: string;
    startingCapitalCents?: number;
    maxOpenPositions?: number;
    maxPositionsPerEvent?: number;
}
export interface PolymarketBtcPortfolioReplaySummary {
    outputRoot: string;
    sourceBackfillRoot: string;
    replayedSnapshots: number;
    cashCents: number;
    netLiquidationCents: number;
    realizedPnlCents: number;
    openPositions: number;
    closedPositions: number;
    maxDrawdown: number;
    stressPath: string;
}
export declare function runPolymarketBtcPortfolioReplay(options?: PolymarketBtcPortfolioReplayOptions): Promise<PolymarketBtcPortfolioReplaySummary>;
