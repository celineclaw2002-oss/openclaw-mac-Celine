import { estimateKalshiFeeCents } from "../shared/fees.js";
import { deterministicKey } from "../shared/identity.js";
export class DeterministicObservationModule {
    inputs;
    constructor(inputs) {
        this.inputs = inputs;
    }
    async buildInternalEdgeObservation(edgeId, observationTimeMs) {
        const edge = this.inputs.edgesById.get(edgeId);
        if (!edge) {
            return null;
        }
        const sourceMid = averageMid(edge.sourceContractIds, this.inputs.quotesByContractId);
        const targetMid = averageMid(edge.targetContractIds, this.inputs.quotesByContractId);
        if (sourceMid === null) {
            return null;
        }
        const allContractIds = [...new Set([...edge.sourceContractIds, ...edge.targetContractIds])];
        const quoteSummary = summarizeQuotes(allContractIds, this.inputs.quotesByContractId);
        const theoreticalTarget = edge.edgeType === "complement" ? 100 - sourceMid : sourceMid;
        const comparison = targetMid ?? theoreticalTarget;
        const grossResidual = sourceMid - comparison;
        const feeSummary = summarizeFees(allContractIds, this.inputs.feeByContractId, this.inputs.quotesByContractId);
        const executionSummary = summarizeExecution(allContractIds, this.inputs.executionByContractId, this.inputs.quotesByContractId);
        const qualityFlags = new Set(quoteSummary.derivedFlags);
        if (targetMid === null) {
            qualityFlags.add("theoretical_target_substituted");
        }
        if (feeSummary.missingFeeContracts > 0) {
            qualityFlags.add("missing_fee_state");
        }
        if (feeSummary.placeholderFeeContracts > 0) {
            qualityFlags.add("placeholder_fee_model");
        }
        for (const executionFlag of executionSummary.flags) {
            qualityFlags.add(executionFlag);
        }
        const finalQualityFlags = [...qualityFlags].sort();
        return {
            observationId: deterministicKey(["obs", "internal", edgeId, observationTimeMs]),
            edgeId,
            eventFamilyId: inferEventFamilyId(edge.sourceContractIds[0]),
            observationTimeMs,
            grossResidual,
            netFeeAdjustedResidual: Math.abs(grossResidual) - feeSummary.averageFee,
            depthAdjustedResidual: Math.abs(grossResidual) - feeSummary.averageFee - executionSummary.averageExecutionPenalty,
            averageQuoteQuality: quoteSummary.averageQuoteQuality,
            modeledEntryFillProbability: executionSummary.modeledFillProbability,
            modeledExecutionPenalty: executionSummary.averageExecutionPenalty,
            semanticSafeFlag: edge.confidenceScore >= 0.75,
            executionSafeFlag: quoteSummary.averageQuoteQuality >= 0.75 &&
                executionSummary.modeledFillProbability >= 0.55 &&
                feeSummary.missingFeeContracts === 0 &&
                feeSummary.placeholderFeeContracts === 0 &&
                finalQualityFlags.every((flag) => !isExecutionBlockingFlag(flag)),
            qualityFlags: finalQualityFlags,
            normalizationVersion: "norm-v1",
            ruleParserVersion: "rule-v1",
            feeModelVersion: "fee-v1",
            parseVersion: "obs-v1",
            graphVersion: edge.graphVersion,
            simulationVersion: "sim-v1"
        };
    }
    async buildExternalAnchorObservation(contractId, observationTimeMs) {
        const quote = this.inputs.quotesByContractId.get(contractId);
        const anchor = this.inputs.anchorsByContractId.get(contractId);
        if (!quote || !anchor) {
            return null;
        }
        const mid = midpointFromQuote(quote);
        if (mid === null) {
            return null;
        }
        const marketProbabilityMid = mid / 100;
        const rawResidual = marketProbabilityMid - anchor.rawProbability;
        return {
            observationId: deterministicKey(["obs", "anchor", contractId, observationTimeMs]),
            contractId,
            anchorFamily: anchor.anchorFamily,
            observationTimeMs,
            tradableFlag: true,
            marketProbabilityMid,
            rawResidual,
            calibratedResidual: rawResidual - ((anchor.calibratedProbability ?? anchor.rawProbability) - anchor.rawProbability),
            uncertaintyAdjustedResidual: rawResidual - ((anchor.uncertaintyBandHigh ?? anchor.rawProbability) - (anchor.uncertaintyBandLow ?? anchor.rawProbability)),
            mappingSafeFlag: anchor.mappingConfidenceScore >= 0.75,
            qualityFlags: [],
            normalizationVersion: "norm-v1",
            ruleParserVersion: "rule-v1",
            feeModelVersion: "fee-v1",
            parseVersion: "obs-v1",
            anchorModelVersion: "anchor-v1",
            simulationVersion: "sim-v1"
        };
    }
}
function inferEventFamilyId(contractId) {
    if (!contractId) {
        return "family::unknown";
    }
    const normalized = contractId.replace(/^contract::/, "");
    const parts = normalized.split("-");
    if (parts.length <= 1) {
        return `family::${normalized}`;
    }
    return `family::${parts.slice(0, -1).join("-")}`;
}
export function deriveQuoteMidpoint(quote) {
    return midpointFromQuote(quote);
}
function averageMid(contractIds, quotes) {
    const mids = contractIds
        .map((contractId) => quotes.get(contractId))
        .map((quote) => (quote ? midpointFromQuote(quote) : null))
        .filter((value) => value !== null);
    if (mids.length === 0) {
        return null;
    }
    return mids.reduce((sum, value) => sum + value, 0) / mids.length;
}
function summarizeQuotes(contractIds, quotes) {
    const present = contractIds.map((contractId) => quotes.get(contractId)).filter((quote) => quote !== undefined);
    if (present.length === 0) {
        return {
            averageQuoteQuality: 0,
            derivedFlags: ["missing_quote_state"]
        };
    }
    const averageQuoteQuality = present.reduce((sum, quote) => sum + quote.quoteQualityScore, 0) / present.length;
    const derivedFlags = [...new Set(present.flatMap((quote) => quote.derivedQuoteFlags))].sort();
    return {
        averageQuoteQuality,
        derivedFlags
    };
}
function summarizeExecution(contractIds, executionStates, quotes) {
    let totalPenalty = 0;
    let totalFillProbability = 0;
    let contractsSeen = 0;
    const flags = new Set();
    for (const contractId of contractIds) {
        const execution = executionStates.get(contractId);
        const quote = quotes.get(contractId);
        if (!execution) {
            totalPenalty += 1;
            totalFillProbability += 0.35;
            contractsSeen += 1;
            flags.add("missing_execution_state");
            continue;
        }
        const depth = extractVisibleDepth(quote);
        const depthScore = depth >= 500 ? 1 : depth >= 150 ? 0.85 : depth >= 50 ? 0.65 : depth > 0 ? 0.4 : 0.2;
        const flowRaw = execution.tradeIntensityShort ?? 0;
        const flowScore = flowRaw >= 1000 ? 1 : flowRaw >= 200 ? 0.85 : flowRaw >= 25 ? 0.65 : flowRaw > 0 ? 0.45 : 0.25;
        const queueScore = execution.queueEstimationConfidence ?? 0.35;
        const asymmetry = execution.depthAsymmetry ?? 0.5;
        const imbalancePenalty = Math.min(0.35, asymmetry * 0.35);
        const fillProbability = clamp01(0.15 + depthScore * 0.35 + flowScore * 0.25 + queueScore * 0.15 - imbalancePenalty);
        const executionPenalty = Math.max(0.1, (1 - depthScore) * 1.1 + (1 - flowScore) * 0.6 + (1 - queueScore) * 0.4 + asymmetry * 0.4);
        if (depth < 25) {
            flags.add("shallow_visible_depth");
        }
        if (flowRaw < 25) {
            flags.add("low_trade_intensity");
        }
        if ((execution.queueEstimationConfidence ?? 0) < 0.4) {
            flags.add("low_queue_confidence");
        }
        if (asymmetry > 0.8) {
            flags.add("high_depth_asymmetry");
        }
        totalPenalty += executionPenalty;
        totalFillProbability += fillProbability;
        contractsSeen += 1;
    }
    return {
        averageExecutionPenalty: contractsSeen === 0 ? 0 : totalPenalty / contractsSeen,
        modeledFillProbability: contractsSeen === 0 ? 0 : totalFillProbability / contractsSeen,
        flags: [...flags].sort()
    };
}
function midpointFromQuote(quote) {
    if (quote.bestYesBid !== undefined && quote.bestYesAsk !== undefined) {
        if (quote.bestYesBid >= quote.bestYesAsk) {
            return null;
        }
        if (quote.bestYesBid <= 0 && quote.bestYesAsk <= 0) {
            return null;
        }
        return (quote.bestYesBid + quote.bestYesAsk) / 2;
    }
    if (quote.bestYesBid !== undefined) {
        if (quote.bestYesBid <= 0) {
            return null;
        }
        return quote.bestYesBid;
    }
    if (quote.bestNoBid !== undefined) {
        if (quote.bestNoBid >= 100) {
            return null;
        }
        return 100 - quote.bestNoBid;
    }
    return null;
}
function extractVisibleDepth(quote) {
    if (!quote) {
        return 0;
    }
    const yesDepth = Array.isArray(quote.depthLevels.yesBids)
        ? quote.depthLevels.yesBids.reduce((sum, [, size]) => sum + size, 0)
        : 0;
    const noDepth = Array.isArray(quote.depthLevels.noBids)
        ? quote.depthLevels.noBids.reduce((sum, [, size]) => sum + size, 0)
        : 0;
    return yesDepth + noDepth;
}
function summarizeFees(contractIds, fees, quotes) {
    let totalFee = 0;
    let pricedContracts = 0;
    let missingFeeContracts = 0;
    let placeholderFeeContracts = 0;
    const feeModes = new Set();
    for (const contractId of contractIds) {
        const feeState = fees.get(contractId);
        if (!feeState) {
            missingFeeContracts += 1;
            totalFee += 0.5;
            pricedContracts += 1;
            feeModes.add("fallback_default");
            continue;
        }
        const quote = quotes.get(contractId);
        const priceCents = quote ? midpointFromQuote(quote) : null;
        const estimatedFee = estimateKalshiFeeCents(feeState, priceCents ?? 50);
        if (estimatedFee.placeholder) {
            placeholderFeeContracts += 1;
        }
        totalFee += estimatedFee.estimatedFeeCents;
        pricedContracts += 1;
        feeModes.add(estimatedFee.mode);
    }
    return {
        averageFee: pricedContracts === 0 ? 0 : totalFee / pricedContracts,
        missingFeeContracts,
        placeholderFeeContracts,
        feeModes: [...feeModes].sort()
    };
}
function isExecutionBlockingFlag(flag) {
    return (flag === "missing_quote_state" ||
        flag === "missing_fee_state" ||
        flag === "missing_execution_state" ||
        flag.startsWith("placeholder_") ||
        flag.startsWith("crossed_") ||
        flag.startsWith("empty_") ||
        flag.startsWith("one_sided_") ||
        flag.startsWith("shallow_") ||
        flag.startsWith("low_") ||
        flag.startsWith("high_") ||
        flag === "theoretical_target_substituted");
}
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
