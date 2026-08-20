import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CoinbaseHttpClient } from "../runtime/coinbase-api.js";
export async function runPolymarketBtcBarrierBacktest(options = {}) {
    const outputRoot = options.outputRoot ?? path.resolve(process.cwd(), "data", "backtests", "polymarket-btc-barrier", timestampId(new Date()));
    await mkdir(path.join(outputRoot, "raw"), { recursive: true });
    await mkdir(path.join(outputRoot, "summaries"), { recursive: true });
    const startIso = options.startIso ?? "2021-01-01T00:00:00.000Z";
    const endIso = options.endIso ?? new Date().toISOString();
    const lookbackDays = options.lookbackDays ?? 30;
    const horizonDays = options.horizonDays ?? [30, 90, 180, 365];
    const barrierMultipliers = options.barrierMultipliers ?? [1.05, 1.1, 1.25, 1.5, 1.75, 2];
    const trainFraction = options.trainFraction ?? 0.7;
    const candles = await fetchDailyCandles(startIso, endIso);
    const observations = buildObservations(candles, lookbackDays, horizonDays, barrierMultipliers);
    const trainCut = Math.max(1, Math.min(observations.length - 1, Math.floor(observations.length * trainFraction)));
    const train = observations.slice(0, trainCut);
    const test = observations.slice(trainCut);
    const calibrationBlocks = fitIsotonicCalibration(train.map((row) => row.rawBarrierProbability), train.map((row) => row.realizedHit));
    const calibratedTest = test.map((row) => ({
        ...row,
        calibratedBarrierProbability: predictIsotonic(calibrationBlocks, row.rawBarrierProbability)
    }));
    const overall = {
        rawBarrier: summarizeModel("raw_barrier", test.map((row) => row.rawBarrierProbability), test.map((row) => row.realizedHit)),
        calibratedBarrier: summarizeModel("calibrated_barrier", calibratedTest.map((row) => row.calibratedBarrierProbability), calibratedTest.map((row) => row.realizedHit)),
        terminalBaseline: summarizeModel("terminal_baseline", test.map((row) => row.terminalBaselineProbability), test.map((row) => row.realizedHit))
    };
    const segmented = buildSegmentedMetrics(calibratedTest);
    const summary = {
        outputRoot,
        checkedAtIso: new Date().toISOString(),
        sourceNote: "Synthetic historical BTC milestone backtest grounded in first-passage / barrier-hit modeling and proper scoring. This evaluates model quality, not venue execution or market-specific edge.",
        startIso,
        endIso,
        candleCount: candles.length,
        lookbackDays,
        horizonDays,
        barrierMultipliers,
        observations: observations.length,
        trainObservations: train.length,
        testObservations: test.length,
        overall,
        segmented,
        calibrationBlocks,
        verdict: buildVerdict(overall)
    };
    await writeFile(path.join(outputRoot, "raw", "candles.json"), `${JSON.stringify(candles, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputRoot, "raw", "observations.json"), `${JSON.stringify(observations, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputRoot, "summaries", "barrier-backtest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    return summary;
}
async function fetchDailyCandles(startIso, endIso) {
    const client = new CoinbaseHttpClient();
    const startMs = Date.parse(startIso);
    const endMs = Date.parse(endIso);
    const chunkMs = 300 * 86400 * 1000;
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
function buildObservations(candles, lookbackDays, horizonDays, barrierMultipliers) {
    const observations = [];
    for (let index = lookbackDays; index < candles.length; index += 1) {
        const candle = candles[index];
        if (!candle) {
            continue;
        }
        const trailing = candles.slice(index - lookbackDays, index + 1);
        const realizedVol = trailingAnnualizedVol(trailing);
        if (!Number.isFinite(realizedVol) || realizedVol <= 0) {
            continue;
        }
        for (const horizon of horizonDays) {
            const futureSlice = candles.slice(index + 1, index + 1 + horizon);
            if (futureSlice.length < horizon) {
                continue;
            }
            const maxFutureHigh = Math.max(...futureSlice.map((row) => row.high));
            for (const multiplier of barrierMultipliers) {
                const barrierPrice = candle.close * multiplier;
                const rawBarrierProbability = computeBarrierHitProbability(candle.close, barrierPrice, realizedVol, horizon / 365.25);
                const terminalBaselineProbability = computeTerminalProbability(candle.close, barrierPrice, realizedVol, horizon / 365.25);
                observations.push({
                    observationDateIso: new Date(candle.timeMs).toISOString(),
                    horizonDays: horizon,
                    barrierMultiplier: multiplier,
                    startClose: candle.close,
                    barrierPrice,
                    realizedVol,
                    realizedHit: maxFutureHigh >= barrierPrice ? 1 : 0,
                    rawBarrierProbability,
                    terminalBaselineProbability
                });
            }
        }
    }
    return observations;
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
function fitIsotonicCalibration(probabilities, outcomes) {
    const rows = probabilities
        .map((probability, index) => ({ x: clamp01(probability), y: outcomes[index] ?? 0, weight: 1 }))
        .sort((left, right) => left.x - right.x);
    const blocks = [];
    for (const row of rows) {
        blocks.push({
            lowerX: row.x,
            upperX: row.x,
            sumY: row.y,
            weight: row.weight
        });
        while (blocks.length >= 2) {
            const right = blocks[blocks.length - 1];
            const left = blocks[blocks.length - 2];
            if (!right || !left) {
                break;
            }
            if (left.sumY / left.weight <= right.sumY / right.weight) {
                break;
            }
            blocks.splice(blocks.length - 2, 2, {
                lowerX: left.lowerX,
                upperX: right.upperX,
                sumY: left.sumY + right.sumY,
                weight: left.weight + right.weight
            });
        }
    }
    return blocks.map((block) => ({
        lowerX: block.lowerX,
        upperX: block.upperX,
        fittedValue: block.sumY / block.weight
    }));
}
function predictIsotonic(blocks, probability) {
    const x = clamp01(probability);
    for (const block of blocks) {
        if (x <= block.upperX) {
            return clamp01(block.fittedValue);
        }
    }
    const last = blocks.at(-1);
    return last ? clamp01(last.fittedValue) : x;
}
function summarizeModel(modelId, predictions, outcomes) {
    return {
        modelId,
        sampleSize: predictions.length,
        positiveRate: mean(outcomes),
        brierScore: mean(predictions.map((prediction, index) => (prediction - (outcomes[index] ?? 0)) ** 2)),
        logLoss: mean(predictions.map((prediction, index) => {
            const y = outcomes[index] ?? 0;
            const p = clamp01(Math.max(1e-6, Math.min(1 - 1e-6, prediction)));
            return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
        })),
        meanPrediction: mean(predictions),
        calibrationError: mean(predictions.map((prediction, index) => Math.abs(prediction - (outcomes[index] ?? 0))))
    };
}
function buildSegmentedMetrics(rows) {
    const groups = new Map();
    groups.set("overall:overall", rows);
    for (const row of rows) {
        appendGroup(groups, `horizon_days:${row.horizonDays}`, row);
        appendGroup(groups, `barrier_multiplier:${row.barrierMultiplier.toFixed(2)}`, row);
    }
    return [...groups.entries()].map(([key, groupRows]) => {
        const separatorIndex = key.indexOf(":");
        const groupType = key.slice(0, separatorIndex);
        const groupId = key.slice(separatorIndex + 1);
        const outcomes = groupRows.map((row) => row.realizedHit);
        return {
            groupType,
            groupId,
            sampleSize: groupRows.length,
            rawBarrier: summarizeModel("raw_barrier", groupRows.map((row) => row.rawBarrierProbability), outcomes),
            calibratedBarrier: summarizeModel("calibrated_barrier", groupRows.map((row) => row.calibratedBarrierProbability), outcomes),
            terminalBaseline: summarizeModel("terminal_baseline", groupRows.map((row) => row.terminalBaselineProbability), outcomes)
        };
    }).sort((left, right) => `${left.groupType}:${left.groupId}`.localeCompare(`${right.groupType}:${right.groupId}`));
}
function appendGroup(groups, key, value) {
    const existing = groups.get(key);
    if (existing) {
        existing.push(value);
        return;
    }
    groups.set(key, [value]);
}
function buildVerdict(overall) {
    const raw = overall.rawBarrier;
    const calibrated = overall.calibratedBarrier;
    const terminal = overall.terminalBaseline;
    if (calibrated.brierScore < raw.brierScore && raw.brierScore < terminal.brierScore) {
        return "Calibrated first-passage barrier model outperforms both the raw barrier model and the terminal-only baseline on Brier score.";
    }
    if (raw.brierScore < terminal.brierScore) {
        return "Raw first-passage barrier modeling beats the terminal-only baseline, but calibration did not add further improvement in this sample.";
    }
    return "The current first-passage implementation does not yet clearly beat the terminal-only baseline; rethink calibration, vol estimation, or contract mapping before trusting live edges.";
}
function computeBarrierHitProbability(spot, barrier, sigma, timeYears) {
    if (spot >= barrier) {
        return 1;
    }
    const sigmaSqrtT = sigma * Math.sqrt(timeYears);
    if (sigmaSqrtT <= 0) {
        return 0;
    }
    const z = Math.log(barrier / spot) / sigmaSqrtT;
    return clamp01(2 * (1 - normalCdf(z)));
}
function computeTerminalProbability(spot, barrier, sigma, timeYears) {
    const sigmaSqrtT = Math.max(sigma * Math.sqrt(timeYears), 1e-9);
    const d2 = (Math.log(spot / barrier) - 0.5 * sigma * sigma * timeYears) / sigmaSqrtT;
    return clamp01(normalCdf(d2));
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
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function timestampId(now) {
    return now.toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
}
