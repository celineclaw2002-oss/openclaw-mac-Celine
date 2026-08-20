import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { CoinbaseHttpClient } from "../runtime/coinbase-api.js";
import type { PolymarketBtcMilestoneRow } from "./polymarket-btc-milestone-scan.js";
import { runPolymarketBtcMilestoneScan } from "./polymarket-btc-milestone-scan.js";

type PaperSide = "yes" | "no";

type BarrierDirection = "up" | "down";

interface BarrierSpec {
  price: number;
  direction: BarrierDirection;
}

interface PaperPosition {
  positionId: string;
  eventSlug: string;
  marketSlug: string;
  questionText: string;
  side: PaperSide;
  quantity: number;
  entryPriceCents: number;
  entryTimeMs: number;
  entrySignal: number;
  entryAnchorProbability: number;
  barrierPrice?: number;
  barrierDirection?: BarrierDirection;
  marketEndDate?: string;
  lastMarkPriceCents?: number;
  lastMarkTimeMs?: number;
}

interface ClosedPaperPosition extends PaperPosition {
  exitPriceCents: number;
  exitTimeMs: number;
  exitReason: string;
  realizedPnlCents: number;
}

interface PortfolioState {
  strategyId: string;
  createdAtIso: string;
  updatedAtIso: string;
  loopCount: number;
  cashCents: number;
  realizedPnlCents: number;
  openPositions: PaperPosition[];
  closedPositions: ClosedPaperPosition[];
  lastOutputRoot?: string;
}

interface EntryAction {
  type: "entry";
  marketSlug: string;
  side: PaperSide;
  quantity: number;
  priceCents: number;
  signal: number;
  anchorProbability: number;
  reason: string;
}

interface ExitAction {
  type: "exit";
  marketSlug: string;
  side: PaperSide;
  quantity: number;
  entryPriceCents: number;
  exitPriceCents: number;
  realizedPnlCents: number;
  reason: string;
}

interface HoldAction {
  type: "hold";
  marketSlug: string;
  side: PaperSide;
  quantity: number;
  signal?: number;
  markPriceCents?: number;
  reason: string;
}

interface PerformanceSnapshot {
  initialCapitalCents: number;
  loopCount: number;
  closedTrades: number;
  openTrades: number;
  grossTradedNotionalCents: number;
  turnoverRatio: number;
  currentGrossExposureCents: number;
  currentNetExposureCents: number;
  currentGrossExposureRate: number;
  currentNetExposureRate: number;
  cumulativeReturn: number;
  realizedReturn: number;
  unrealizedReturn: number;
  maxDrawdown: number;
  winRate?: number;
  averageWinCents?: number;
  averageLossCents?: number;
  profitFactor?: number;
  averageHoldingMinutes?: number;
  loopSharpeRatio?: number;
  loopSortinoRatio?: number;
}

interface BacktestModelMetrics {
  brierScore: number;
  logLoss: number;
}

interface BacktestSegmentMetrics {
  groupType: "overall" | "horizon_days" | "barrier_multiplier";
  groupId: string;
  rawBarrier: BacktestModelMetrics;
  terminalBaseline: BacktestModelMetrics;
}

interface BacktestSummarySnapshot {
  outputRoot: string;
  segmented: BacktestSegmentMetrics[];
}

interface SegmentImprovement {
  brierImprovement: number;
  logLossImprovement: number;
}

interface CandidatePolicy {
  mode: "fallback" | "segment_aware";
  allowEntry: boolean;
  qualityBucket: "fallback" | "strong" | "medium" | "cautious" | "blocked";
  entryEdgeThreshold: number;
  exitEdgeThreshold: number;
  rationale: string;
  barrierMultiplier: number;
  horizonDays: number;
  barrierBucket?: number;
  horizonBucketDays?: number;
  barrierImprovement?: SegmentImprovement;
  horizonImprovement?: SegmentImprovement;
  qualityScore?: number;
  sourceSummaryPath?: string;
}

interface ResearchSnapshot {
  regime: {
    spotPrice: number;
    annualizedVol: number;
    quoteReadyMarkets: number;
    upsideQuoteReadyMarkets: number;
    downsideQuoteReadyMarkets: number;
    averageSpread: number;
    realizedVol20d?: number;
    momentum20d?: number;
    momentum60d?: number;
    volBucket?: "low" | "medium" | "high";
    trendBucket?: "down" | "flat" | "up";
  };
  candidateBook: {
    allowedEntries: number;
    blockedEntries: number;
    strongSignals: number;
    mediumSignals: number;
    cautiousSignals: number;
    blockedSignals: number;
    averageAllowedSignal: number;
    averageAllowedBarrierMultiplier: number;
    averageAllowedHorizonDays: number;
    averageGrossEdgeToMid?: number;
    averageNetEdgeToEntry?: number;
    averageSpreadCost?: number;
  };
  concentration: {
    openEventGroups: number;
    largestEventExposureCents: number;
    largestEventExposureRate: number;
    largestDirectionExposureCents: number;
    largestDirectionExposureRate: number;
    weightedAverageBarrierMultiplier?: number;
    weightedAverageHorizonDays?: number;
  };
  costDiagnostics: {
    expectedEntryCostCents: number;
    realizedSpreadCaptureCents: number;
  };
  attribution: {
    byDirection: AttributionBucket[];
    byBarrierBucket: AttributionBucket[];
    byHorizonBucket: AttributionBucket[];
    byEvent: AttributionBucket[];
  };
}

interface AttributionBucket {
  bucketId: string;
  openPositions: number;
  grossExposureCents: number;
  realizedPnlCents: number;
  unrealizedPnlCents: number;
  totalPnlCents: number;
}

export interface PolymarketBtcPaperLoopOptions {
  outputRoot?: string;
  portfolioRoot?: string;
  startingCashCents?: number;
  maxOpenPositions?: number;
  maxPositionNotionalCents?: number;
  maxEventExposureCents?: number;
  maxPositionsPerEventDirection?: number;
  minBarrierGapRatio?: number;
  entryEdgeThreshold?: number;
  exitEdgeThreshold?: number;
  annualizedVol?: number;
  backtestSummaryPath?: string;
}

export interface PolymarketBtcPaperLoopSummary {
  outputRoot: string;
  portfolioRoot: string;
  loopTimeIso: string;
  scanAction: "executed" | "reused";
  reservePathVerdict: string;
  policyMode: "fallback" | "segment_aware";
  entryEdgeThreshold: number;
  exitEdgeThreshold: number;
  spotPrice: number;
  annualizedVol: number;
  consideredMarkets: number;
  quoteReadyMarkets: number;
  eligibleEntries: number;
  entriesPlaced: number;
  exitsPlaced: number;
  holdsReviewed: number;
  openPositions: number;
  closedPositions: number;
  cashCents: number;
  realizedPnlCents: number;
  unrealizedPnlCents: number;
  netLiquidationCents: number;
  entryNotionalCents: number;
  exitNotionalCents: number;
  grossTradedNotionalCents: number;
  grossExposureCents: number;
  netExposureCents: number;
  grossExposureRate: number;
  netExposureRate: number;
  bestMarket?: string;
  topSignals: TopSignalDiagnostic[];
  researchSnapshot: ResearchSnapshot;
  performance: PerformanceSnapshot;
  actions: Array<EntryAction | ExitAction | HoldAction>;
  skippedReason?: string;
  policySourceSummaryPath?: string;
}

interface Candidate {
  market: PolymarketBtcMilestoneRow;
  side: PaperSide;
  signal: number;
  anchorProbability: number;
  modelProbabilityForSide: number;
  entryPriceCents: number;
  markPriceCents?: number;
  spreadCostProbability: number;
  grossEdgeToMid: number;
  netEdgeToEntry: number;
  policy: CandidatePolicy;
  barrier: BarrierSpec;
  marketMid: number;
}

type TopSignalDiagnostic = {
  marketSlug: string;
  side: PaperSide;
  signal: number;
  anchorProbability: number;
  marketMid: number;
  barrierMultiplier: number;
  horizonDays: number;
  qualityBucket: CandidatePolicy["qualityBucket"];
  entryEdgeThreshold: number;
  allowEntry: boolean;
  policyRationale: string;
};

export async function runPolymarketBtcPaperLoop(
  options: PolymarketBtcPaperLoopOptions = {}
): Promise<PolymarketBtcPaperLoopSummary> {
  const portfolioRoot = path.resolve(
    process.cwd(),
    options.portfolioRoot ?? path.join("data", "paper-trading", "polymarket-btc-milestone")
  );
  await mkdir(portfolioRoot, { recursive: true });

  const startingCashCents = options.startingCashCents ?? 100_000;
  const maxOpenPositions = options.maxOpenPositions ?? 4;
  const maxPositionNotionalCents = options.maxPositionNotionalCents ?? 12_500;
  const maxEventExposureCents = options.maxEventExposureCents ?? 25_000;
  const maxPositionsPerEventDirection = options.maxPositionsPerEventDirection ?? 2;
  const minBarrierGapRatio = options.minBarrierGapRatio ?? 0.08;
  const entryEdgeThreshold = options.entryEdgeThreshold ?? 0.04;
  const exitEdgeThreshold = options.exitEdgeThreshold ?? 0.015;
  const annualizedVol = options.annualizedVol ?? 0.6;
  const backtestPolicy = await loadBacktestPolicy({
    cwd: process.cwd(),
    fallbackEntryEdgeThreshold: entryEdgeThreshold,
    fallbackExitEdgeThreshold: exitEdgeThreshold,
    ...(options.backtestSummaryPath ? { explicitSummaryPath: options.backtestSummaryPath } : {})
  });

  const scan = options.outputRoot
    ? await readScanSummary(path.join(options.outputRoot, "summaries", "btc-milestone-scan.json"))
    : await runPolymarketBtcMilestoneScan();
  const outputRoot = scan.outputRoot;
  const scanAction = options.outputRoot ? ("reused" as const) : ("executed" as const);

  const baseSummary = {
    outputRoot,
    portfolioRoot,
    loopTimeIso: new Date().toISOString(),
    scanAction,
    reservePathVerdict: scan.reservePathVerdict,
    policyMode: backtestPolicy.mode,
    entryEdgeThreshold,
    exitEdgeThreshold,
    ...(backtestPolicy.sourceSummaryPath ? { policySourceSummaryPath: backtestPolicy.sourceSummaryPath } : {})
  };

  const quoteReadyMarkets = scan.markets.filter(
    (market) => market.active && !market.closed && market.bestBid !== undefined && market.bestAsk !== undefined
  );

  const portfolio = await loadPortfolioState(portfolioRoot, startingCashCents);
  portfolio.loopCount += 1;
  portfolio.updatedAtIso = new Date().toISOString();
  portfolio.lastOutputRoot = outputRoot;

  const coinbase = new CoinbaseHttpClient();
  const spot = await coinbase.getTicker("BTC-USD");
  const regimeTags = await buildRegimeTags(coinbase);
  const nowMs = Date.now();
  const signalDiagnostics = quoteReadyMarkets
    .map((market) => {
      const barrier = extractBarrierSpec(market.question);
      const anchorProbability = computeBarrierHitProbability(spot.price, barrier, market.endDate, annualizedVol, nowMs);
      if (anchorProbability === undefined) {
        return null;
      }
      const signal = computeSignal(anchorProbability, market);
      const policy = deriveCandidatePolicy({
        backtestPolicy,
        spotPrice: spot.price,
        barrier: barrier?.price,
        marketEndDate: market.endDate
      });
      return {
        marketSlug: market.marketSlug,
        side: signal >= 0 ? ("yes" as const) : ("no" as const),
        signal,
        anchorProbability,
        marketMid: deriveYesMid(market),
        barrierMultiplier: policy.barrierMultiplier,
        horizonDays: policy.horizonDays,
        qualityBucket: policy.qualityBucket,
        entryEdgeThreshold: policy.entryEdgeThreshold,
        allowEntry: policy.allowEntry,
        policyRationale: policy.rationale
      };
    })
    .filter((row): row is TopSignalDiagnostic => row !== null)
    .sort((left, right) => Math.abs(right.signal) - Math.abs(left.signal))
    .slice(0, 5);
  const allCandidates = quoteReadyMarkets
    .map((market) => buildCandidate(market, spot.price, annualizedVol, nowMs, backtestPolicy))
    .filter((candidate): candidate is Candidate => candidate !== null);

  if (quoteReadyMarkets.length === 0) {
    const markedOpenValue = portfolio.openPositions.reduce(
      (sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
      0
    );
    const netExposureCents = portfolio.openPositions.reduce(
      (sum, position) =>
        sum +
        (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
      0
    );
    const netLiquidationCents = portfolio.cashCents + markedOpenValue;
    const performance = await buildPerformanceSnapshot({
      portfolioRoot,
      currentSummary: {
        loopTimeIso: baseSummary.loopTimeIso,
        netLiquidationCents,
        grossTradedNotionalCents: 0
      },
      portfolio,
      initialCapitalCents: startingCashCents
    });

    const summary: PolymarketBtcPaperLoopSummary = {
      ...baseSummary,
      spotPrice: spot.price,
      annualizedVol,
      consideredMarkets: scan.markets.length,
      quoteReadyMarkets: 0,
      eligibleEntries: 0,
      entriesPlaced: 0,
      exitsPlaced: 0,
      holdsReviewed: 0,
      openPositions: portfolio.openPositions.length,
      closedPositions: portfolio.closedPositions.length,
      cashCents: portfolio.cashCents,
      realizedPnlCents: portfolio.realizedPnlCents,
      unrealizedPnlCents: portfolio.openPositions.reduce((sum, position) => {
        const markPrice = position.lastMarkPriceCents ?? position.entryPriceCents;
        return sum + (markPrice - position.entryPriceCents) * position.quantity;
      }, 0),
      netLiquidationCents,
      entryNotionalCents: 0,
      exitNotionalCents: 0,
      grossTradedNotionalCents: 0,
      grossExposureCents: markedOpenValue,
      netExposureCents,
      grossExposureRate: ratio(markedOpenValue, netLiquidationCents),
      netExposureRate: ratio(netExposureCents, netLiquidationCents),
      ...(scan.bestMarket ? { bestMarket: scan.bestMarket.marketSlug } : {}),
      topSignals: signalDiagnostics,
      researchSnapshot: buildResearchSnapshot({
        spotPrice: spot.price,
        annualizedVol,
        quoteReadyMarkets,
        candidates: allCandidates,
        openPositions: portfolio.openPositions,
        closedPositions: portfolio.closedPositions,
        netLiquidationCents,
        regimeTags
      }),
      performance,
      actions: [],
      skippedReason: "No quote-ready Polymarket BTC milestone markets were found in the current scan."
    };
    await writeArtifacts(portfolioRoot, summary, portfolio);
    return summary;
  }

  const quoteReadyBySlug = new Map(quoteReadyMarkets.map((market) => [market.marketSlug, market]));
  const actions: Array<EntryAction | ExitAction | HoldAction> = [];
  const remainingOpen: PaperPosition[] = [];

  for (const position of portfolio.openPositions) {
    const market = quoteReadyBySlug.get(position.marketSlug);
    const markPrice = market ? resolveMarkPrice(position.side, market) : position.lastMarkPriceCents;
    const executableExitPrice = market ? resolveExecutableExitPrice(position.side, market) : undefined;
    const anchorProbability = market
      ? computeBarrierHitProbability(spot.price, extractBarrierSpec(market.question), market.endDate, annualizedVol, nowMs)
      : undefined;
    const signal = market && anchorProbability !== undefined ? computeSignal(anchorProbability, market) : undefined;
    const positionPolicy =
      market && anchorProbability !== undefined
        ? deriveCandidatePolicy({
            backtestPolicy,
            spotPrice: spot.price,
            barrier: extractBarrierSpec(market.question)?.price,
            marketEndDate: market.endDate
          })
        : undefined;
    const exitReason = classifyExitReason(
      signal,
      positionPolicy?.exitEdgeThreshold ?? exitEdgeThreshold,
      market,
      executableExitPrice,
      positionPolicy
    );

    if (markPrice !== undefined) {
      position.lastMarkPriceCents = markPrice;
      position.lastMarkTimeMs = nowMs;
    }

    if (exitReason && executableExitPrice !== undefined) {
      const realizedPnlCents = (executableExitPrice - position.entryPriceCents) * position.quantity;
      portfolio.cashCents += executableExitPrice * position.quantity;
      portfolio.realizedPnlCents += realizedPnlCents;
      portfolio.closedPositions.push({
        ...position,
        exitPriceCents: executableExitPrice,
        exitTimeMs: nowMs,
        exitReason,
        realizedPnlCents
      });
      actions.push({
        type: "exit",
        marketSlug: position.marketSlug,
        side: position.side,
        quantity: position.quantity,
        entryPriceCents: position.entryPriceCents,
        exitPriceCents: executableExitPrice,
        realizedPnlCents,
        reason: exitReason
      });
      continue;
    }

    remainingOpen.push(position);
    actions.push({
      type: "hold",
      marketSlug: position.marketSlug,
      side: position.side,
      quantity: position.quantity,
      ...(signal === undefined ? {} : { signal }),
      ...(markPrice === undefined ? {} : { markPriceCents: markPrice }),
      reason: exitReason ? `${exitReason}_blocked_by_missing_exit_quote` : "position_still_valid"
    });
  }
  portfolio.openPositions = remainingOpen;

  const candidates = allCandidates
    .filter((candidate) => candidate.policy.allowEntry)
    .filter((candidate) => Math.abs(candidate.signal) >= candidate.policy.entryEdgeThreshold)
    .filter((candidate) => !portfolio.openPositions.some((position) => position.marketSlug === candidate.market.marketSlug))
    .sort((left, right) => Math.abs(right.signal) - Math.abs(left.signal));

  for (const candidate of candidates) {
    if (portfolio.openPositions.length >= maxOpenPositions) {
      break;
    }
    const baseQuantity = Math.max(1, Math.floor(maxPositionNotionalCents / Math.max(candidate.entryPriceCents, 1)));
    const quantity = computeOverlapAdjustedQuantity({
      candidate,
      openPositions: portfolio.openPositions,
      baseQuantity,
      entryPriceCents: candidate.entryPriceCents,
      maxEventExposureCents,
      maxPositionsPerEventDirection,
      minBarrierGapRatio
    });
    if (quantity < 1) {
      continue;
    }
    const costCents = quantity * candidate.entryPriceCents;
    if (costCents > portfolio.cashCents) {
      continue;
    }
    if (
      !passesCorrelationControls({
        candidate,
        openPositions: portfolio.openPositions,
        candidateCostCents: costCents,
        maxEventExposureCents,
        maxPositionsPerEventDirection,
        minBarrierGapRatio
      })
    ) {
      continue;
    }
    portfolio.cashCents -= costCents;
    portfolio.openPositions.push({
      positionId: `paper::${candidate.market.marketSlug}::${candidate.side}::${nowMs}`,
      eventSlug: candidate.market.eventSlug,
      marketSlug: candidate.market.marketSlug,
      questionText: candidate.market.question,
      side: candidate.side,
      quantity,
      entryPriceCents: candidate.entryPriceCents,
      entryTimeMs: nowMs,
      entrySignal: candidate.signal,
      entryAnchorProbability: candidate.anchorProbability,
      barrierPrice: candidate.barrier.price,
      barrierDirection: candidate.barrier.direction,
      ...(candidate.market.endDate ? { marketEndDate: candidate.market.endDate } : {}),
      ...(candidate.markPriceCents === undefined ? {} : { lastMarkPriceCents: candidate.markPriceCents }),
      ...(candidate.markPriceCents === undefined ? {} : { lastMarkTimeMs: nowMs })
    });
    actions.push({
      type: "entry",
      marketSlug: candidate.market.marketSlug,
      side: candidate.side,
      quantity,
      priceCents: candidate.entryPriceCents,
      signal: candidate.signal,
      anchorProbability: candidate.anchorProbability,
      reason: `${candidate.policy.rationale}::edge_above_${candidate.policy.entryEdgeThreshold.toFixed(3)}`
    });
  }

  const unrealizedPnlCents = portfolio.openPositions.reduce((sum, position) => {
    const markPrice = position.lastMarkPriceCents;
    return markPrice === undefined ? sum : sum + (markPrice - position.entryPriceCents) * position.quantity;
  }, 0);
  const grossExposureCents = portfolio.openPositions.reduce(
    (sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
    0
  );
  const netExposureCents = portfolio.openPositions.reduce(
    (sum, position) =>
      sum +
      (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
    0
  );
  const netLiquidationCents = portfolio.cashCents + grossExposureCents;
  const entryNotionalCents = actions
    .filter((action): action is EntryAction => action.type === "entry")
    .reduce((sum, action) => sum + action.priceCents * action.quantity, 0);
  const exitNotionalCents = actions
    .filter((action): action is ExitAction => action.type === "exit")
    .reduce((sum, action) => sum + action.exitPriceCents * action.quantity, 0);
  const grossTradedNotionalCents = entryNotionalCents + exitNotionalCents;
  const performance = await buildPerformanceSnapshot({
    portfolioRoot,
    currentSummary: {
      loopTimeIso: baseSummary.loopTimeIso,
      netLiquidationCents,
      grossTradedNotionalCents
    },
    portfolio,
    initialCapitalCents: startingCashCents
  });

  const summary: PolymarketBtcPaperLoopSummary = {
    ...baseSummary,
    spotPrice: spot.price,
    annualizedVol,
    consideredMarkets: scan.markets.length,
    quoteReadyMarkets: quoteReadyMarkets.length,
    eligibleEntries: candidates.length,
    entriesPlaced: actions.filter((action) => action.type === "entry").length,
    exitsPlaced: actions.filter((action) => action.type === "exit").length,
    holdsReviewed: actions.filter((action) => action.type === "hold").length,
    openPositions: portfolio.openPositions.length,
    closedPositions: portfolio.closedPositions.length,
    cashCents: portfolio.cashCents,
    realizedPnlCents: portfolio.realizedPnlCents,
    unrealizedPnlCents,
    netLiquidationCents,
    entryNotionalCents,
    exitNotionalCents,
    grossTradedNotionalCents,
    grossExposureCents,
    netExposureCents,
    grossExposureRate: ratio(grossExposureCents, netLiquidationCents),
    netExposureRate: ratio(netExposureCents, netLiquidationCents),
    ...(scan.bestMarket ? { bestMarket: scan.bestMarket.marketSlug } : {}),
    topSignals: signalDiagnostics,
    researchSnapshot: buildResearchSnapshot({
      spotPrice: spot.price,
      annualizedVol,
      quoteReadyMarkets,
      candidates: allCandidates,
      openPositions: portfolio.openPositions,
      closedPositions: portfolio.closedPositions,
      netLiquidationCents,
      regimeTags
    }),
    performance,
    actions,
    ...(candidates.length > 0 || quoteReadyMarkets.length === 0
      ? {}
      : {
          skippedReason: signalDiagnostics.some((row) => !row.allowEntry)
            ? "Quote-ready BTC milestone markets were found, but the current segment-aware research gate blocked them."
            : "Quote-ready BTC milestone markets were found, but none cleared the current entry thresholds."
        })
  };

  await writeArtifacts(portfolioRoot, summary, portfolio);
  return summary;
}

async function readScanSummary(target: string): Promise<{
  outputRoot: string;
  reservePathVerdict: string;
  bestMarket?: PolymarketBtcMilestoneRow;
  markets: PolymarketBtcMilestoneRow[];
}> {
  return JSON.parse(await readFile(target, "utf8")) as {
    outputRoot: string;
    reservePathVerdict: string;
    bestMarket?: PolymarketBtcMilestoneRow;
    markets: PolymarketBtcMilestoneRow[];
  };
}

function buildCandidate(
  market: PolymarketBtcMilestoneRow,
  spotPrice: number,
  annualizedVol: number,
  nowMs: number,
  backtestPolicy: Awaited<ReturnType<typeof loadBacktestPolicy>>
): Candidate | null {
  const barrier = extractBarrierSpec(market.question);
  if (!barrier) {
    return null;
  }
  const anchorProbability = computeBarrierHitProbability(spotPrice, barrier, market.endDate, annualizedVol, nowMs);
  if (anchorProbability === undefined) {
    return null;
  }
  const signal = computeSignal(anchorProbability, market);
  const policy = deriveCandidatePolicy({
    backtestPolicy,
    spotPrice,
    barrier: barrier.price,
    marketEndDate: market.endDate
  });
  const side: PaperSide = signal >= 0 ? "yes" : "no";
  const marketMid = deriveYesMid(market);
  const modelProbabilityForSide = side === "yes" ? anchorProbability : 1 - anchorProbability;
  const marketProbabilityForSideMid = side === "yes" ? marketMid : 1 - marketMid;
  const entryPriceCents = resolveExecutableEntryPrice(side, market);
  if (entryPriceCents === undefined) {
    return null;
  }
  const markPriceCents = resolveMarkPrice(side, market);
  const entryProbabilityForSide = entryPriceCents / 100;
  return {
    market,
    side,
    signal,
    anchorProbability,
    modelProbabilityForSide,
    entryPriceCents,
    spreadCostProbability: Math.max(0, entryProbabilityForSide - marketProbabilityForSideMid),
    grossEdgeToMid: modelProbabilityForSide - marketProbabilityForSideMid,
    netEdgeToEntry: modelProbabilityForSide - entryProbabilityForSide,
    policy,
    barrier,
    marketMid,
    ...(markPriceCents === undefined ? {} : { markPriceCents })
  };
}

function extractBarrierSpec(question: string): BarrierSpec | undefined {
  const match = question.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)(?:k|K)?/);
  if (!match?.[1]) {
    return undefined;
  }
  const raw = match[1].replaceAll(",", "");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  const price = question.toLowerCase().includes("$150k") ? parsed * 1000 : parsed;
  const text = question.toLowerCase();
  if (text.includes("dip to")) {
    return { price, direction: "down" };
  }
  if (text.includes("reach") || text.includes("hit")) {
    return { price, direction: "up" };
  }
  return undefined;
}

function computeBarrierHitProbability(
  spotPrice: number,
  barrier: BarrierSpec | undefined,
  endDate: string | undefined,
  annualizedVol: number,
  nowMs: number
): number | undefined {
  if (barrier === undefined || !endDate) {
    return undefined;
  }
  if (barrier.direction === "up" && spotPrice >= barrier.price) {
    return 1;
  }
  if (barrier.direction === "down" && spotPrice <= barrier.price) {
    return 1;
  }
  const expiryMs = Date.parse(endDate);
  if (!Number.isFinite(expiryMs) || expiryMs <= nowMs || annualizedVol <= 0) {
    return undefined;
  }
  const timeYears = (expiryMs - nowMs) / (365.25 * 24 * 3_600_000);
  const sigmaSqrtT = annualizedVol * Math.sqrt(timeYears);
  if (sigmaSqrtT <= 0) {
    return undefined;
  }
  const logBarrier =
    barrier.direction === "up" ? Math.log(barrier.price / spotPrice) : Math.log(spotPrice / barrier.price);
  const z = logBarrier / sigmaSqrtT;
  return clamp01(2 * (1 - normalCdf(z)));
}

function computeSignal(anchorProbability: number, market: PolymarketBtcMilestoneRow): number {
  const marketMid = deriveYesMid(market);
  return anchorProbability - marketMid;
}

function deriveYesMid(market: PolymarketBtcMilestoneRow): number {
  if (market.bestBid !== undefined && market.bestAsk !== undefined) {
    return (market.bestBid + market.bestAsk) / 2;
  }
  return market.lastTradePrice ?? 0.5;
}

function resolveExecutableEntryPrice(side: PaperSide, market: PolymarketBtcMilestoneRow): number | undefined {
  if (side === "yes") {
    return market.bestAsk === undefined ? undefined : Math.round(market.bestAsk * 100);
  }
  return market.bestBid === undefined ? undefined : Math.round((1 - market.bestBid) * 100);
}

function resolveExecutableExitPrice(side: PaperSide, market: PolymarketBtcMilestoneRow): number | undefined {
  if (side === "yes") {
    return market.bestBid === undefined ? undefined : Math.round(market.bestBid * 100);
  }
  return market.bestAsk === undefined ? undefined : Math.round((1 - market.bestAsk) * 100);
}

function resolveMarkPrice(side: PaperSide, market: PolymarketBtcMilestoneRow): number | undefined {
  const mid = deriveYesMid(market);
  return Math.round((side === "yes" ? mid : 1 - mid) * 100);
}

function classifyExitReason(
  signal: number | undefined,
  exitEdgeThreshold: number,
  market: PolymarketBtcMilestoneRow | undefined,
  executableExitPrice: number | undefined,
  policy?: CandidatePolicy
): string | null {
  if (!market || !market.active || market.closed) {
    return "market_no_longer_tradeable";
  }
  if (policy && !policy.allowEntry) {
    return "historical_policy_no_longer_supports_position";
  }
  if (signal === undefined) {
    return "signal_missing";
  }
  if (Math.abs(signal) <= exitEdgeThreshold) {
    return "signal_mean_reverted";
  }
  if (executableExitPrice === undefined) {
    return "missing_exit_quote";
  }
  return null;
}

async function loadBacktestPolicy(inputs: {
  cwd: string;
  fallbackEntryEdgeThreshold: number;
  fallbackExitEdgeThreshold: number;
  explicitSummaryPath?: string;
}): Promise<{
  mode: "fallback" | "segment_aware";
  fallbackEntryEdgeThreshold: number;
  fallbackExitEdgeThreshold: number;
  summary?: BacktestSummarySnapshot;
  sourceSummaryPath?: string;
}> {
  const sourceSummaryPath = inputs.explicitSummaryPath ?? (await resolveLatestBacktestSummaryPath(inputs.cwd));
  if (!sourceSummaryPath) {
    return {
      mode: "fallback",
      fallbackEntryEdgeThreshold: inputs.fallbackEntryEdgeThreshold,
      fallbackExitEdgeThreshold: inputs.fallbackExitEdgeThreshold
    };
  }
  try {
    const summary = JSON.parse(await readFile(sourceSummaryPath, "utf8")) as BacktestSummarySnapshot;
    return {
      mode: "segment_aware",
      fallbackEntryEdgeThreshold: inputs.fallbackEntryEdgeThreshold,
      fallbackExitEdgeThreshold: inputs.fallbackExitEdgeThreshold,
      summary,
      sourceSummaryPath
    };
  } catch {
    return {
      mode: "fallback",
      fallbackEntryEdgeThreshold: inputs.fallbackEntryEdgeThreshold,
      fallbackExitEdgeThreshold: inputs.fallbackExitEdgeThreshold
    };
  }
}

async function resolveLatestBacktestSummaryPath(cwd: string): Promise<string | undefined> {
  const root = path.resolve(cwd, "data", "backtests", "polymarket-btc-barrier");
  try {
    const runs = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const latest = runs.at(-1);
    if (!latest) {
      return undefined;
    }
    return path.join(root, latest, "summaries", "barrier-backtest-summary.json");
  } catch {
    return undefined;
  }
}

function deriveCandidatePolicy(inputs: {
  backtestPolicy: Awaited<ReturnType<typeof loadBacktestPolicy>>;
  spotPrice: number;
  barrier: number | undefined;
  marketEndDate: string | undefined;
}): CandidatePolicy {
  const barrierMultiplier =
    inputs.barrier === undefined || inputs.spotPrice <= 0 ? Number.POSITIVE_INFINITY : inputs.barrier / inputs.spotPrice;
  const horizonDays = computeHorizonDays(inputs.marketEndDate);
  const fallback: CandidatePolicy = {
    mode: "fallback",
    allowEntry: true,
    qualityBucket: "fallback",
    entryEdgeThreshold: inputs.backtestPolicy.fallbackEntryEdgeThreshold,
    exitEdgeThreshold: inputs.backtestPolicy.fallbackExitEdgeThreshold,
    rationale: "fallback_policy_due_to_missing_backtest_context",
    barrierMultiplier,
    horizonDays,
    ...(inputs.backtestPolicy.sourceSummaryPath ? { sourceSummaryPath: inputs.backtestPolicy.sourceSummaryPath } : {})
  };

  if (inputs.backtestPolicy.mode === "fallback" || !inputs.backtestPolicy.summary || !Number.isFinite(barrierMultiplier)) {
    return fallback;
  }

  const barrierSegment = selectNearestSegment(inputs.backtestPolicy.summary.segmented, "barrier_multiplier", barrierMultiplier);
  const horizonSegment = selectNearestSegment(inputs.backtestPolicy.summary.segmented, "horizon_days", horizonDays);
  if (!barrierSegment || !horizonSegment) {
    return fallback;
  }

  const barrierImprovement = computeSegmentImprovement(barrierSegment);
  const horizonImprovement = computeSegmentImprovement(horizonSegment);
  const weakestImprovement = Math.min(
    barrierImprovement.brierImprovement,
    barrierImprovement.logLossImprovement,
    horizonImprovement.brierImprovement,
    horizonImprovement.logLossImprovement
  );
  const qualityScore =
    (barrierImprovement.brierImprovement +
      barrierImprovement.logLossImprovement +
      horizonImprovement.brierImprovement +
      horizonImprovement.logLossImprovement) /
    4;

  if (weakestImprovement < 0) {
    return {
      mode: "segment_aware",
      allowEntry: false,
      qualityBucket: "blocked",
      entryEdgeThreshold: inputs.backtestPolicy.fallbackEntryEdgeThreshold,
      exitEdgeThreshold: inputs.backtestPolicy.fallbackExitEdgeThreshold,
      rationale: "historical_segment_underperforms_terminal_baseline",
      barrierMultiplier,
      horizonDays,
      barrierBucket: Number(barrierSegment.groupId),
      horizonBucketDays: Number(horizonSegment.groupId),
      barrierImprovement,
      horizonImprovement,
      qualityScore,
      ...(inputs.backtestPolicy.sourceSummaryPath ? { sourceSummaryPath: inputs.backtestPolicy.sourceSummaryPath } : {})
    };
  }

  if (weakestImprovement >= 0.2) {
    return {
      mode: "segment_aware",
      allowEntry: true,
      qualityBucket: "strong",
      entryEdgeThreshold: 0.012,
      exitEdgeThreshold: 0.006,
      rationale: "historically_strong_segment",
      barrierMultiplier,
      horizonDays,
      barrierBucket: Number(barrierSegment.groupId),
      horizonBucketDays: Number(horizonSegment.groupId),
      barrierImprovement,
      horizonImprovement,
      qualityScore,
      ...(inputs.backtestPolicy.sourceSummaryPath ? { sourceSummaryPath: inputs.backtestPolicy.sourceSummaryPath } : {})
    };
  }

  if (weakestImprovement >= 0.05) {
    return {
      mode: "segment_aware",
      allowEntry: true,
      qualityBucket: "medium",
      entryEdgeThreshold: 0.02,
      exitEdgeThreshold: 0.01,
      rationale: "historically_supported_segment",
      barrierMultiplier,
      horizonDays,
      barrierBucket: Number(barrierSegment.groupId),
      horizonBucketDays: Number(horizonSegment.groupId),
      barrierImprovement,
      horizonImprovement,
      qualityScore,
      ...(inputs.backtestPolicy.sourceSummaryPath ? { sourceSummaryPath: inputs.backtestPolicy.sourceSummaryPath } : {})
    };
  }

  if (weakestImprovement >= 0.01) {
    return {
      mode: "segment_aware",
      allowEntry: true,
      qualityBucket: "cautious",
      entryEdgeThreshold: 0.03,
      exitEdgeThreshold: 0.015,
      rationale: "historically_marginal_but_positive_segment",
      barrierMultiplier,
      horizonDays,
      barrierBucket: Number(barrierSegment.groupId),
      horizonBucketDays: Number(horizonSegment.groupId),
      barrierImprovement,
      horizonImprovement,
      qualityScore,
      ...(inputs.backtestPolicy.sourceSummaryPath ? { sourceSummaryPath: inputs.backtestPolicy.sourceSummaryPath } : {})
    };
  }

  return {
    mode: "segment_aware",
    allowEntry: false,
    qualityBucket: "blocked",
    entryEdgeThreshold: inputs.backtestPolicy.fallbackEntryEdgeThreshold,
    exitEdgeThreshold: inputs.backtestPolicy.fallbackExitEdgeThreshold,
    rationale: "historical_segment_advantage_too_small",
    barrierMultiplier,
    horizonDays,
    barrierBucket: Number(barrierSegment.groupId),
    horizonBucketDays: Number(horizonSegment.groupId),
    barrierImprovement,
    horizonImprovement,
    qualityScore,
    ...(inputs.backtestPolicy.sourceSummaryPath ? { sourceSummaryPath: inputs.backtestPolicy.sourceSummaryPath } : {})
  };
}

function selectNearestSegment(
  segments: BacktestSegmentMetrics[],
  groupType: "horizon_days" | "barrier_multiplier",
  value: number
): BacktestSegmentMetrics | undefined {
  const candidates = segments
    .filter((segment) => segment.groupType === groupType)
    .map((segment) => ({ segment, numericId: Number(segment.groupId) }))
    .filter((row) => Number.isFinite(row.numericId));
  return candidates.sort((left, right) => Math.abs(left.numericId - value) - Math.abs(right.numericId - value))[0]?.segment;
}

function computeSegmentImprovement(segment: BacktestSegmentMetrics): SegmentImprovement {
  return {
    brierImprovement: ratio(segment.terminalBaseline.brierScore - segment.rawBarrier.brierScore, segment.terminalBaseline.brierScore),
    logLossImprovement: ratio(segment.terminalBaseline.logLoss - segment.rawBarrier.logLoss, segment.terminalBaseline.logLoss)
  };
}

function computeHorizonDays(endDate: string | undefined): number {
  if (!endDate) {
    return Number.POSITIVE_INFINITY;
  }
  const endMs = Date.parse(endDate);
  if (!Number.isFinite(endMs)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, (endMs - Date.now()) / 86_400_000);
}

function passesCorrelationControls(inputs: {
  candidate: Candidate;
  openPositions: PaperPosition[];
  candidateCostCents: number;
  maxEventExposureCents: number;
  maxPositionsPerEventDirection: number;
  minBarrierGapRatio: number;
}): boolean {
  const sameEventPositions = inputs.openPositions.filter(
    (position) => (position.eventSlug || eventSlugFromMarketSlug(position.marketSlug)) === inputs.candidate.market.eventSlug
  );
  const sameDirectionPositions = sameEventPositions.filter((position) => position.side === inputs.candidate.side);
  if (sameDirectionPositions.length >= inputs.maxPositionsPerEventDirection) {
    return false;
  }
  const sameEventExposureCents =
    sameEventPositions.reduce(
      (sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
      0
    ) + inputs.candidateCostCents;
  if (sameEventExposureCents > inputs.maxEventExposureCents) {
    return false;
  }
  const candidateBarrier = inputs.candidate.barrier.price;
  for (const position of sameDirectionPositions) {
    const existingBarrierPrice = position.barrierPrice ?? extractBarrierSpec(position.questionText)?.price;
    const existingBarrierDirection = position.barrierDirection ?? extractBarrierSpec(position.questionText)?.direction;
    if (
      existingBarrierPrice === undefined ||
      existingBarrierDirection === undefined ||
      existingBarrierDirection !== inputs.candidate.barrier.direction
    ) {
      continue;
    }
    const gapRatio = Math.abs(existingBarrierPrice - candidateBarrier) / Math.max(existingBarrierPrice, candidateBarrier);
    if (gapRatio < inputs.minBarrierGapRatio) {
      return false;
    }
  }
  return true;
}

function computeOverlapAdjustedQuantity(inputs: {
  candidate: Candidate;
  openPositions: PaperPosition[];
  baseQuantity: number;
  entryPriceCents: number;
  maxEventExposureCents: number;
  maxPositionsPerEventDirection: number;
  minBarrierGapRatio: number;
}): number {
  const sameEventPositions = inputs.openPositions.filter(
    (position) => (position.eventSlug || eventSlugFromMarketSlug(position.marketSlug)) === inputs.candidate.market.eventSlug
  );
  const sameDirectionPositions = sameEventPositions.filter((position) => position.side === inputs.candidate.side);
  if (sameDirectionPositions.length >= inputs.maxPositionsPerEventDirection) {
    return 0;
  }
  const sameEventExposureCents = sameEventPositions.reduce(
    (sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
    0
  );
  const remainingEventCapacityCents = Math.max(0, inputs.maxEventExposureCents - sameEventExposureCents);
  const eventCappedQuantity = Math.floor(remainingEventCapacityCents / Math.max(inputs.entryPriceCents, 1));
  let spacingPenalty = 1;
  for (const position of sameDirectionPositions) {
    const existingBarrierPrice = position.barrierPrice ?? extractBarrierSpec(position.questionText)?.price;
    const existingBarrierDirection = position.barrierDirection ?? extractBarrierSpec(position.questionText)?.direction;
    if (
      existingBarrierPrice === undefined ||
      existingBarrierDirection === undefined ||
      existingBarrierDirection !== inputs.candidate.barrier.direction
    ) {
      continue;
    }
    const gapRatio =
      Math.abs(existingBarrierPrice - inputs.candidate.barrier.price) /
      Math.max(existingBarrierPrice, inputs.candidate.barrier.price);
    spacingPenalty = Math.min(spacingPenalty, Math.min(1, gapRatio / Math.max(inputs.minBarrierGapRatio, 1e-6)));
  }
  return Math.max(0, Math.floor(Math.min(inputs.baseQuantity, eventCappedQuantity) * spacingPenalty));
}

function buildResearchSnapshot(inputs: {
  spotPrice: number;
  annualizedVol: number;
  quoteReadyMarkets: PolymarketBtcMilestoneRow[];
  candidates: Candidate[];
  openPositions: PaperPosition[];
  closedPositions: ClosedPaperPosition[];
  netLiquidationCents: number;
  regimeTags: Awaited<ReturnType<typeof buildRegimeTags>>;
}): ResearchSnapshot {
  const spreads = inputs.quoteReadyMarkets
    .map((market) => market.spread)
    .filter((spread): spread is number => spread !== undefined);
  const allowedCandidates = inputs.candidates.filter(
    (candidate) => candidate.policy.allowEntry && Math.abs(candidate.signal) >= candidate.policy.entryEdgeThreshold
  );
  const eventExposure = new Map<string, number>();
  const directionExposure = new Map<PaperSide, number>();
  let weightedBarrierSum = 0;
  let weightedHorizonSum = 0;
  let exposureWeightSum = 0;

  for (const position of inputs.openPositions) {
    const exposure = (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity;
    const eventSlug = position.eventSlug || eventSlugFromMarketSlug(position.marketSlug);
    eventExposure.set(eventSlug, (eventExposure.get(eventSlug) ?? 0) + exposure);
    directionExposure.set(position.side, (directionExposure.get(position.side) ?? 0) + exposure);
    const barrierPrice = position.barrierPrice ?? extractBarrierSpec(position.questionText)?.price;
    if (barrierPrice === undefined) {
      continue;
    }
    const horizonDays = position.marketEndDate
      ? Math.max(0, (Date.parse(position.marketEndDate) - Date.now()) / 86_400_000)
      : undefined;
    weightedBarrierSum += exposure * (barrierPrice / inputs.spotPrice);
    if (horizonDays !== undefined) {
      weightedHorizonSum += exposure * horizonDays;
    }
    exposureWeightSum += exposure;
  }

  return {
    regime: {
      spotPrice: inputs.spotPrice,
      annualizedVol: inputs.annualizedVol,
      quoteReadyMarkets: inputs.quoteReadyMarkets.length,
      upsideQuoteReadyMarkets: inputs.quoteReadyMarkets.filter((market) => extractBarrierSpec(market.question)?.direction === "up").length,
      downsideQuoteReadyMarkets: inputs.quoteReadyMarkets.filter((market) => extractBarrierSpec(market.question)?.direction === "down").length,
      averageSpread: mean(spreads),
      ...(inputs.regimeTags.realizedVol20d === undefined ? {} : { realizedVol20d: inputs.regimeTags.realizedVol20d }),
      ...(inputs.regimeTags.momentum20d === undefined ? {} : { momentum20d: inputs.regimeTags.momentum20d }),
      ...(inputs.regimeTags.momentum60d === undefined ? {} : { momentum60d: inputs.regimeTags.momentum60d }),
      ...(inputs.regimeTags.volBucket ? { volBucket: inputs.regimeTags.volBucket } : {}),
      ...(inputs.regimeTags.trendBucket ? { trendBucket: inputs.regimeTags.trendBucket } : {})
    },
    candidateBook: {
      allowedEntries: allowedCandidates.length,
      blockedEntries: inputs.candidates.length - allowedCandidates.length,
      strongSignals: inputs.candidates.filter((candidate) => candidate.policy.qualityBucket === "strong").length,
      mediumSignals: inputs.candidates.filter((candidate) => candidate.policy.qualityBucket === "medium").length,
      cautiousSignals: inputs.candidates.filter((candidate) => candidate.policy.qualityBucket === "cautious").length,
      blockedSignals: inputs.candidates.filter((candidate) => candidate.policy.qualityBucket === "blocked").length,
      averageAllowedSignal: mean(allowedCandidates.map((candidate) => Math.abs(candidate.signal))),
      averageAllowedBarrierMultiplier: mean(allowedCandidates.map((candidate) => candidate.policy.barrierMultiplier)),
      averageAllowedHorizonDays: mean(allowedCandidates.map((candidate) => candidate.policy.horizonDays)),
      averageGrossEdgeToMid: mean(allowedCandidates.map((candidate) => candidate.grossEdgeToMid)),
      averageNetEdgeToEntry: mean(allowedCandidates.map((candidate) => candidate.netEdgeToEntry)),
      averageSpreadCost: mean(allowedCandidates.map((candidate) => candidate.spreadCostProbability))
    },
    concentration: {
      openEventGroups: eventExposure.size,
      largestEventExposureCents: Math.max(0, ...eventExposure.values()),
      largestEventExposureRate: ratio(Math.max(0, ...eventExposure.values()), inputs.netLiquidationCents),
      largestDirectionExposureCents: Math.max(0, ...directionExposure.values()),
      largestDirectionExposureRate: ratio(Math.max(0, ...directionExposure.values()), inputs.netLiquidationCents),
      ...(exposureWeightSum === 0 ? {} : { weightedAverageBarrierMultiplier: weightedBarrierSum / exposureWeightSum }),
      ...(exposureWeightSum === 0 ? {} : { weightedAverageHorizonDays: weightedHorizonSum / exposureWeightSum })
    },
    costDiagnostics: {
      expectedEntryCostCents: Math.round(
        inputs.openPositions.reduce((sum, position) => {
          const spread = deriveObservedSpreadCostCents(position);
          return sum + spread;
        }, 0)
      ),
      realizedSpreadCaptureCents: inputs.closedPositions.reduce((sum, position) => {
        const entrySpread = deriveObservedSpreadCostCents(position);
        const exitSpread = Math.max(0, (position.lastMarkPriceCents ?? position.exitPriceCents) - position.exitPriceCents) * position.quantity;
        return sum - entrySpread - exitSpread;
      }, 0)
    },
    attribution: {
      byDirection: buildAttributionBuckets(inputs.openPositions, inputs.closedPositions, (position) => position.side),
      byBarrierBucket: buildAttributionBuckets(inputs.openPositions, inputs.closedPositions, (position) =>
        bucketLabel(position.barrierPrice ?? extractBarrierSpec(position.questionText)?.price, [40000, 60000, 80000, 100000, 120000, 150000])
      ),
      byHorizonBucket: buildAttributionBuckets(inputs.openPositions, inputs.closedPositions, (position) =>
        bucketLabel(computeHorizonDays(position.marketEndDate ?? inferMarketEndDate(position.questionText).marketEndDate), [30, 90, 180, 365])
      ),
      byEvent: buildAttributionBuckets(
        inputs.openPositions,
        inputs.closedPositions,
        (position) => position.eventSlug || eventSlugFromMarketSlug(position.marketSlug)
      )
    }
  };
}

function eventSlugFromMarketSlug(marketSlug: string): string {
  const pieces = marketSlug.split("-by-");
  return pieces[0] ?? marketSlug;
}

function buildAttributionBuckets(
  openPositions: PaperPosition[],
  closedPositions: ClosedPaperPosition[],
  groupKey: (position: PaperPosition | ClosedPaperPosition) => string
): AttributionBucket[] {
  const buckets = new Map<string, AttributionBucket>();
  const upsert = (bucketId: string): AttributionBucket => {
    const existing = buckets.get(bucketId);
    if (existing) {
      return existing;
    }
    const created: AttributionBucket = {
      bucketId,
      openPositions: 0,
      grossExposureCents: 0,
      realizedPnlCents: 0,
      unrealizedPnlCents: 0,
      totalPnlCents: 0
    };
    buckets.set(bucketId, created);
    return created;
  };
  for (const position of openPositions) {
    const bucket = upsert(groupKey(position));
    const exposure = (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity;
    const unrealized = ((position.lastMarkPriceCents ?? position.entryPriceCents) - position.entryPriceCents) * position.quantity;
    bucket.openPositions += 1;
    bucket.grossExposureCents += exposure;
    bucket.unrealizedPnlCents += unrealized;
    bucket.totalPnlCents = bucket.realizedPnlCents + bucket.unrealizedPnlCents;
  }
  for (const position of closedPositions) {
    const bucket = upsert(groupKey(position));
    bucket.realizedPnlCents += position.realizedPnlCents;
    bucket.totalPnlCents = bucket.realizedPnlCents + bucket.unrealizedPnlCents;
  }
  return [...buckets.values()].sort((left, right) => right.totalPnlCents - left.totalPnlCents);
}

function deriveObservedSpreadCostCents(position: PaperPosition | ClosedPaperPosition): number {
  const mark = position.lastMarkPriceCents ?? position.entryPriceCents;
  return Math.max(0, position.entryPriceCents - mark) * position.quantity;
}

function bucketLabel(value: number | undefined, edges: number[]): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "unknown";
  }
  for (const edge of edges) {
    if (value <= edge) {
      return `<=${edge}`;
    }
  }
  const last = edges.at(-1);
  return last === undefined ? "unknown" : `>${last}`;
}

function inferMarketEndDate(questionText: string): { marketEndDate?: string } {
  const lower = questionText.toLowerCase();
  if (lower.includes("december 31, 2026")) {
    return { marketEndDate: "2027-01-01T05:00:00Z" };
  }
  if (lower.includes("september 30, 2026")) {
    return { marketEndDate: "2026-10-01T05:00:00Z" };
  }
  if (lower.includes("june 30, 2026")) {
    return { marketEndDate: "2026-07-01T05:00:00Z" };
  }
  if (lower.includes("march 31, 2026")) {
    return { marketEndDate: "2026-04-01T05:00:00Z" };
  }
  return {};
}

async function buildRegimeTags(client: CoinbaseHttpClient): Promise<{
  realizedVol20d?: number;
  momentum20d?: number;
  momentum60d?: number;
  volBucket?: "low" | "medium" | "high";
  trendBucket?: "down" | "flat" | "up";
}> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 86_400_000);
    const candles = await client.getCandles({
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      granularitySeconds: 86400
    });
    if (candles.length < 25) {
      return {};
    }
    const closes = candles.map((row) => row.close);
    const returns = closes.slice(1).map((close, index) => Math.log(close / closes[index]!));
    const vol20 = sampleStdDev(returns.slice(-20)) * Math.sqrt(365.25);
    const momentum20 = ratio(closes.at(-1)! - closes.at(-21)!, closes.at(-21)!);
    const momentum60 = closes.length < 61 ? undefined : ratio(closes.at(-1)! - closes.at(-61)!, closes.at(-61)!);
    return {
      realizedVol20d: vol20,
      momentum20d: momentum20,
      ...(momentum60 === undefined ? {} : { momentum60d: momentum60 }),
      volBucket: vol20 < 0.4 ? "low" : vol20 < 0.8 ? "medium" : "high",
      trendBucket: momentum20 < -0.05 ? "down" : momentum20 > 0.05 ? "up" : "flat"
    };
  } catch {
    return {};
  }
}

async function loadPortfolioState(portfolioRoot: string, startingCashCents: number): Promise<PortfolioState> {
  const target = path.join(portfolioRoot, "portfolio-state.json");
  try {
    return normalizePortfolioState(JSON.parse(await readFile(target, "utf8")) as PortfolioState);
  } catch {
    return {
      strategyId: "polymarket-btc-milestone-paper-v1",
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
      loopCount: 0,
      cashCents: startingCashCents,
      realizedPnlCents: 0,
      openPositions: [],
      closedPositions: []
    };
  }
}

function normalizePortfolioState(state: PortfolioState): PortfolioState {
  return {
    ...state,
    openPositions: state.openPositions.map(normalizePaperPosition),
    closedPositions: state.closedPositions.map(normalizeClosedPaperPosition)
  };
}

function normalizePaperPosition(position: PaperPosition): PaperPosition {
  const barrier = extractBarrierSpec(position.questionText);
  return {
    ...position,
    eventSlug: position.eventSlug || eventSlugFromMarketSlug(position.marketSlug),
    ...(position.barrierPrice !== undefined || !barrier ? {} : { barrierPrice: barrier.price }),
    ...(position.barrierDirection !== undefined || !barrier ? {} : { barrierDirection: barrier.direction }),
    ...(position.marketEndDate ? {} : inferMarketEndDate(position.questionText))
  };
}

function normalizeClosedPaperPosition(position: ClosedPaperPosition): ClosedPaperPosition {
  return normalizePaperPosition(position) as ClosedPaperPosition;
}

async function writeArtifacts(
  portfolioRoot: string,
  summary: PolymarketBtcPaperLoopSummary,
  portfolio: PortfolioState
): Promise<void> {
  portfolio.updatedAtIso = new Date().toISOString();
  await writeFile(path.join(portfolioRoot, "portfolio-state.json"), `${JSON.stringify(portfolio, null, 2)}\n`, "utf8");
  const loopTarget = path.join(portfolioRoot, "loops", `${summary.loopTimeIso.replaceAll(":", "").replaceAll(".", "")}.json`);
  await mkdir(path.dirname(loopTarget), { recursive: true });
  await writeFile(loopTarget, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(path.join(portfolioRoot, "latest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(path.join(portfolioRoot, "performance-summary.json"), `${JSON.stringify(summary.performance, null, 2)}\n`, "utf8");
  await writeFile(path.join(portfolioRoot, "research-summary.json"), `${JSON.stringify(summary.researchSnapshot, null, 2)}\n`, "utf8");
}

interface HistoricalLoopSnapshot {
  loopTimeIso: string;
  netLiquidationCents: number;
  grossTradedNotionalCents?: number;
}

async function buildPerformanceSnapshot(inputs: {
  portfolioRoot: string;
  currentSummary: HistoricalLoopSnapshot;
  portfolio: PortfolioState;
  initialCapitalCents: number;
}): Promise<PerformanceSnapshot> {
  const history = await loadHistoricalSnapshots(inputs.portfolioRoot);
  const ordered = [...history, inputs.currentSummary].sort((left, right) => left.loopTimeIso.localeCompare(right.loopTimeIso));
  const returns = ordered.slice(1).map((point, index) => {
    const prior = ordered[index];
    return !prior || prior.netLiquidationCents === 0 ? 0 : point.netLiquidationCents / prior.netLiquidationCents - 1;
  });
  const unrealizedValue = inputs.portfolio.openPositions.reduce((sum, position) => {
    const markPrice = position.lastMarkPriceCents ?? position.entryPriceCents;
    return sum + (markPrice - position.entryPriceCents) * position.quantity;
  }, 0);
  const grossTradedNotionalCents = ordered.reduce((sum, point) => sum + (point.grossTradedNotionalCents ?? 0), 0);
  const averageNetLiq = mean(ordered.map((point) => point.netLiquidationCents));
  const currentGrossExposureCents = inputs.portfolio.openPositions.reduce(
    (sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
    0
  );
  const currentNetExposureCents = inputs.portfolio.openPositions.reduce(
    (sum, position) =>
      sum +
      (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
    0
  );
  const wins = inputs.portfolio.closedPositions.filter((position) => position.realizedPnlCents > 0);
  const losses = inputs.portfolio.closedPositions.filter((position) => position.realizedPnlCents < 0);
  const grossProfit = wins.reduce((sum, position) => sum + position.realizedPnlCents, 0);
  const grossLoss = losses.reduce((sum, position) => sum + Math.abs(position.realizedPnlCents), 0);

  return {
    initialCapitalCents: inputs.initialCapitalCents,
    loopCount: ordered.length,
    closedTrades: inputs.portfolio.closedPositions.length,
    openTrades: inputs.portfolio.openPositions.length,
    grossTradedNotionalCents,
    turnoverRatio: averageNetLiq === 0 ? 0 : grossTradedNotionalCents / averageNetLiq,
    currentGrossExposureCents,
    currentNetExposureCents,
    currentGrossExposureRate: ratio(currentGrossExposureCents, inputs.currentSummary.netLiquidationCents),
    currentNetExposureRate: ratio(currentNetExposureCents, inputs.currentSummary.netLiquidationCents),
    cumulativeReturn: inputs.currentSummary.netLiquidationCents / inputs.initialCapitalCents - 1,
    realizedReturn: inputs.portfolio.realizedPnlCents / inputs.initialCapitalCents,
    unrealizedReturn: unrealizedValue / inputs.initialCapitalCents,
    maxDrawdown: computeMaxDrawdown(ordered.map((point) => point.netLiquidationCents)),
    ...(wins.length + losses.length === 0 ? {} : { winRate: ratio(wins.length, wins.length + losses.length) }),
    ...(wins.length === 0 ? {} : { averageWinCents: mean(wins.map((position) => position.realizedPnlCents)) }),
    ...(losses.length === 0 ? {} : { averageLossCents: mean(losses.map((position) => position.realizedPnlCents)) }),
    ...(grossLoss === 0 ? {} : { profitFactor: grossProfit / grossLoss }),
    ...(inputs.portfolio.closedPositions.length === 0
      ? {}
      : {
          averageHoldingMinutes: mean(
            inputs.portfolio.closedPositions.map((position) => (position.exitTimeMs - position.entryTimeMs) / 60_000)
          )
        }),
    ...(returns.length < 2 ? {} : { loopSharpeRatio: computeSharpeRatio(returns) }),
    ...(returns.filter((value) => value < 0).length === 0 ? {} : { loopSortinoRatio: computeSortinoRatio(returns) })
  };
}

async function loadHistoricalSnapshots(portfolioRoot: string): Promise<HistoricalLoopSnapshot[]> {
  const loopsRoot = path.join(portfolioRoot, "loops");
  try {
    const entries = (await readdir(loopsRoot)).filter((entry) => entry.endsWith(".json")).sort();
    const snapshots = await Promise.all(
      entries.map(async (entry) => JSON.parse(await readFile(path.join(loopsRoot, entry), "utf8")) as HistoricalLoopSnapshot)
    );
    return snapshots.filter((snapshot) => typeof snapshot.netLiquidationCents === "number");
  } catch {
    return [];
  }
}

function computeMaxDrawdown(equityCurve: number[]): number {
  let peak = Number.NEGATIVE_INFINITY;
  let maxDrawdown = 0;
  for (const value of equityCurve) {
    peak = Math.max(peak, value);
    if (peak <= 0) {
      continue;
    }
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  }
  return maxDrawdown;
}

function computeSharpeRatio(returns: number[]): number {
  const deviation = sampleStdDev(returns);
  if (deviation === 0) {
    return 0;
  }
  return mean(returns) / deviation * Math.sqrt(returns.length);
}

function computeSortinoRatio(returns: number[]): number {
  const downside = returns.filter((value) => value < 0);
  const deviation = sampleStdDev(downside);
  if (deviation === 0) {
    return 0;
  }
  return mean(returns) / deviation * Math.sqrt(returns.length);
}

function normalCdf(value: number): number {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(variance, 0));
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
