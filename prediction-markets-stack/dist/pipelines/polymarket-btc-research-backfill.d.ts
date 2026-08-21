type MarketSurfaceMode = "frozen_live" | "terminal_baseline";
export interface PolymarketBtcResearchBackfillOptions {
    outputRoot?: string;
    startIso?: string;
    endIso?: string;
    stepDays?: number;
    lookbackDays?: number;
    marketSurface?: MarketSurfaceMode;
    syntheticSpread?: number;
    annualizedVolOverride?: number;
    scanOutputRoot?: string;
    backtestSummaryPath?: string;
    startingCapitalCents?: number;
}
export interface PolymarketBtcResearchBackfillSummary {
    outputRoot: string;
    checkedAtIso: string;
    sourceNote: string;
    marketSurface: MarketSurfaceMode;
    startIso: string;
    endIso: string;
    stepDays: number;
    lookbackDays: number;
    candleCount: number;
    baseMarkets: number;
    snapshots: number;
    historyPath: string;
    latestSnapshotPath?: string;
    latestTimestampIso?: string;
    latestAllowedEntries?: number;
    latestBlockedEntries?: number;
}
export declare function runPolymarketBtcResearchBackfill(options?: PolymarketBtcResearchBackfillOptions): Promise<PolymarketBtcResearchBackfillSummary>;
export {};
