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
export declare class CoinbaseHttpClient {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    getTicker(productId?: string): Promise<CoinbaseTickerRecord>;
}
