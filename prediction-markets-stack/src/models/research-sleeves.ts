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

interface SleeveDefinition {
  sleeveId: string;
  title: string;
  weight: number;
  score: (candidate: CandidateModelInput, regime: ResearchRegimeInput) => number;
}

const sleeveRegistry: SleeveDefinition[] = [
  {
    sleeveId: "anchor_residual",
    title: "Anchor Residual",
    weight: 0.5,
    score: (candidate) => clamp01(candidate.netEdgeToEntry / 0.2)
  },
  {
    sleeveId: "trend_regime",
    title: "Trend Regime",
    weight: 0.3,
    score: (candidate, regime) => {
      const prefersTrend =
        regime.trendBucket === "up" ? "yes" : regime.trendBucket === "down" ? "no" : undefined;
      const trendAlignment = prefersTrend === undefined ? 0.5 : prefersTrend === candidate.side ? 1 : 0.2;
      const volAdjustment = regime.volBucket === "high" ? 0.85 : regime.volBucket === "low" ? 1 : 0.95;
      return clamp01(trendAlignment * volAdjustment);
    }
  },
  {
    sleeveId: "carry_horizon",
    title: "Carry Horizon",
    weight: 0.2,
    score: (candidate) => {
      const horizonScore = 1 - clamp01(candidate.horizonDays / 365);
      const barrierScore = 1 - clamp01(Math.abs(candidate.barrierMultiplier - 1) / 0.5);
      return clamp01(0.55 * horizonScore + 0.45 * barrierScore);
    }
  }
];

export function buildResearchModelDiagnostics(inputs: {
  candidates: CandidateModelInput[];
  regime: ResearchRegimeInput;
  topCount?: number;
}): ResearchModelDiagnostics {
  const candidateSummaries = inputs.candidates.map((candidate) => buildCandidateModelSummary(candidate, inputs.regime));
  const sorted = [...candidateSummaries].sort((left, right) => right.ensembleScore - left.ensembleScore);
  const topCount = Math.max(1, inputs.topCount ?? 12);
  const sleeves = sleeveRegistry.map((sleeve) => {
    const sleeveRows = candidateSummaries.map((candidate) => candidate.sleeveBreakdown.find((row) => row.sleeveId === sleeve.sleeveId));
    const populated = sleeveRows.filter((row): row is CandidateSleeveBreakdown => row !== undefined);
    return {
      sleeveId: sleeve.sleeveId,
      title: sleeve.title,
      weight: sleeve.weight,
      candidates: populated.length,
      allowedEntries: candidateSummaries.filter((candidate) => candidate.allowEntry).length,
      averageScore: mean(populated.map((row) => row.score)),
      averageContribution: mean(populated.map((row) => row.contribution)),
      averageNetEdgeToEntry: mean(candidateSummaries.map((candidate) => candidate.netEdgeToEntry))
    };
  });
  return {
    sleeves,
    topCandidates: sorted.slice(0, topCount),
    allowedEntries: candidateSummaries.filter((candidate) => candidate.allowEntry).length,
    blockedEntries: candidateSummaries.filter((candidate) => !candidate.allowEntry).length,
    averageEnsembleScore: mean(candidateSummaries.map((candidate) => candidate.ensembleScore)),
    averageExpectedEdgeScore: mean(candidateSummaries.map((candidate) => candidate.expectedEdgeScore))
  };
}

export function buildCandidateModelSummary(
  candidate: CandidateModelInput,
  regime: ResearchRegimeInput
): CandidateModelSummary {
  const sleeveBreakdown = sleeveRegistry.map((sleeve) => {
    const score = sleeve.score(candidate, regime);
    return {
      sleeveId: sleeve.sleeveId,
      title: sleeve.title,
      weight: sleeve.weight,
      score,
      contribution: score * sleeve.weight
    };
  });
  const ensembleScore = sleeveBreakdown.reduce((sum, sleeve) => sum + sleeve.contribution, 0);
  return {
    marketSlug: candidate.marketSlug,
    eventSlug: candidate.eventSlug,
    side: candidate.side,
    allowEntry: candidate.allowEntry,
    qualityBucket: candidate.qualityBucket,
    signal: candidate.signal,
    modelProbabilityForSide: candidate.modelProbabilityForSide,
    entryPriceCents: candidate.entryPriceCents,
    ...(candidate.markPriceCents === undefined ? {} : { markPriceCents: candidate.markPriceCents }),
    grossEdgeToMid: candidate.grossEdgeToMid,
    netEdgeToEntry: candidate.netEdgeToEntry,
    spreadCostProbability: candidate.spreadCostProbability,
    barrierMultiplier: candidate.barrierMultiplier,
    horizonDays: candidate.horizonDays,
    ensembleScore,
    expectedEdgeScore: ensembleScore * Math.max(candidate.netEdgeToEntry, 0),
    sleeveBreakdown
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
