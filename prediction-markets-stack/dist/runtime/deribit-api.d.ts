export interface DeribitInstrumentRecord {
    instrument_name: string;
    kind: "future" | "option" | string;
    option_type?: "call" | "put" | string;
    expiration_timestamp: number;
    strike?: number;
    settlement_period?: string;
    base_currency: string;
    quote_currency: string;
    tick_size?: number;
}
export interface DeribitBookSummaryRecord {
    instrument_name: string;
    ask_price?: number | null;
    bid_price?: number | null;
    mid_price?: number | null;
    open_interest?: number | null;
    volume?: number | null;
    underlying_price?: number | null;
    mark_price?: number | null;
    creation_timestamp?: number | null;
}
export declare class DeribitHttpClient {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    getInstruments(currency: "BTC", kind: "future" | "option"): Promise<DeribitInstrumentRecord[]>;
    getBookSummaryByCurrency(currency: "BTC", kind: "future" | "option"): Promise<DeribitBookSummaryRecord[]>;
    private fetchResult;
}
