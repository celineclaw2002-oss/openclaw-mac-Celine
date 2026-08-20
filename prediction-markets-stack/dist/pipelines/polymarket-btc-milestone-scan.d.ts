export interface PolymarketBtcMilestoneScanOptions {
    outputRoot?: string;
    limit?: number;
    maxPages?: number;
}
export interface PolymarketBtcMilestoneRow {
    eventId: string;
    eventSlug: string;
    eventTitle: string;
    question: string;
    marketSlug: string;
    active: boolean;
    closed: boolean;
    restricted: boolean;
    acceptingOrders: boolean;
    enableOrderBook: boolean;
    bestBid?: number;
    bestAsk?: number;
    lastTradePrice?: number;
    spread?: number;
    endDate?: string;
    liquidityNum?: number;
    volume24hr?: number;
    volume1wk?: number;
}
export interface PolymarketBtcMilestoneScanSummary {
    outputRoot: string;
    checkedAtIso: string;
    scannedEvents: number;
    matchingEvents: number;
    matchingMarkets: number;
    openMarkets: number;
    orderBookMarkets: number;
    quoteReadyMarkets: number;
    unrestrictedQuoteReadyMarkets: number;
    reservePathVerdict: "viable_public_data_with_restriction_risk" | "viable_public_data" | "data_visible_but_not_trade_ready" | "no_matching_markets";
    primaryRecommendation: string;
    bestMarket?: PolymarketBtcMilestoneRow;
    markets: PolymarketBtcMilestoneRow[];
}
export declare function runPolymarketBtcMilestoneScan(options?: PolymarketBtcMilestoneScanOptions): Promise<PolymarketBtcMilestoneScanSummary>;
