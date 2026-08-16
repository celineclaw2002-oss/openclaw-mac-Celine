import { deterministicKey } from "../shared/identity.js";
export class InMemoryStateViewsModule {
    store;
    constructor(store) {
        this.store = store;
    }
    async buildQuoteState(contractId, quoteTimeMs) {
        const book = this.store.booksByContractId.get(contractId);
        const ticker = this.store.tickerByContractId.get(contractId);
        if (!book && !ticker) {
            return null;
        }
        const bestYesBid = bestBidFromLevels(book?.yesBids) ?? ticker?.bestYesBid;
        const bestNoBid = bestBidFromLevels(book?.noBids) ?? ticker?.bestNoBid;
        const bestYesAsk = bestNoBid === undefined ? undefined : 100 - bestNoBid;
        const bestNoAsk = bestYesBid === undefined ? undefined : 100 - bestYesBid;
        const quality = scoreQuoteQuality(bestYesBid, bestYesAsk, bestNoBid, bestNoAsk, book?.yesBids, book?.noBids);
        return {
            contractId,
            quoteTimeMs,
            ...(bestYesBid === undefined ? {} : { bestYesBid }),
            ...(bestYesAsk === undefined ? {} : { bestYesAsk }),
            ...(bestNoBid === undefined ? {} : { bestNoBid }),
            ...(bestNoAsk === undefined ? {} : { bestNoAsk }),
            depthLevels: {
                yesBids: book?.yesBids ?? [],
                noBids: book?.noBids ?? []
            },
            quoteQualityScore: quality.score,
            derivedQuoteFlags: [
                ...new Set([
                    ...filterExecutionRelevantFlags(book?.qualityFlags ?? []),
                    ...filterExecutionRelevantFlags(ticker?.qualityFlags ?? []),
                    ...quality.flags
                ])
            ],
            normalizationVersion: "norm-v1",
            ruleParserVersion: "rule-v1",
            feeModelVersion: "fee-v1",
            parseVersion: book?.parseVersion ?? ticker?.parseVersion ?? "unknown"
        };
    }
    async buildLifecycleState(contractId, stateTimeMs) {
        const lifecycle = this.store.lifecycleByContractId.get(contractId);
        if (!lifecycle) {
            return null;
        }
        return {
            contractId,
            stateTimeMs,
            normalizedStatus: normalizeLifecycleStatus(lifecycle.rawStatus),
            normalizationVersion: "norm-v1",
            ruleParserVersion: "rule-v1",
            feeModelVersion: "fee-v1",
            parseVersion: lifecycle.parseVersion
        };
    }
    async buildFeeState(contractId, stateTimeMs) {
        const lifecycle = this.store.lifecycleByContractId.get(contractId);
        if (!lifecycle) {
            return null;
        }
        return {
            contractId,
            stateTimeMs,
            feeScheduleId: lifecycle.feeScheduleId ?? deterministicKey(["fee", "default", contractId]),
            feeFormulaType: lifecycle.feeType ?? "kalshi-default",
            feeParameters: {
                ...lifecycle.feeConfig,
                ...(lifecycle.seriesTicker ? { seriesTicker: lifecycle.seriesTicker } : {}),
                ...(lifecycle.eventTicker ? { eventTicker: lifecycle.eventTicker } : {}),
                ...(lifecycle.feeType ? { feeType: lifecycle.feeType } : {}),
                ...(lifecycle.feeMultiplier === undefined ? {} : { feeMultiplier: lifecycle.feeMultiplier })
            },
            roundingRules: { unit: "cent" },
            normalizationVersion: "norm-v1",
            ruleParserVersion: "rule-v1",
            feeModelVersion: "fee-v1",
            parseVersion: lifecycle.parseVersion
        };
    }
    async buildExecutionState(contractId, stateTimeMs) {
        const ticker = this.store.tickerByContractId.get(contractId);
        const book = this.store.booksByContractId.get(contractId);
        if (!ticker && !book) {
            return null;
        }
        const yesDepth = sumDepth(book?.yesBids);
        const noDepth = sumDepth(book?.noBids);
        const totalDepth = yesDepth + noDepth;
        return {
            contractId,
            stateTimeMs,
            ...(totalDepth === 0 ? {} : { orderBookImbalance: (yesDepth - noDepth) / totalDepth }),
            ...(totalDepth === 0 ? {} : { depthAsymmetry: Math.abs(yesDepth - noDepth) / totalDepth }),
            ...(ticker?.volume === undefined ? {} : { tradeIntensityShort: ticker.volume }),
            ...(ticker?.openInterest === undefined ? {} : { queueEstimationConfidence: Math.min(1, ticker.openInterest / 1000) }),
            normalizationVersion: "norm-v1",
            ruleParserVersion: "rule-v1",
            feeModelVersion: "fee-v1",
            parseVersion: ticker?.parseVersion ?? book?.parseVersion ?? "unknown"
        };
    }
}
function sumDepth(levels) {
    if (!levels) {
        return 0;
    }
    return levels.reduce((sum, [, size]) => sum + size, 0);
}
function bestBidFromLevels(levels) {
    if (!levels || levels.length === 0) {
        return undefined;
    }
    return levels.reduce((best, [price]) => {
        if (best === undefined || price > best) {
            return price;
        }
        return best;
    }, undefined);
}
function normalizeLifecycleStatus(rawStatus) {
    switch (rawStatus?.toLowerCase()) {
        case "initialized":
            return "initialized";
        case "listed":
            return "listed";
        case "active":
        case "open":
            return "active";
        case "paused":
            return "paused";
        case "closed":
            return "closed";
        case "determined":
            return "determined";
        case "disputed":
            return "disputed";
        case "amended":
            return "amended";
        case "finalized":
            return "finalized";
        default:
            return "listed";
    }
}
function scoreQuoteQuality(bestYesBid, bestYesAsk, bestNoBid, bestNoAsk, yesBids, noBids) {
    const flags = [];
    const yesDepth = sumDepth(yesBids);
    const noDepth = sumDepth(noBids);
    const totalDepth = yesDepth + noDepth;
    if (bestYesBid === undefined && bestNoBid === undefined) {
        flags.push("missing_top_of_book");
        return { score: 0.1, flags };
    }
    if (bestYesBid === 0 && bestYesAsk === 0 && bestNoBid === 100 && bestNoAsk === 100) {
        flags.push("placeholder_quote");
        return { score: 0.05, flags };
    }
    let score = 0.85;
    if (bestYesBid === undefined || bestYesAsk === undefined) {
        flags.push("one_sided_quote");
        score -= 0.25;
    }
    if (bestYesBid !== undefined && bestYesAsk !== undefined) {
        if (bestYesBid >= bestYesAsk) {
            flags.push("crossed_or_locked_yes_book");
            score -= 0.4;
        }
        else {
            const spread = bestYesAsk - bestYesBid;
            if (spread >= 10) {
                flags.push("wide_yes_spread");
                score -= 0.2;
            }
            else if (spread >= 5) {
                flags.push("moderate_yes_spread");
                score -= 0.1;
            }
        }
    }
    if (totalDepth === 0) {
        flags.push("empty_book_depth");
        score -= 0.35;
    }
    else if (totalDepth < 25) {
        flags.push("thin_book_depth");
        score -= 0.2;
    }
    if (yesDepth === 0 || noDepth === 0) {
        flags.push("one_sided_depth");
        score -= 0.1;
    }
    return {
        score: Math.max(0.05, Math.min(0.95, score)),
        flags
    };
}
function filterExecutionRelevantFlags(flags) {
    return flags.filter((flag) => !["missing_settlement_source", "missing_primary_rules", "sparse_question_text"].includes(flag));
}
