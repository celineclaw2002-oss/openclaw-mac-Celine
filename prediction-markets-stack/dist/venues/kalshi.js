import { deterministicKey } from "../shared/identity.js";
export const KALSHI_PARSE_VERSION = "kalshi-v1";
export function hashPayload(rawPayload) {
    let hash = 2166136261;
    for (let index = 0; index < rawPayload.length; index += 1) {
        hash ^= rawPayload.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0).toString(16).padStart(8, "0");
}
export function buildSourceEvent(input, payload) {
    const rawPayload = JSON.stringify(payload);
    return {
        sourceEventId: deterministicKey([
            "kalshi",
            input.sourceClass,
            input.endpointOrStream,
            input.normalizedTimestampMs,
            hashPayload(rawPayload).slice(0, 16)
        ]),
        venueId: "kalshi",
        sourceClass: input.sourceClass,
        endpointOrStream: input.endpointOrStream,
        rawPayload,
        payloadHash: hashPayload(rawPayload),
        captureSessionId: input.captureSessionId,
        collectorVersion: input.collectorVersion,
        ...(input.venueTimestampMs === undefined ? {} : { venueTimestampMs: input.venueTimestampMs }),
        receiptTimestampMs: input.receiptTimestampMs,
        normalizedTimestampMs: input.normalizedTimestampMs
    };
}
export function parseKalshiPayload(event) {
    return JSON.parse(event.rawPayload);
}
export function extractSingleMarketRecord(payload) {
    if (isObject(payload) && isLikelyKalshiApiMarket(payload)) {
        return mapKalshiApiMarket(payload);
    }
    if (isKalshiMarketRecord(payload)) {
        return payload;
    }
    if (isObject(payload) && isObject(payload.market) && isLikelyKalshiApiMarket(payload.market)) {
        return mapKalshiApiMarket(payload.market);
    }
    if (isObject(payload) && isKalshiMarketRecord(payload.market)) {
        return payload.market;
    }
    if (isObject(payload) &&
        Array.isArray(payload.markets) &&
        payload.markets.length === 1 &&
        isObject(payload.markets[0]) &&
        isLikelyKalshiApiMarket(payload.markets[0])) {
        return mapKalshiApiMarket(payload.markets[0]);
    }
    if (isObject(payload) &&
        Array.isArray(payload.markets) &&
        payload.markets.length === 1 &&
        isKalshiMarketRecord(payload.markets[0])) {
        return payload.markets[0];
    }
    throw new Error("Expected a single Kalshi market payload.");
}
export function extractBookRecord(payload) {
    if (isObject(payload) && typeof payload.market_ticker === "string" && isObject(payload.orderbook_fp)) {
        return mapKalshiApiOrderbook(payload.market_ticker, payload.orderbook_fp);
    }
    if (isKalshiBookRecord(payload)) {
        return payload;
    }
    if (isObject(payload) && isKalshiBookRecord(payload.orderbook)) {
        return payload.orderbook;
    }
    throw new Error("Expected a Kalshi order book payload.");
}
export function classifyKalshiFamily(questionText, categoryLabel) {
    const normalized = `${questionText} ${categoryLabel ?? ""}`.toLowerCase();
    if (normalized.includes("btc") || normalized.includes("bitcoin")) {
        return "btc_threshold_primary";
    }
    if (normalized.includes("between") ||
        normalized.includes("range") ||
        normalized.includes("bucket") ||
        normalized.includes("from") && normalized.includes("to")) {
        return "bucket_partition_candidate";
    }
    if (normalized.includes("fed") || normalized.includes("fomc") || normalized.includes("rate")) {
        return "fed_policy_candidate";
    }
    return "excluded_v1";
}
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function isKalshiMarketRecord(value) {
    return isObject(value) && typeof value.ticker === "string" && typeof value.title === "string";
}
function isKalshiBookRecord(value) {
    return isObject(value) && typeof value.market_ticker === "string";
}
function isLikelyKalshiApiMarket(value) {
    return isObject(value) && typeof value.ticker === "string" && typeof value.title === "string";
}
function mapKalshiApiMarket(market) {
    const normalizedStrikeType = normalizeStrikeType(market.strike_type);
    const yesBid = parseDollarsToCents(market.yes_bid_dollars);
    const yesAsk = parseDollarsToCents(market.yes_ask_dollars);
    const noBid = parseDollarsToCents(market.no_bid_dollars);
    const noAsk = parseDollarsToCents(market.no_ask_dollars);
    const lastPrice = parseDollarsToCents(market.last_price_dollars);
    const volume = parseOptionalFloat(market.volume_fp);
    const openInterest = parseOptionalFloat(market.open_interest_fp);
    const inferredRanges = inferRangesFromPriceRanges(market.price_ranges);
    return {
        ticker: market.ticker,
        title: market.title,
        ...(market.subtitle === undefined ? {} : { subtitle: market.subtitle }),
        ...(market.category === undefined ? {} : { category: market.category }),
        ...(market.status === undefined ? {} : { status: market.status }),
        ...(market.rules_primary === undefined ? {} : { rules_primary: market.rules_primary }),
        ...(market.rules_secondary === undefined ? {} : { rules_secondary: market.rules_secondary }),
        ...(market.settlement_source === undefined ? {} : { settlement_source: market.settlement_source }),
        ...(market.settlement_timezone === undefined ? {} : { settlement_timezone: market.settlement_timezone }),
        ...(market.settlement_window === undefined ? {} : { settlement_window: market.settlement_window }),
        ...(market.settlement_time === undefined ? {} : { settlement_time: market.settlement_time }),
        ...(market.open_time === undefined ? {} : { open_time: market.open_time }),
        ...(market.close_time === undefined ? {} : { close_time: market.close_time }),
        ...(market.expiration_time === undefined ? {} : { expiration_time: market.expiration_time }),
        ...(market.floor_strike === undefined ? {} : { floor_strike: market.floor_strike }),
        ...(market.cap_strike === undefined ? {} : { cap_strike: market.cap_strike }),
        ...(normalizedStrikeType === null ? {} : { strike_type: normalizedStrikeType }),
        ...(yesBid === null ? {} : { yes_bid: yesBid }),
        ...(yesAsk === null ? {} : { yes_ask: yesAsk }),
        ...(noBid === null ? {} : { no_bid: noBid }),
        ...(noAsk === null ? {} : { no_ask: noAsk }),
        ...(lastPrice === null ? {} : { last_price: lastPrice }),
        ...(volume === null ? {} : { volume }),
        ...(openInterest === null ? {} : { open_interest: openInterest }),
        ...(inferredRanges === null ? {} : { ranges: inferredRanges }),
        ...(market.fee_config === undefined ? {} : { fee_config: market.fee_config }),
        ...(market.can_close_early === undefined ? {} : { can_close_early: market.can_close_early })
    };
}
function mapKalshiApiOrderbook(marketTicker, orderbook) {
    return {
        market_ticker: marketTicker,
        yes: normalizeBookLevels(orderbook.yes_dollars),
        no: normalizeBookLevels(orderbook.no_dollars)
    };
}
function parseDollarsToCents(value) {
    if (!value) {
        return null;
    }
    return Math.round(Number(value) * 100);
}
function parseOptionalFloat(value) {
    if (!value) {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function normalizeStrikeType(value) {
    if (value === "greater" ||
        value === "greater_or_equal" ||
        value === "less" ||
        value === "less_or_equal") {
        return value;
    }
    return null;
}
function inferRangesFromPriceRanges(ranges) {
    if (!ranges?.length) {
        return null;
    }
    return ranges.map((range) => ({
        floor: range.start ? Number(range.start) : null,
        cap: range.end ? Number(range.end) : null,
        label: range.step ?? null
    }));
}
function normalizeBookLevels(levels) {
    if (!levels) {
        return null;
    }
    return levels.map(([price, quantity]) => ({
        price: typeof price === "string" ? Math.round(Number(price) * 100) : price,
        quantity: typeof quantity === "string" ? Number(quantity) : quantity
    }));
}
