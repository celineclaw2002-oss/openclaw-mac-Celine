export interface CoinbaseTickerResponse {
    ask: string;
    bid: string;
    price: string;
    size: string;
    time: string;
    trade_id: number;
    volume: string;
}
export interface CoinbaseTickerRecord {
    productId: string;
    price: number;
    bid: number;
    ask: number;
    size: number;
    volume: number;
    tradeId: number;
    time: string;
}
export type CoinbaseCandleTuple = [
    time: number,
    low: number,
    high: number,
    open: number,
    close: number,
    volume: number
];
export interface CoinbaseDailyCandleRecord {
    timeMs: number;
    low: number;
    high: number;
    open: number;
    close: number;
    volume: number;
}
export declare class CoinbaseHttpClient {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    getTicker(productId?: string): Promise<CoinbaseTickerRecord>;
    getCandles(options: {
        productId?: string;
        startIso: string;
        endIso: string;
        granularitySeconds?: 60 | 300 | 900 | 3600 | 21600 | 86400;
    }): Promise<CoinbaseDailyCandleRecord[]>;
}
