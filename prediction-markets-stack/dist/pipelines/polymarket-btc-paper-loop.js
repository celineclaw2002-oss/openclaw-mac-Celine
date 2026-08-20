import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CoinbaseHttpClient } from "../runtime/coinbase-api.js";
import { runPolymarketBtcMilestoneScan } from "./polymarket-btc-milestone-scan.js";
export async function runPolymarketBtcPaperLoop(options = {}) {
    const portfolioRoot = path.resolve(process.cwd(), options.portfolioRoot ?? path.join("data", "paper-trading", "polymarket-btc-milestone"));
    await mkdir(portfolioRoot, { recursive: true });
    const startingCashCents = options.startingCashCents ?? 100_000;
    const maxOpenPositions = options.maxOpenPositions ?? 4;
    const maxPositionNotionalCents = options.maxPositionNotionalCents ?? 12_500;
    const entryEdgeThreshold = options.entryEdgeThreshold ?? 0.04;
    const exitEdgeThreshold = options.exitEdgeThreshold ?? 0.015;
    const annualizedVol = options.annualizedVol ?? 0.6;
    const scan = options.outputRoot
        ? await readScanSummary(path.join(options.outputRoot, "summaries", "btc-milestone-scan.json"))
        : await runPolymarketBtcMilestoneScan();
    const outputRoot = scan.outputRoot;
    const scanAction = options.outputRoot ? "reused" : "executed";
    const baseSummary = {
        outputRoot,
        portfolioRoot,
        loopTimeIso: new Date().toISOString(),
        scanAction,
        reservePathVerdict: scan.reservePathVerdict,
        entryEdgeThreshold,
        exitEdgeThreshold
    };
    const quoteReadyMarkets = scan.markets.filter((market) => market.active && !market.closed && market.bestBid !== undefined && market.bestAsk !== undefined);
    const portfolio = await loadPortfolioState(portfolioRoot, startingCashCents);
    portfolio.loopCount += 1;
    portfolio.updatedAtIso = new Date().toISOString();
    portfolio.lastOutputRoot = outputRoot;
    const spot = await new CoinbaseHttpClient().getTicker("BTC-USD");
    const nowMs = Date.now();
    const signalDiagnostics = quoteReadyMarkets
        .map((market) => {
        const barrier = extractBarrier(market.question);
        const anchorProbability = computeBarrierHitProbability(spot.price, barrier, market.endDate, annualizedVol, nowMs);
        if (anchorProbability === undefined) {
            return null;
        }
        const signal = computeSignal(anchorProbability, market);
        return {
            marketSlug: market.marketSlug,
            side: signal >= 0 ? "yes" : "no",
            signal,
            anchorProbability,
            marketMid: deriveYesMid(market)
        };
    })
        .filter((row) => row !== null)
        .sort((left, right) => Math.abs(right.signal) - Math.abs(left.signal))
        .slice(0, 5);
    if (quoteReadyMarkets.length === 0) {
        const markedOpenValue = portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
        const netExposureCents = portfolio.openPositions.reduce((sum, position) => sum +
            (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
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
        const summary = {
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
            performance,
            actions: [],
            skippedReason: "No quote-ready Polymarket BTC milestone markets were found in the current scan."
        };
        await writeArtifacts(portfolioRoot, summary, portfolio);
        return summary;
    }
    const quoteReadyBySlug = new Map(quoteReadyMarkets.map((market) => [market.marketSlug, market]));
    const actions = [];
    const remainingOpen = [];
    for (const position of portfolio.openPositions) {
        const market = quoteReadyBySlug.get(position.marketSlug);
        const markPrice = market ? resolveMarkPrice(position.side, market) : position.lastMarkPriceCents;
        const executableExitPrice = market ? resolveExecutableExitPrice(position.side, market) : undefined;
        const anchorProbability = market ? computeBarrierHitProbability(spot.price, extractBarrier(market.question), market.endDate, annualizedVol, nowMs) : undefined;
        const signal = market && anchorProbability !== undefined ? computeSignal(anchorProbability, market) : undefined;
        const exitReason = classifyExitReason(signal, exitEdgeThreshold, market, executableExitPrice);
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
    const candidates = quoteReadyMarkets
        .map((market) => buildCandidate(market, spot.price, annualizedVol, nowMs))
        .filter((candidate) => candidate !== null)
        .filter((candidate) => Math.abs(candidate.signal) >= entryEdgeThreshold)
        .filter((candidate) => !portfolio.openPositions.some((position) => position.marketSlug === candidate.market.marketSlug))
        .sort((left, right) => Math.abs(right.signal) - Math.abs(left.signal));
    for (const candidate of candidates) {
        if (portfolio.openPositions.length >= maxOpenPositions) {
            break;
        }
        const quantity = Math.max(1, Math.floor(maxPositionNotionalCents / Math.max(candidate.entryPriceCents, 1)));
        const costCents = quantity * candidate.entryPriceCents;
        if (costCents > portfolio.cashCents) {
            continue;
        }
        portfolio.cashCents -= costCents;
        portfolio.openPositions.push({
            positionId: `paper::${candidate.market.marketSlug}::${candidate.side}::${nowMs}`,
            marketSlug: candidate.market.marketSlug,
            questionText: candidate.market.question,
            side: candidate.side,
            quantity,
            entryPriceCents: candidate.entryPriceCents,
            entryTimeMs: nowMs,
            entrySignal: candidate.signal,
            entryAnchorProbability: candidate.anchorProbability,
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
            reason: "barrier_anchor_edge_above_threshold"
        });
    }
    const unrealizedPnlCents = portfolio.openPositions.reduce((sum, position) => {
        const markPrice = position.lastMarkPriceCents;
        return markPrice === undefined ? sum : sum + (markPrice - position.entryPriceCents) * position.quantity;
    }, 0);
    const grossExposureCents = portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const netExposureCents = portfolio.openPositions.reduce((sum, position) => sum +
        (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const netLiquidationCents = portfolio.cashCents + grossExposureCents;
    const entryNotionalCents = actions
        .filter((action) => action.type === "entry")
        .reduce((sum, action) => sum + action.priceCents * action.quantity, 0);
    const exitNotionalCents = actions
        .filter((action) => action.type === "exit")
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
    const summary = {
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
        performance,
        actions
    };
    await writeArtifacts(portfolioRoot, summary, portfolio);
    return summary;
}
async function readScanSummary(target) {
    return JSON.parse(await readFile(target, "utf8"));
}
function buildCandidate(market, spotPrice, annualizedVol, nowMs) {
    const barrier = extractBarrier(market.question);
    const anchorProbability = computeBarrierHitProbability(spotPrice, barrier, market.endDate, annualizedVol, nowMs);
    if (anchorProbability === undefined) {
        return null;
    }
    const signal = computeSignal(anchorProbability, market);
    const side = signal >= 0 ? "yes" : "no";
    const entryPriceCents = resolveExecutableEntryPrice(side, market);
    if (entryPriceCents === undefined) {
        return null;
    }
    const markPriceCents = resolveMarkPrice(side, market);
    return {
        market,
        side,
        signal,
        anchorProbability,
        entryPriceCents,
        ...(markPriceCents === undefined ? {} : { markPriceCents })
    };
}
function extractBarrier(question) {
    const match = question.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)(?:k|K)?/);
    if (!match?.[1]) {
        return undefined;
    }
    const raw = match[1].replaceAll(",", "");
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
        return undefined;
    }
    return question.toLowerCase().includes("$150k") ? parsed * 1000 : parsed;
}
function computeBarrierHitProbability(spotPrice, barrier, endDate, annualizedVol, nowMs) {
    if (barrier === undefined || !endDate) {
        return undefined;
    }
    if (spotPrice >= barrier) {
        return 1;
    }
    const expiryMs = Date.parse(endDate);
    if (!Number.isFinite(expiryMs) || expiryMs <= nowMs || annualizedVol <= 0) {
        return undefined;
    }
    const timeYears = (expiryMs - nowMs) / (365.25 * 24 * 3_600_000);
    const logBarrier = Math.log(barrier / spotPrice);
    const sigmaSqrtT = annualizedVol * Math.sqrt(timeYears);
    if (sigmaSqrtT <= 0) {
        return undefined;
    }
    const z = logBarrier / sigmaSqrtT;
    return clamp01(2 * (1 - normalCdf(z)));
}
function computeSignal(anchorProbability, market) {
    const marketMid = deriveYesMid(market);
    return anchorProbability - marketMid;
}
function deriveYesMid(market) {
    if (market.bestBid !== undefined && market.bestAsk !== undefined) {
        return (market.bestBid + market.bestAsk) / 2;
    }
    return market.lastTradePrice ?? 0.5;
}
function resolveExecutableEntryPrice(side, market) {
    if (side === "yes") {
        return market.bestAsk === undefined ? undefined : Math.round(market.bestAsk * 100);
    }
    return market.bestBid === undefined ? undefined : Math.round((1 - market.bestBid) * 100);
}
function resolveExecutableExitPrice(side, market) {
    if (side === "yes") {
        return market.bestBid === undefined ? undefined : Math.round(market.bestBid * 100);
    }
    return market.bestAsk === undefined ? undefined : Math.round((1 - market.bestAsk) * 100);
}
function resolveMarkPrice(side, market) {
    const mid = deriveYesMid(market);
    return Math.round((side === "yes" ? mid : 1 - mid) * 100);
}
function classifyExitReason(signal, exitEdgeThreshold, market, executableExitPrice) {
    if (!market || !market.active || market.closed) {
        return "market_no_longer_tradeable";
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
async function loadPortfolioState(portfolioRoot, startingCashCents) {
    const target = path.join(portfolioRoot, "portfolio-state.json");
    try {
        return JSON.parse(await readFile(target, "utf8"));
    }
    catch {
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
async function writeArtifacts(portfolioRoot, summary, portfolio) {
    portfolio.updatedAtIso = new Date().toISOString();
    await writeFile(path.join(portfolioRoot, "portfolio-state.json"), `${JSON.stringify(portfolio, null, 2)}\n`, "utf8");
    const loopTarget = path.join(portfolioRoot, "loops", `${summary.loopTimeIso.replaceAll(":", "").replaceAll(".", "")}.json`);
    await mkdir(path.dirname(loopTarget), { recursive: true });
    await writeFile(loopTarget, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(path.join(portfolioRoot, "latest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(path.join(portfolioRoot, "performance-summary.json"), `${JSON.stringify(summary.performance, null, 2)}\n`, "utf8");
}
async function buildPerformanceSnapshot(inputs) {
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
    const currentGrossExposureCents = inputs.portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const currentNetExposureCents = inputs.portfolio.openPositions.reduce((sum, position) => sum +
        (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
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
                averageHoldingMinutes: mean(inputs.portfolio.closedPositions.map((position) => (position.exitTimeMs - position.entryTimeMs) / 60_000))
            }),
        ...(returns.length < 2 ? {} : { loopSharpeRatio: computeSharpeRatio(returns) }),
        ...(returns.filter((value) => value < 0).length === 0 ? {} : { loopSortinoRatio: computeSortinoRatio(returns) })
    };
}
async function loadHistoricalSnapshots(portfolioRoot) {
    const loopsRoot = path.join(portfolioRoot, "loops");
    try {
        const entries = (await readdir(loopsRoot)).filter((entry) => entry.endsWith(".json")).sort();
        const snapshots = await Promise.all(entries.map(async (entry) => JSON.parse(await readFile(path.join(loopsRoot, entry), "utf8"))));
        return snapshots.filter((snapshot) => typeof snapshot.netLiquidationCents === "number");
    }
    catch {
        return [];
    }
}
function computeMaxDrawdown(equityCurve) {
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
function computeSharpeRatio(returns) {
    const deviation = sampleStdDev(returns);
    if (deviation === 0) {
        return 0;
    }
    return mean(returns) / deviation * Math.sqrt(returns.length);
}
function computeSortinoRatio(returns) {
    const downside = returns.filter((value) => value < 0);
    const deviation = sampleStdDev(downside);
    if (deviation === 0) {
        return 0;
    }
    return mean(returns) / deviation * Math.sqrt(returns.length);
}
function normalCdf(value) {
    return 0.5 * (1 + erf(value / Math.SQRT2));
}
function erf(x) {
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
function mean(values) {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function sampleStdDev(values) {
    if (values.length < 2) {
        return 0;
    }
    const average = mean(values);
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
    return Math.sqrt(Math.max(variance, 0));
}
function ratio(numerator, denominator) {
    if (denominator === 0) {
        return 0;
    }
    return numerator / denominator;
}
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
