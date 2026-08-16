export function estimateKalshiFeeCents(feeState, priceCents) {
    if (!feeState || priceCents === null || priceCents === undefined || !Number.isFinite(priceCents)) {
        return {
            estimatedFeeCents: 0.5,
            placeholder: true,
            mode: "fallback_default"
        };
    }
    const feeType = extractString(feeState.feeParameters.feeType) ??
        (feeState.feeFormulaType === "kalshi-default" ? null : feeState.feeFormulaType);
    const feeMultiplier = extractNumber(feeState.feeParameters.feeMultiplier) ?? 1;
    const boundedPrice = Math.min(100, Math.max(0, priceCents));
    if (feeType === "flat") {
        return {
            estimatedFeeCents: Math.max(0, feeMultiplier),
            placeholder: false,
            mode: "flat"
        };
    }
    if (feeType === "quadratic" || feeType === "quadratic_with_maker_fees") {
        const probability = boundedPrice / 100;
        const estimatedFeeCents = 7 * feeMultiplier * probability * (1 - probability);
        return {
            estimatedFeeCents,
            placeholder: false,
            mode: feeType === "quadratic" ? "quadratic_taker" : "quadratic_with_maker_fees_taker"
        };
    }
    return {
        estimatedFeeCents: 0.5,
        placeholder: true,
        mode: "fallback_default"
    };
}
function extractNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function extractString(value) {
    return typeof value === "string" && value.length > 0 ? value : null;
}
