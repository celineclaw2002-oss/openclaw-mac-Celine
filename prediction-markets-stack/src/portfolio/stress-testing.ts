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

export function runStressTests(inputs: {
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
}): StressScenarioResult[] {
  const candidateMap = new Map(inputs.latestCandidates.map((candidate) => [candidate.marketSlug, candidate]));
  return [
    buildScenario("spot_down_20_vol_spike", "Spot -20%, vol spike", -0.22, inputs, candidateMap),
    buildScenario("spot_up_15_vol_crush", "Spot +15%, vol crush", 0.16, inputs, candidateMap),
    buildScenario("liquidity_gap", "Spread widening and quote fade", -0.08, inputs, candidateMap),
    buildScenario("trend_reversal", "Trend reversal against current sleeve mix", -0.12, inputs, candidateMap)
  ];
}

function buildScenario(
  scenarioId: string,
  title: string,
  baseShock: number,
  inputs: {
    totalCapitalCents: number;
    openPositions: Array<{
      marketSlug: string;
      side: "yes" | "no";
      quantity: number;
      entryPriceCents: number;
      markPriceCents?: number;
      barrierMultiplier?: number;
    }>;
  },
  candidateMap: Map<string, CandidateModelSummary>
): StressScenarioResult {
  const impacts = inputs.openPositions.map((position) => {
    const candidate = candidateMap.get(position.marketSlug);
    const markPriceCents = position.markPriceCents ?? position.entryPriceCents;
    const convexityPenalty =
      position.barrierMultiplier === undefined ? 1 : 1 + Math.min(0.5, Math.abs(position.barrierMultiplier - 1));
    const sleevePenalty = candidate ? 1 + Math.max(0, 0.2 - candidate.netEdgeToEntry) : 1.1;
    const directionalShock = position.side === "yes" ? baseShock : -baseShock * 0.7;
    const impactCents = Math.round(markPriceCents * position.quantity * directionalShock * convexityPenalty * sleevePenalty);
    return {
      marketSlug: position.marketSlug,
      side: position.side,
      impactCents
    };
  });
  const estimatedPnlCents = impacts.reduce((sum, position) => sum + position.impactCents, 0);
  return {
    scenarioId,
    title,
    shockDescription: title,
    estimatedPnlCents,
    returnImpact: inputs.totalCapitalCents === 0 ? 0 : estimatedPnlCents / inputs.totalCapitalCents,
    worstMarkets: impacts.sort((left, right) => left.impactCents - right.impactCents).slice(0, 5)
  };
}
