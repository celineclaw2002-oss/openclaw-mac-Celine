export interface CandidateModelInput {
    marketSlug: string;
    eventSlug: string;
    side: "yes" | "no";
    signal: number;
    modelProbabilityForSide: number;
    anchorProbability: number;
    entryPriceCents: number;
    markPriceCents?: number;
    grossEdgeToMid: number;
    netEdgeToEntry: number;
    spreadCostProbability: number;
    barrierMultiplier: number;
    horizonDays: number;
    qualityBucket: "fallback" | "strong" | "medium" | "cautious" | "blocked";
    allowEntry: boolean;
}
export interface ResearchRegimeInput {
    annualizedVol: number;
    volBucket?: "low" | "medium" | "high";
    trendBucket?: "down" | "flat" | "up";
    momentum20d?: number;
    momentum60d?: number;
}
export interface CandidateSleeveBreakdown {
    sleeveId: string;
    title: string;
    weight: number;
    score: number;
    contribution: number;
}
export interface CandidateModelSummary {
    marketSlug: string;
    eventSlug: string;
    side: "yes" | "no";
    allowEntry: boolean;
    qualityBucket: CandidateModelInput["qualityBucket"];
    signal: number;
    modelProbabilityForSide: number;
    entryPriceCents: number;
    markPriceCents?: number;
    grossEdgeToMid: number;
    netEdgeToEntry: number;
    spreadCostProbability: number;
    barrierMultiplier: number;
    horizonDays: number;
    ensembleScore: number;
    expectedEdgeScore: number;
    sleeveBreakdown: CandidateSleeveBreakdown[];
}
export interface SleeveAggregateSummary {
    sleeveId: string;
    title: string;
    weight: number;
    candidates: number;
    allowedEntries: number;
    averageScore: number;
    averageContribution: number;
    averageNetEdgeToEntry: number;
}
export interface ResearchModelDiagnostics {
    sleeves: SleeveAggregateSummary[];
    topCandidates: CandidateModelSummary[];
    allowedEntries: number;
    blockedEntries: number;
    averageEnsembleScore: number;
    averageExpectedEdgeScore: number;
}
export declare function buildResearchModelDiagnostics(inputs: {
    candidates: CandidateModelInput[];
    regime: ResearchRegimeInput;
    topCount?: number;
}): ResearchModelDiagnostics;
export declare function buildCandidateModelSummary(candidate: CandidateModelInput, regime: ResearchRegimeInput): CandidateModelSummary;
