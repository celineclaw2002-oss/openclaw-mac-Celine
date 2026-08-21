import type { CandidateModelSummary } from "../models/research-sleeves.js";
export interface StressScenarioResult {
    scenarioId: string;
    title: string;
    shockDescription: string;
    estimatedPnlCents: number;
    returnImpact: number;
    worstMarkets: Array<{
        marketSlug: string;
        side: "yes" | "no";
        impactCents: number;
    }>;
}
export declare function runStressTests(inputs: {
    totalCapitalCents: number;
    openPositions: Array<{
        marketSlug: string;
        side: "yes" | "no";
        quantity: number;
        entryPriceCents: number;
        markPriceCents?: number;
        barrierMultiplier?: number;
    }>;
    latestCandidates: CandidateModelSummary[];
}): StressScenarioResult[];
