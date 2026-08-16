export interface BtcMarketReadinessAuditOptions {
    outputRoot?: string;
}
export interface BtcFamilyReadinessRow {
    eventTicker: string;
    contracts: number;
    tradableContracts: number;
    initializedContracts: number;
    activeContracts: number;
    liveQuoteContracts: number;
    nonZeroLiquidityContracts: number;
    nonZeroVolumeContracts: number;
    earliestOpenTimeMs?: number;
    latestOpenTimeMs?: number;
    earliestOpenTimeIso?: string;
    latestOpenTimeIso?: string;
    readinessStatus: "tradable_ready" | "pre_open" | "live_but_empty" | "inactive";
    readinessScore: number;
    blockerReasons: string[];
}
export interface BtcMarketReadinessAuditSummary {
    outputRoot: string;
    checkedAtIso: string;
    seriesTicker: "KXBTC";
    captureCompletedAtMs?: number;
    visibleFamilies: number;
    tradableFamilies: number;
    bestTradableFamily?: string;
    nextOpenFamily?: string;
    nextOpenTimeMs?: number;
    nextOpenTimeIso?: string;
    families: BtcFamilyReadinessRow[];
}
export declare function runBtcMarketReadinessAudit(options?: BtcMarketReadinessAuditOptions): Promise<BtcMarketReadinessAuditSummary>;
