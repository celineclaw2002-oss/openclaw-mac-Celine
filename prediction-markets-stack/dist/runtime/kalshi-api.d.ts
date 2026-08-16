import type { KalshiApiEventResponse, KalshiApiMarketResponse, KalshiApiMarketsResponse, KalshiApiOrderbookResponse, KalshiApiSeriesResponse } from "../venues/kalshi.js";
export interface KalshiListMarketsOptions {
    cursor?: string;
    limit?: number;
    status?: string;
    seriesTicker?: string;
}
export declare class KalshiHttpClient {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    listMarkets(options?: KalshiListMarketsOptions): Promise<KalshiApiMarketsResponse>;
    getMarket(ticker: string): Promise<KalshiApiMarketResponse>;
    getOrderbook(ticker: string): Promise<KalshiApiOrderbookResponse>;
    getSeries(seriesTicker: string): Promise<KalshiApiSeriesResponse>;
    getEvent(eventTicker: string): Promise<KalshiApiEventResponse>;
    private fetchJson;
}
