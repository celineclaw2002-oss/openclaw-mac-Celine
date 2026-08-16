import { extractBookRecord, extractSingleMarketRecord, KALSHI_PARSE_VERSION, parseKalshiPayload } from "../venues/kalshi.js";
export class KalshiStagingParser {
    parseDiscovery(event) {
        this.assertSourceClass(event, "discovery");
        return buildDiscoveryStageRecordFromPayload(parseKalshiPayload(event), event.sourceEventId);
    }
    parseMetadata(event) {
        this.assertSourceClass(event, "metadata");
        const market = extractSingleMarketRecord(parseKalshiPayload(event));
        const rulesText = [market.rules_primary, market.rules_secondary].filter(Boolean).join("\n\n");
        return {
            sourceEventId: event.sourceEventId,
            venueContractId: market.ticker,
            questionText: market.title,
            rulesText,
            rulesHash: event.payloadHash,
            ...withOptionalString("resolutionSourceText", market.settlement_source ?? inferResolutionSourceText(rulesText)),
            ...withOptionalString("settlementTimestampConvention", inferSettlementTimestampConvention(rulesText, market.settlement_time)),
            ...withOptionalString("settlementTimezone", market.settlement_timezone ?? inferSettlementTimezone(rulesText)),
            ...withOptionalString("observationWindowText", market.settlement_window ?? inferObservationWindowText(rulesText)),
            ...withOptionalNumber("evaluationTimestampMs", parseOptionalTime(market.occurrence_datetime ?? market.close_time ?? market.expiration_time)),
            ...(market.status ? { rawStatus: market.status } : {}),
            parseVersion: KALSHI_PARSE_VERSION,
            parseSuccess: true,
            qualityFlags: collectMarketFlags(market)
        };
    }
    parseBook(event) {
        this.assertSourceClass(event, "book");
        const book = extractBookRecord(parseKalshiPayload(event));
        return {
            sourceEventId: event.sourceEventId,
            venueContractId: book.market_ticker,
            yesBids: normalizeLevels(book.yes),
            noBids: normalizeLevels(book.no),
            parseVersion: KALSHI_PARSE_VERSION,
            parseSuccess: true,
            qualityFlags: []
        };
    }
    parseTradeTicker(event) {
        this.assertSourceClass(event, "trade_ticker");
        const market = extractSingleMarketRecord(parseKalshiPayload(event));
        return {
            sourceEventId: event.sourceEventId,
            venueContractId: market.ticker,
            ...withOptionalNumber("lastPrice", undefinedIfNull(market.last_price)),
            ...withOptionalNumber("bestYesBid", undefinedIfNull(market.yes_bid)),
            ...withOptionalNumber("bestYesAsk", undefinedIfNull(market.yes_ask)),
            ...withOptionalNumber("bestNoBid", undefinedIfNull(market.no_bid)),
            ...withOptionalNumber("bestNoAsk", undefinedIfNull(market.no_ask)),
            ...withOptionalNumber("volume", undefinedIfNull(market.volume)),
            ...withOptionalNumber("openInterest", undefinedIfNull(market.open_interest)),
            parseVersion: KALSHI_PARSE_VERSION,
            parseSuccess: true,
            qualityFlags: collectMarketFlags(market)
        };
    }
    parseLifecycleFee(event) {
        this.assertSourceClass(event, "lifecycle_fee");
        const market = extractSingleMarketRecord(parseKalshiPayload(event));
        const feeType = market.fee_type_override ?? market.fee_type;
        const feeMultiplier = market.fee_multiplier_override ?? market.fee_multiplier;
        return {
            sourceEventId: event.sourceEventId,
            venueContractId: market.ticker,
            ...(market.series_ticker ? { seriesTicker: market.series_ticker } : {}),
            ...(market.event_ticker ? { eventTicker: market.event_ticker } : {}),
            ...(market.status ? { rawStatus: market.status } : {}),
            ...(market.can_close_early === null || market.can_close_early === undefined
                ? {}
                : { canCloseEarly: market.can_close_early }),
            ...((feeType || feeMultiplier !== undefined || market.fee_config)
                ? { feeScheduleId: "kalshi-default" }
                : {}),
            ...(feeType ? { feeType } : {}),
            ...(feeMultiplier === null || feeMultiplier === undefined
                ? {}
                : { feeMultiplier }),
            feeConfig: market.fee_config ?? {},
            parseVersion: KALSHI_PARSE_VERSION,
            parseSuccess: true,
            qualityFlags: collectMarketFlags(market)
        };
    }
    assertSourceClass(event, expected) {
        if (event.sourceClass !== expected) {
            throw new Error(`Expected ${expected} event, received ${event.sourceClass}.`);
        }
    }
}
export function buildDiscoveryStageRecordFromPayload(payload, sourceEventId) {
    const market = extractSingleMarketRecord(payload);
    return {
        sourceEventId,
        venueContractId: market.ticker,
        questionText: market.title,
        ...(market.status ? { rawStatus: market.status } : {}),
        ...withOptionalNumber("openTimeMs", parseOptionalTime(market.open_time)),
        ...withOptionalNumber("closeTimeMs", parseOptionalTime(market.close_time ?? market.expiration_time)),
        familyClass: classifyFromPayload(market),
        parseVersion: KALSHI_PARSE_VERSION,
        parseSuccess: true,
        qualityFlags: collectMarketFlags(market)
    };
}
function normalizeLevels(levels) {
    if (!levels) {
        return [];
    }
    return levels
        .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.quantity))
        .map((level) => [level.price, level.quantity]);
}
function parseOptionalTime(value) {
    if (!value) {
        return undefined;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function classifyFromPayload(market) {
    const lower = `${market.title} ${market.category ?? ""}`.toLowerCase();
    if (lower.includes("btc") || lower.includes("bitcoin")) {
        return "btc_threshold_primary";
    }
    if (lower.includes("fed") || lower.includes("fomc") || lower.includes("rate")) {
        return "fed_policy_candidate";
    }
    if ((market.ranges?.length ?? 0) > 1 || market.floor_strike != null || market.cap_strike != null) {
        return "bucket_partition_candidate";
    }
    return "excluded_v1";
}
function collectMarketFlags(market) {
    const flags = [];
    if (!market.rules_primary) {
        flags.push("missing_primary_rules");
    }
    if (!market.settlement_source) {
        flags.push("missing_settlement_source");
    }
    if (market.title.length < 12) {
        flags.push("sparse_question_text");
    }
    return flags;
}
function undefinedIfNull(value) {
    return value ?? undefined;
}
function withOptionalNumber(key, value) {
    return value === undefined ? {} : { [key]: value };
}
function withOptionalString(key, value) {
    return value === undefined ? {} : { [key]: value };
}
function inferSettlementTimestampConvention(rulesText, settlementTime) {
    if (settlementTime) {
        return settlementTime;
    }
    const match = rulesText.match(/(?:as of|at)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)/i);
    return match?.[1];
}
function inferSettlementTimezone(rulesText) {
    const match = rulesText.match(/\b(UTC|ET|EST|EDT|CST|CDT|PST|PDT)\b/i);
    return match?.[1]?.toUpperCase();
}
function inferObservationWindowText(rulesText) {
    const betweenMatch = rulesText.match(/between\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)\s*-\s*\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i);
    if (betweenMatch?.[1] && betweenMatch[2]) {
        return `between ${betweenMatch[1]}-${betweenMatch[2]}`;
    }
    const toMatch = rulesText.match(/\$?([0-9][0-9,]*(?:\.[0-9]+)?)\s+to\s+\$?([0-9][0-9,]*(?:\.[0-9]+)?)/i);
    if (toMatch?.[1] && toMatch[2]) {
        return `${toMatch[1]} to ${toMatch[2]}`;
    }
    const match = rulesText.match(/(during .*?\.)/i);
    return match?.[1]?.trim();
}
function inferResolutionSourceText(rulesText) {
    if (/CF Benchmarks/i.test(rulesText)) {
        return "CF Benchmarks BRTI";
    }
    if (/CPI-U/i.test(rulesText)) {
        return "CPI-U";
    }
    if (/federal funds rate/i.test(rulesText)) {
        return "Federal Reserve target range";
    }
    return undefined;
}
