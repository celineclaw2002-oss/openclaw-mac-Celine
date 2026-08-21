import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CandidateModelSummary } from "../models/research-sleeves.js";
import { allocateCapitalAcrossSleeves } from "../portfolio/capital-allocation.js";
import { runStressTests } from "../portfolio/stress-testing.js";
import { runPolymarketBtcResearchBackfill } from "./polymarket-btc-research-backfill.js";
import { writeRunManifest } from "../shared/run-manifest.js";

interface ReplaySnapshot {
  timestampIso: string;
  spotPrice: number;
  annualizedVol: number;
  researchSnapshot: {
    candidateBook: {
      allowedEntries: number;
      averageNetEdgeToEntry?: number;
    };
    modelDiagnostics: {
      sleeves: Array<{
        sleeveId: string;
        title: string;
        weight: number;
        candidates: number;
        allowedEntries: number;
        averageScore: number;
        averageContribution: number;
        averageNetEdgeToEntry: number;
      }>;
      topCandidates: CandidateModelSummary[];
      averageEnsembleScore: number;
    };
  };
  topCandidates: CandidateModelSummary[];
}

interface ReplayPosition {
  positionId: string;
  marketSlug: string;
  eventSlug: string;
  side: "yes" | "no";
  sleeveId: string;
  quantity: number;
  entryPriceCents: number;
  entryTimeIso: string;
  barrierMultiplier: number;
  markPriceCents?: number;
}

interface ReplayLoopSummary {
  timestampIso: string;
  cashCents: number;
  netLiquidationCents: number;
  openPositions: number;
  entriesPlaced: number;
  exitsPlaced: number;
  averageEnsembleScore: number;
  sleeveAllocations: ReturnType<typeof allocateCapitalAcrossSleeves>;
}

export interface PolymarketBtcPortfolioReplayOptions {
  backfillRoot?: string;
  outputRoot?: string;
  startingCapitalCents?: number;
  maxOpenPositions?: number;
  maxPositionsPerEvent?: number;
}

export interface PolymarketBtcPortfolioReplaySummary {
  outputRoot: string;
  sourceBackfillRoot: string;
  replayedSnapshots: number;
  cashCents: number;
  netLiquidationCents: number;
  realizedPnlCents: number;
  openPositions: number;
  closedPositions: number;
  maxDrawdown: number;
  stressPath: string;
}

export async function runPolymarketBtcPortfolioReplay(
  options: PolymarketBtcPortfolioReplayOptions = {}
): Promise<PolymarketBtcPortfolioReplaySummary> {
  const sourceBackfillRoot = options.backfillRoot ?? (await ensureReplayableBackfill());
  const outputRoot =
    options.outputRoot ??
    path.resolve(process.cwd(), "data", "backtests", "polymarket-btc-research-backfill", "portfolio-replay");
  await mkdir(path.join(outputRoot, "loops"), { recursive: true });
  const snapshots = await loadReplaySnapshots(sourceBackfillRoot);
  const startingCapitalCents = options.startingCapitalCents ?? 100_000;
  const maxOpenPositions = options.maxOpenPositions ?? 8;
  const maxPositionsPerEvent = options.maxPositionsPerEvent ?? 2;

  let cashCents = startingCapitalCents;
  let realizedPnlCents = 0;
  let closedPositions = 0;
  let positionCounter = 0;
  let openPositions: ReplayPosition[] = [];
  const equityCurve: number[] = [];
  const loopSummaries: ReplayLoopSummary[] = [];

  for (const snapshot of snapshots) {
    const candidateMap = new Map(snapshot.topCandidates.map((candidate) => [`${candidate.marketSlug}:${candidate.side}`, candidate]));
    const remainingOpen: ReplayPosition[] = [];
    let exitsPlaced = 0;

    for (const position of openPositions) {
      const current = candidateMap.get(`${position.marketSlug}:${position.side}`);
      const markPriceCents = current?.markPriceCents ?? current?.entryPriceCents ?? position.markPriceCents ?? position.entryPriceCents;
      position.markPriceCents = markPriceCents;
      const shouldExit =
        !current || !current.allowEntry || current.ensembleScore < 0.42 || current.netEdgeToEntry < 0.01 || current.horizonDays <= 10;
      if (shouldExit) {
        cashCents += markPriceCents * position.quantity;
        realizedPnlCents += (markPriceCents - position.entryPriceCents) * position.quantity;
        closedPositions += 1;
        exitsPlaced += 1;
        continue;
      }
      remainingOpen.push(position);
    }
    openPositions = remainingOpen;

    const exposureBySleeve = new Map<string, number>();
    for (const position of openPositions) {
      const exposure = (position.markPriceCents ?? position.entryPriceCents) * position.quantity;
      exposureBySleeve.set(position.sleeveId, (exposureBySleeve.get(position.sleeveId) ?? 0) + exposure);
    }
    const markedValue = openPositions.reduce((sum, position) => sum + (position.markPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const netLiquidationCents = cashCents + markedValue;
    const allocations = allocateCapitalAcrossSleeves({
      totalCapitalCents: netLiquidationCents,
      sleeves: snapshot.researchSnapshot.modelDiagnostics.sleeves.map((sleeve) => ({
        ...sleeve,
        currentExposureCents: exposureBySleeve.get(sleeve.sleeveId) ?? 0
      })),
      topCandidates: snapshot.topCandidates
    });

    const eventCounts = new Map<string, number>();
    for (const position of openPositions) {
      eventCounts.set(position.eventSlug, (eventCounts.get(position.eventSlug) ?? 0) + 1);
    }
    let entriesPlaced = 0;
    for (const candidate of snapshot.topCandidates) {
      if (!candidate.allowEntry || openPositions.length >= maxOpenPositions) {
        continue;
      }
      if (openPositions.some((position) => position.marketSlug === candidate.marketSlug && position.side === candidate.side)) {
        continue;
      }
      const primarySleeve = candidate.sleeveBreakdown[0]?.sleeveId ?? "anchor_residual";
      const sleeveBudget = allocations.sleeves.find((sleeve) => sleeve.sleeveId === primarySleeve)?.targetCapitalCents ?? 0;
      const sleeveExposure = exposureBySleeve.get(primarySleeve) ?? 0;
      const perTradeBudget = Math.min(15_000, Math.max(2_500, Math.round(sleeveBudget * 0.35)));
      const remainingBudget = Math.max(0, perTradeBudget - sleeveExposure);
      const eventCount = eventCounts.get(candidate.eventSlug) ?? 0;
      if (remainingBudget < candidate.entryPriceCents || eventCount >= maxPositionsPerEvent) {
        continue;
      }
      const quantity = Math.floor(Math.min(remainingBudget, cashCents) / candidate.entryPriceCents);
      if (quantity <= 0) {
        continue;
      }
      cashCents -= quantity * candidate.entryPriceCents;
      openPositions.push({
        positionId: `replay-${++positionCounter}`,
        marketSlug: candidate.marketSlug,
        eventSlug: candidate.eventSlug,
        side: candidate.side,
        sleeveId: primarySleeve,
        quantity,
        entryPriceCents: candidate.entryPriceCents,
        entryTimeIso: snapshot.timestampIso,
        barrierMultiplier: candidate.barrierMultiplier,
        ...(candidate.markPriceCents === undefined ? {} : { markPriceCents: candidate.markPriceCents })
      });
      eventCounts.set(candidate.eventSlug, eventCount + 1);
      exposureBySleeve.set(primarySleeve, sleeveExposure + quantity * candidate.entryPriceCents);
      entriesPlaced += 1;
    }

    const refreshedMarkedValue = openPositions.reduce(
      (sum, position) => sum + (position.markPriceCents ?? position.entryPriceCents) * position.quantity,
      0
    );
    const refreshedNetLiq = cashCents + refreshedMarkedValue;
    equityCurve.push(refreshedNetLiq);
    const loopSummary: ReplayLoopSummary = {
      timestampIso: snapshot.timestampIso,
      cashCents,
      netLiquidationCents: refreshedNetLiq,
      openPositions: openPositions.length,
      entriesPlaced,
      exitsPlaced,
      averageEnsembleScore: snapshot.researchSnapshot.modelDiagnostics.averageEnsembleScore,
      sleeveAllocations: allocations
    };
    loopSummaries.push(loopSummary);
    await writeFile(
      path.join(outputRoot, "loops", `${snapshot.timestampIso.replaceAll(":", "").replaceAll(".", "")}.json`),
      `${JSON.stringify(loopSummary, null, 2)}\n`,
      "utf8"
    );
  }

  const finalNetLiq = equityCurve.at(-1) ?? startingCapitalCents;
  const stress = runStressTests({
    totalCapitalCents: finalNetLiq,
    openPositions,
    latestCandidates: snapshots.at(-1)?.topCandidates ?? []
  });
  const stressRoot = path.resolve(process.cwd(), "data", "stress-tests");
  await mkdir(stressRoot, { recursive: true });
  const stressPath = path.join(stressRoot, "polymarket-btc-portfolio-replay-latest.json");
  await writeFile(stressPath, `${JSON.stringify(stress, null, 2)}\n`, "utf8");

  const summary: PolymarketBtcPortfolioReplaySummary = {
    outputRoot,
    sourceBackfillRoot,
    replayedSnapshots: snapshots.length,
    cashCents,
    netLiquidationCents: finalNetLiq,
    realizedPnlCents,
    openPositions: openPositions.length,
    closedPositions,
    maxDrawdown: computeMaxDrawdown(equityCurve),
    stressPath
  };
  await writeFile(path.join(outputRoot, "replay-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputRoot, "latest-stress.json"), `${JSON.stringify(stress, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputRoot, "allocation-history.json"), `${JSON.stringify(loopSummaries, null, 2)}\n`, "utf8");
  await writeRunManifest({
    pipelineId: "polymarket-btc-portfolio-replay",
    outputRoot,
    sourceArtifacts: [path.join(outputRoot, "replay-summary.json"), stressPath],
    summary: {
      replayedSnapshots: summary.replayedSnapshots,
      netLiquidationCents: summary.netLiquidationCents,
      maxDrawdown: summary.maxDrawdown
    }
  });
  return summary;
}

async function ensureReplayableBackfill(): Promise<string> {
  const existing = await resolveLatestBackfillRoot();
  if (existing) {
    const snapshots = await loadReplaySnapshots(existing);
    if (snapshots.length > 0 && snapshots.every((snapshot) => Array.isArray(snapshot.topCandidates))) {
      return existing;
    }
  }
  const replayable = await runPolymarketBtcResearchBackfill();
  return replayable.outputRoot;
}

async function resolveLatestBackfillRoot(): Promise<string | undefined> {
  const root = path.resolve(process.cwd(), "data", "backtests", "polymarket-btc-research-backfill");
  try {
    const runs = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name !== "portfolio-replay")
      .map((entry) => entry.name)
      .sort();
    const latest = runs.at(-1);
    return latest ? path.join(root, latest) : undefined;
  } catch {
    return undefined;
  }
}

async function loadReplaySnapshots(backfillRoot: string): Promise<ReplaySnapshot[]> {
  const snapshotsRoot = path.join(backfillRoot, "snapshots");
  const entries = (await readdir(snapshotsRoot)).filter((entry) => entry.endsWith(".json")).sort();
  const snapshots = await Promise.all(
    entries.map(async (entry) => JSON.parse(await readFile(path.join(snapshotsRoot, entry), "utf8")) as ReplaySnapshot)
  );
  return snapshots.filter((snapshot) => Array.isArray(snapshot.topCandidates));
}

function computeMaxDrawdown(values: number[]): number {
  let peak = Number.NEGATIVE_INFINITY;
  let maxDrawdown = 0;
  for (const value of values) {
    peak = Math.max(peak, value);
    if (peak <= 0) {
      continue;
    }
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  }
  return maxDrawdown;
}
