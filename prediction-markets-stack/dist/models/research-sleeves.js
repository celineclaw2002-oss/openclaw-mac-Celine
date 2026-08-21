const sleeveRegistry = [
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
            const prefersTrend = regime.trendBucket === "up" ? "yes" : regime.trendBucket === "down" ? "no" : undefined;
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
export function buildResearchModelDiagnostics(inputs) {
    const candidateSummaries = inputs.candidates.map((candidate) => buildCandidateModelSummary(candidate, inputs.regime));
    const sorted = [...candidateSummaries].sort((left, right) => right.ensembleScore - left.ensembleScore);
    const topCount = Math.max(1, inputs.topCount ?? 12);
    const sleeves = sleeveRegistry.map((sleeve) => {
        const sleeveRows = candidateSummaries.map((candidate) => candidate.sleeveBreakdown.find((row) => row.sleeveId === sleeve.sleeveId));
        const populated = sleeveRows.filter((row) => row !== undefined);
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
export function buildCandidateModelSummary(candidate, regime) {
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
function clamp01(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.min(1, value));
}
function mean(values) {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
