import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CoinbaseHttpClient } from "../runtime/coinbase-api.js";
import { runPolymarketBtcMilestoneScan } from "./polymarket-btc-milestone-scan.js";
import { buildCandidate, buildRegimeTagsFromCandles, buildResearchSnapshot, computeBarrierHitProbability, extractBarrierSpec, loadBacktestPolicy } from "./polymarket-btc-paper-loop.js";
export async function runPolymarketBtcResearchBackfill(options = {}) {
    const outputRoot = options.outputRoot ?? path.resolve(process.cwd(), "data", "backtests", "polymarket-btc-research-backfill", timestampId(new Date()));
    await mkdir(path.join(outputRoot, "raw"), { recursive: true });
    await mkdir(path.join(outputRoot, "snapshots"), { recursive: true });
    await mkdir(path.join(outputRoot, "summaries"), { recursive: true });
    const startIso = options.startIso ?? "2024-01-01T00:00:00.000Z";
    const endIso = options.endIso ?? new Date().toISOString();
    const stepDays = Math.max(1, options.stepDays ?? 7);
    const lookbackDays = Math.max(25, options.lookbackDays ?? 60);
    const marketSurface = options.marketSurface ?? "terminal_baseline";
    const syntheticSpread = clamp(options.syntheticSpread ?? 0.04, 0.002, 0.2);
    const startingCapitalCents = options.startingCapitalCents ?? 100_000;
    const startMs = Date.parse(startIso);
    const endMs = Date.parse(endIso);
    const backtestPolicy = await loadBacktestPolicy({
        cwd: process.cwd(),
        fallbackEntryEdgeThreshold: 0.04,
        fallbackExitEdgeThreshold: 0.015,
        ...(options.backtestSummaryPath ? { explicitSummaryPath: options.backtestSummaryPath } : {})
    });
    const baseMarkets = await loadBaseMarkets(options.scanOutputRoot);
    const candles = await fetchDailyCandles({
        startIso: new Date(startMs - (lookbackDays + 90) * 86_400_000).toISOString(),
        endIso
    });
    const snapshots = [];
    for (let index = lookbackDays; index < candles.length; index += stepDays) {
        const candle = candles[index];
        if (!candle || candle.timeMs < startMs || candle.timeMs > endMs) {
            continue;
        }
        const trailing = candles.slice(Math.max(0, index - lookbackDays), index + 1);
        const annualizedVol = options.annualizedVolOverride ?? trailingAnnualizedVol(trailing);
        if (!Number.isFinite(annualizedVol) || annualizedVol <= 0) {
            continue;
        }
        const regimeTags = buildRegimeTagsFromCandles(trailing);
        const timestampMs = candle.timeMs;
        const surfacedMarkets = baseMarkets
            .map((market) => materializeHistoricalMarketSurface(market, {
            marketSurface,
            spotPrice: candle.close,
            annualizedVol,
            syntheticSpread,
            timestampMs
        }))
            .filter((market) => market !== null);
        const quoteReadyMarkets = surfacedMarkets.filter((market) => market.active && !market.closed && market.bestBid !== undefined && market.bestAsk !== undefined);
        const candidates = quoteReadyMarkets
            .map((market) => buildCandidate(market, candle.close, annualizedVol, timestampMs, backtestPolicy))
            .filter((candidate) => candidate !== null);
        const researchSnapshot = buildResearchSnapshot({
            spotPrice: candle.close,
            annualizedVol,
            quoteReadyMarkets,
            candidates,
            openPositions: [],
            closedPositions: [],
            netLiquidationCents: startingCapitalCents,
            regimeTags,
            referenceNowMs: timestampMs
        });
        const record = {
            timestampIso: new Date(timestampMs).toISOString(),
            spotPrice: candle.close,
            annualizedVol,
            quoteReadyMarkets: quoteReadyMarkets.length,
            allowedEntries: researchSnapshot.candidateBook.allowedEntries,
            blockedEntries: researchSnapshot.candidateBook.blockedEntries,
            topSignalAbs: Math.max(0, ...candidates.map((candidate) => Math.abs(candidate.signal))),
            researchSnapshot
        };
        snapshots.push(record);
        await writeFile(path.join(outputRoot, "snapshots", `${record.timestampIso.replaceAll(":", "").replaceAll(".", "")}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    }
    const compactHistory = snapshots.map((snapshot) => ({
        timestampIso: snapshot.timestampIso,
        spotPrice: snapshot.spotPrice,
        annualizedVol: snapshot.annualizedVol,
        quoteReadyMarkets: snapshot.quoteReadyMarkets,
        allowedEntries: snapshot.allowedEntries,
        blockedEntries: snapshot.blockedEntries,
        topSignalAbs: snapshot.topSignalAbs,
        regime: snapshot.researchSnapshot.regime,
        candidateBook: snapshot.researchSnapshot.candidateBook
    }));
    const historyPath = path.join(outputRoot, "summaries", "research-snapshot-history.json");
    await writeFile(path.join(outputRoot, "raw", "candles.json"), `${JSON.stringify(candles, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputRoot, "raw", "base-markets.json"), `${JSON.stringify(baseMarkets, null, 2)}\n`, "utf8");
    await writeFile(historyPath, `${JSON.stringify(compactHistory, null, 2)}\n`, "utf8");
    const latest = snapshots.at(-1);
    const summary = {
        outputRoot,
        checkedAtIso: new Date().toISOString(),
        sourceNote: marketSurface === "frozen_live"
            ? "Historical research-state replay using current live BTC milestone quotes frozen across past BTC timestamps. This is useful when historical venue quote archives are unavailable."
            : "Historical research-state replay using a synthetic terminal-probability quote surface around the live BTC milestone universe. This avoids dependency on archived Polymarket order books while preserving the research snapshot schema.",
        marketSurface,
        startIso,
        endIso,
        stepDays,
        lookbackDays,
        candleCount: candles.length,
        baseMarkets: baseMarkets.length,
        snapshots: snapshots.length,
        historyPath,
        ...(latest
            ? {
                latestSnapshotPath: path.join(outputRoot, "snapshots", `${latest.timestampIso.replaceAll(":", "").replaceAll(".", "")}.json`),
                latestTimestampIso: latest.timestampIso,
                latestAllowedEntries: latest.allowedEntries,
                latestBlockedEntries: latest.blockedEntries
            }
            : {})
    };
    await writeFile(path.join(outputRoot, "summaries", "research-backfill-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    return summary;
}
async function loadBaseMarkets(scanOutputRoot) {
    if (scanOutputRoot) {
        const scan = JSON.parse(await readFile(path.join(scanOutputRoot, "summaries", "btc-milestone-scan.json"), "utf8"));
        return scan.markets;
    }
    const scan = await runPolymarketBtcMilestoneScan();
    return scan.markets;
}
async function fetchDailyCandles(inputs) {
    const client = new CoinbaseHttpClient();
    const startMs = Date.parse(inputs.startIso);
    const endMs = Date.parse(inputs.endIso);
    const chunkMs = 300 * 86_400_000;
    const chunks = [];
    for (let cursor = startMs; cursor < endMs; cursor += chunkMs) {
        const chunkEnd = Math.min(endMs, cursor + chunkMs);
        const rows = await client.getCandles({
            startIso: new Date(cursor).toISOString(),
            endIso: new Date(chunkEnd).toISOString(),
            granularitySeconds: 86400
        });
        chunks.push(...rows);
    }
    const deduped = new Map(chunks.map((row) => [row.timeMs, row]));
    return [...deduped.values()].sort((left, right) => left.timeMs - right.timeMs);
}
function materializeHistoricalMarketSurface(market, inputs) {
    const endMs = market.endDate ? Date.parse(market.endDate) : NaN;
    if (!Number.isFinite(endMs) || endMs <= inputs.timestampMs) {
        return null;
    }
    if (inputs.marketSurface === "frozen_live") {
        return {
            ...market,
            active: true,
            closed: false
        };
    }
    const barrier = extractBarrierSpec(market.question);
    const mid = computeSyntheticYesMid(inputs.spotPrice, barrier, market.endDate, inputs.annualizedVol, inputs.timestampMs);
    if (mid === undefined) {
        return null;
    }
    const halfSpread = inputs.syntheticSpread / 2;
    const bestBid = clamp(mid - halfSpread, 0.001, 0.999);
    const bestAsk = clamp(mid + halfSpread, 0.001, 0.999);
    return {
        ...market,
        active: true,
        closed: false,
        bestBid,
        bestAsk,
        lastTradePrice: mid,
        spread: bestAsk - bestBid
    };
}
function computeSyntheticYesMid(spotPrice, barrier, endDate, annualizedVol, nowMs) {
    const barrierHitProbability = computeBarrierHitProbability(spotPrice, barrier, endDate, annualizedVol, nowMs);
    const terminalProbability = computeTerminalProbability(spotPrice, barrier, endDate, annualizedVol, nowMs);
    if (barrierHitProbability === undefined || terminalProbability === undefined) {
        return undefined;
    }
    return clamp((barrierHitProbability + terminalProbability) / 2, 0.001, 0.999);
}
function computeTerminalProbability(spotPrice, barrier, endDate, annualizedVol, nowMs) {
    if (!barrier || !endDate || spotPrice <= 0 || annualizedVol <= 0) {
        return undefined;
    }
    const expiryMs = Date.parse(endDate);
    if (!Number.isFinite(expiryMs) || expiryMs <= nowMs) {
        return undefined;
    }
    const timeYears = (expiryMs - nowMs) / (365.25 * 24 * 3_600_000);
    const sigmaSqrtT = annualizedVol * Math.sqrt(timeYears);
    if (sigmaSqrtT <= 0) {
        return undefined;
    }
    const z = barrier.direction === "up"
        ? Math.log(barrier.price / spotPrice) / sigmaSqrtT
        : Math.log(spotPrice / barrier.price) / sigmaSqrtT;
    return clamp(1 - normalCdf(z), 0, 1);
}
function trailingAnnualizedVol(candles) {
    const returns = [];
    for (let index = 1; index < candles.length; index += 1) {
        const previous = candles[index - 1];
        const current = candles[index];
        if (!previous || !current || previous.close <= 0 || current.close <= 0) {
            continue;
        }
        returns.push(Math.log(current.close / previous.close));
    }
    return sampleStdDev(returns) * Math.sqrt(365.25);
}
function sampleStdDev(values) {
    if (values.length < 2) {
        return 0;
    }
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
    return Math.sqrt(Math.max(variance, 0));
}
function normalCdf(value) {
    return 0.5 * (1 + erf(value / Math.sqrt(2)));
}
function erf(value) {
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
    return sign * y;
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function timestampId(now) {
    return now.toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
}
