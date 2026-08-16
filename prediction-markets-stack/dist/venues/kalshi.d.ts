import type { FamilyClass } from "../shared/enums.js";
import type { SourceEvent, SourceClass } from "../domain/source-events.js";
export interface KalshiRangeRecord {
    floor?: number | null;
    cap?: number | null;
    floor_inclusive?: boolean | null;
    cap_inclusive?: boolean | null;
    label?: string | null;
}
export interface KalshiMarketRecord {
    ticker: string;
    title: string;
    event_ticker?: string | null;
    series_ticker?: string | null;
    subtitle?: string | null;
    category?: string | null;
    status?: string | null;
    rules_primary?: string | null;
    rules_secondary?: string | null;
    settlement_source?: string | null;
    settlement_timezone?: string | null;
    settlement_window?: string | null;
    settlement_time?: string | null;
    occurrence_datetime?: string | null;
    open_time?: string | null;
    close_time?: string | null;
    expiration_time?: string | null;
    floor_strike?: number | null;
    cap_strike?: number | null;
    strike_type?: "greater" | "greater_or_equal" | "less" | "less_or_equal" | null;
    yes_bid?: number | null;
    yes_ask?: number | null;
    no_bid?: number | null;
    no_ask?: number | null;
    last_price?: number | null;
    volume?: number | null;
    open_interest?: number | null;
    ranges?: KalshiRangeRecord[] | null;
    fee_config?: Record<string, unknown> | null;
    fee_type?: string | null;
    fee_multiplier?: number | null;
    fee_type_override?: string | null;
    fee_multiplier_override?: number | null;
    can_close_early?: boolean | null;
}
export interface KalshiBookLevel {
    price: number;
    quantity: number;
}
export interface KalshiBookRecord {
    market_ticker: string;
    yes?: KalshiBookLevel[] | null;
    no?: KalshiBookLevel[] | null;
}
export interface KalshiApiMarket {
    ticker: string;
    title: string;
    event_ticker?: string;
    series_ticker?: string;
    yes_bid_dollars?: string | null;
    yes_ask_dollars?: string | null;
    no_bid_dollars?: string | null;
    no_ask_dollars?: string | null;
    last_price_dollars?: string | null;
    volume_fp?: string | null;
    open_interest_fp?: string | null;
    rules_primary?: string | null;
    rules_secondary?: string | null;
    subtitle?: string | null;
    category?: string | null;
    status?: string | null;
    settlement_source?: string | null;
    settlement_timezone?: string | null;
    settlement_window?: string | null;
    settlement_time?: string | null;
    open_time?: string | null;
    close_time?: string | null;
    expiration_time?: string | null;
    floor_strike?: number | null;
    cap_strike?: number | null;
    strike_type?: "greater" | "greater_or_equal" | "less" | "less_or_equal" | string | null;
    price_ranges?: Array<{
        start?: string;
        end?: string;
        step?: string;
    }> | null;
    fee_config?: Record<string, unknown> | null;
    fee_type?: string | null;
    fee_multiplier?: number | null;
    fee_type_override?: string | null;
    fee_multiplier_override?: number | null;
    can_close_early?: boolean | null;
}
export interface KalshiApiSeries {
    ticker: string;
    fee_type?: string | null;
    fee_multiplier?: number | null;
    title?: string | null;
    category?: string | null;
}
export interface KalshiApiEvent {
    event_ticker: string;
    series_ticker?: string | null;
    fee_type_override?: string | null;
    fee_multiplier_override?: number | null;
    title?: string | null;
}
export interface KalshiApiMarketsResponse {
    cursor?: string;
    markets: KalshiApiMarket[];
}
export interface KalshiApiMarketResponse {
    market: KalshiApiMarket;
}
export interface KalshiApiSeriesResponse {
    series: KalshiApiSeries;
}
export interface KalshiApiEventResponse {
    event: KalshiApiEvent;
    markets?: KalshiApiMarket[] | null;
}
export interface KalshiApiOrderbookResponse {
    orderbook_fp: {
        yes_dollars?: Array<[price: string | number, size: string | number]> | null;
        no_dollars?: Array<[price: string | number, size: string | number]> | null;
    };
}
export interface KalshiSourceEventInput {
    captureSessionId: string;
    collectorVersion: string;
    endpointOrStream: string;
    normalizedTimestampMs: number;
    receiptTimestampMs: number;
    sourceClass: SourceClass;
    venueTimestampMs?: number;
}
export declare const KALSHI_PARSE_VERSION = "kalshi-v1";
export declare function hashPayload(rawPayload: string): string;
export declare function buildSourceEvent(input: KalshiSourceEventInput, payload: unknown): SourceEvent;
export declare function parseKalshiPayload<T>(event: SourceEvent): T;
export declare function extractSingleMarketRecord(payload: unknown): KalshiMarketRecord;
export declare function extractBookRecord(payload: unknown): KalshiBookRecord;
export declare function classifyKalshiFamily(questionText: string, categoryLabel?: string): FamilyClass;
