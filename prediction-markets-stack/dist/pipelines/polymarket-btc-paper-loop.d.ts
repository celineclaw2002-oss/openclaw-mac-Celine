import type { CoinbaseDailyCandleRecord } from "../runtime/coinbase-api.js";
import { CoinbaseHttpClient } from "../runtime/coinbase-api.js";
import { type CandidateModelSummary } from "../models/research-sleeves.js";
import type { PolymarketBtcMilestoneRow } from "./polymarket-btc-milestone-scan.js";
export type PaperSide = "yes" | "no";
export type BarrierDirection = "up" | "down";
export interface BarrierSpec {
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
export interface CandidatePolicy {
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
export interface ResearchSnapshot {
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
        allowedEntries: number;
        blockedEntries: number;
        averageEnsembleScore: number;
        averageExpectedEdgeScore: number;
    };
}
export interface AttributionBucket {
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
export interface Candidate {
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
export declare function runPolymarketBtcPaperLoop(options?: PolymarketBtcPaperLoopOptions): Promise<PolymarketBtcPaperLoopSummary>;
export declare function buildCandidate(market: PolymarketBtcMilestoneRow, spotPrice: number, annualizedVol: number, nowMs: number, backtestPolicy: Awaited<ReturnType<typeof loadBacktestPolicy>>): Candidate | null;
export declare function extractBarrierSpec(question: string): BarrierSpec | undefined;
export declare function computeBarrierHitProbability(spotPrice: number, barrier: BarrierSpec | undefined, endDate: string | undefined, annualizedVol: number, nowMs: number): number | undefined;
export declare function computeSignal(anchorProbability: number, market: PolymarketBtcMilestoneRow): number;
export declare function deriveYesMid(market: PolymarketBtcMilestoneRow): number;
export declare function loadBacktestPolicy(inputs: {
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
}>;
export declare function buildResearchSnapshot(inputs: {
    spotPrice: number;
    annualizedVol: number;
    quoteReadyMarkets: PolymarketBtcMilestoneRow[];
    candidates: Candidate[];
    openPositions: PaperPosition[];
    closedPositions: ClosedPaperPosition[];
    netLiquidationCents: number;
    regimeTags: Awaited<ReturnType<typeof buildRegimeTags>>;
    referenceNowMs?: number;
}): ResearchSnapshot;
export declare function buildRegimeTagsFromCandles(candles: CoinbaseDailyCandleRecord[]): {
    realizedVol20d?: number;
    momentum20d?: number;
    momentum60d?: number;
    volBucket?: "low" | "medium" | "high";
    trendBucket?: "down" | "flat" | "up";
};
declare function buildRegimeTags(client: CoinbaseHttpClient): Promise<{
    realizedVol20d?: number;
    momentum20d?: number;
    momentum60d?: number;
    volBucket?: "low" | "medium" | "high";
    trendBucket?: "down" | "flat" | "up";
}>;
export {};
