import type { KalshiApiMarketResponse, KalshiApiMarketsResponse, KalshiApiOrderbookResponse } from "../venues/kalshi.js";
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
    private fetchJson;
}
