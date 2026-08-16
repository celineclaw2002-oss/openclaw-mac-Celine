import type { ContractFeeState } from "../domain/market-state.js";
export interface EstimatedFeeQuote {
    estimatedFeeCents: number;
    placeholder: boolean;
    mode: "quadratic_taker" | "quadratic_with_maker_fees_taker" | "flat" | "fallback_default";
}
export declare function estimateKalshiFeeCents(feeState: ContractFeeState | undefined, priceCents: number | null | undefined): EstimatedFeeQuote;
