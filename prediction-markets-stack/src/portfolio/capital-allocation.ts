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

export function allocateCapitalAcrossSleeves(inputs: {
  totalCapitalCents: number;
  sleeves: CapitalAllocatorSleeveInput[];
  topCandidates: CandidateModelSummary[];
}): CapitalAllocatorOutput {
  const scored = inputs.sleeves.map((sleeve) => {
    const candidateCount = Math.max(1, sleeve.candidates);
    const breadthScore = Math.min(1, candidateCount / 8);
    const crowdingPenalty = Math.min(0.45, (sleeve.currentExposureCents ?? 0) / Math.max(inputs.totalCapitalCents, 1));
    const convictionScore = Math.max(
      0.05,
      sleeve.weight * 0.35 +
        sleeve.averageScore * 0.35 +
        clamp01(sleeve.averageNetEdgeToEntry / 0.15) * 0.2 +
        breadthScore * 0.1 -
        crowdingPenalty
    );
    return {
      sleeveId: sleeve.sleeveId,
      title: sleeve.title,
      convictionScore,
      crowdingPenalty
    };
  });
  const denominator = scored.reduce((sum, sleeve) => sum + sleeve.convictionScore, 0);
  return {
    totalCapitalCents: inputs.totalCapitalCents,
    sleeves: scored.map((sleeve) => {
      const targetWeight = denominator === 0 ? 0 : sleeve.convictionScore / denominator;
      return {
        ...sleeve,
        targetWeight,
        targetCapitalCents: Math.round(targetWeight * inputs.totalCapitalCents)
      };
    })
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}
