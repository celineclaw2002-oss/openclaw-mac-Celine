import type { CandidateModelSummary, SleeveAggregateSummary } from "../models/research-sleeves.js";
export interface CapitalAllocatorSleeveInput extends SleeveAggregateSummary {
    currentExposureCents?: number;
}
export interface CapitalAllocatorOutput {
    totalCapitalCents: number;
    sleeves: Array<{
        sleeveId: string;
        title: string;
        targetWeight: number;
        targetCapitalCents: number;
        convictionScore: number;
        crowdingPenalty: number;
    }>;
}
export declare function allocateCapitalAcrossSleeves(inputs: {
    totalCapitalCents: number;
    sleeves: CapitalAllocatorSleeveInput[];
    topCandidates: CandidateModelSummary[];
}): CapitalAllocatorOutput;
