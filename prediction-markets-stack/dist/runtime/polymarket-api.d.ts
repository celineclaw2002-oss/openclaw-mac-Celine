export interface PolymarketMarketRecord {
    id: string;
    question: string;
    slug: string;
    endDate?: string;
    active?: boolean;
    closed?: boolean;
    acceptingOrders?: boolean;
    enableOrderBook?: boolean;
    bestBid?: number;
    bestAsk?: number;
    lastTradePrice?: number;
    liquidityNum?: number;
    volume24hr?: number;
    volume1wk?: number;
    volumeClob?: number;
    feeType?: string;
    orderPriceMinTickSize?: number;
    orderMinSize?: number;
    restricted?: boolean;
}
export interface PolymarketEventRecord {
    id: string;
    slug: string;
    title: string;
    active?: boolean;
    closed?: boolean;
    liquidity?: number;
    volume24hr?: number;
    volume1wk?: number;
    restricted?: boolean;
    markets?: PolymarketMarketRecord[];
}
export interface PolymarketListEventsOptions {
    limit?: number;
    active?: boolean;
    closed?: boolean;
}
export declare class PolymarketGammaClient {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    listEvents(options?: PolymarketListEventsOptions): Promise<PolymarketEventRecord[]>;
    private fetchJson;
}
