import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runBtcAnchorExperimentRunner } from "./btc-anchor-experiment-runner.js";
import { runBtcAnchorResiduals } from "./btc-anchor-residuals.js";
import { runBtcObservationSession } from "./btc-observation-session.js";
export async function runBtcPaperTradingLoop(options = {}) {
    const portfolioRoot = path.resolve(process.cwd(), options.portfolioRoot ?? path.join("data", "paper-trading", "btc-anchor"));
    await mkdir(portfolioRoot, { recursive: true });
    const startingCashCents = options.startingCashCents ?? 100_000;
    const maxOpenPositions = options.maxOpenPositions ?? 4;
    const maxPositionNotionalCents = options.maxPositionNotionalCents ?? 12_500;
    const entryResidualThreshold = options.entryResidualThreshold ?? 0.035;
    const exitResidualThreshold = options.exitResidualThreshold ?? 0.012;
    const observationSession = options.outputRoot ? undefined : await runBtcObservationSession();
    const outputRoot = options.outputRoot ?? observationSession?.outputRoot;
    if (!outputRoot) {
        throw new Error("Unable to resolve an output root for the BTC paper trading loop.");
    }
    const baseSummary = {
        outputRoot,
        portfolioRoot,
        loopTimeIso: new Date().toISOString(),
        observationSessionAction: options.outputRoot ? "reused" : "executed",
        btcCaptureAction: observationSession?.btcCaptureAction ?? "run_now",
        entryResidualThreshold,
        exitResidualThreshold
    };
    if (observationSession && observationSession.btcAnchorStageStatus !== "executed") {
        const portfolio = await loadPortfolioState(portfolioRoot, startingCashCents);
        portfolio.loopCount += 1;
        portfolio.updatedAtIso = new Date().toISOString();
        portfolio.lastOutputRoot = outputRoot;
        const markedOpenValue = portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
        const netExposureCents = portfolio.openPositions.reduce((sum, position) => sum +
            (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
        const netLiquidationCents = portfolio.cashCents + markedOpenValue;
        const performance = await buildPerformanceSnapshot({
            portfolioRoot,
            currentSummary: {
                loopTimeIso: baseSummary.loopTimeIso,
                netLiquidationCents,
                grossTradedNotionalCents: 0,
                grossExposureRate: ratio(markedOpenValue, netLiquidationCents),
                netExposureRate: ratio(netExposureCents, netLiquidationCents)
            },
            portfolio,
            initialCapitalCents: startingCashCents
        });
        const blockedSummary = {
            ...baseSummary,
            consideredObservations: 0,
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
            performance,
            actions: [],
            skippedReason: observationSession.btcCaptureAction === "wait_for_open"
                ? "BTC families are not open yet, so the paper loop did not stage trades."
                : "No visible BTC families were captured, so the paper loop had nothing to trade."
        };
        await writeLoopArtifacts(portfolioRoot, blockedSummary, portfolio);
        return blockedSummary;
    }
    await runBtcAnchorResiduals({ outputRoot });
    await runBtcAnchorExperimentRunner({
        outputRoot,
        residualThresholds: [entryResidualThreshold],
        templates: ["hybrid_edge_tiered"]
    });
    const [observations, quotes, contracts] = await Promise.all([
        readJsonFile(path.join(outputRoot, "observations", "external-anchor-btc.json")),
        readJsonFile(path.join(outputRoot, "state", "quote-states.json")),
        readJsonFile(path.join(outputRoot, "normalized", "contracts.json"))
    ]);
    const observationByContractId = new Map(observations.map((observation) => [observation.contractId, observation]));
    const quoteByContractId = new Map(quotes.map((quote) => [quote.contractId, quote]));
    const contractById = new Map(contracts.map((contract) => [contract.contractId, contract]));
    const loopObservationTimeMs = deriveLoopObservationTimeMs(observations, quotes);
    const portfolio = await loadPortfolioState(portfolioRoot, startingCashCents);
    portfolio.loopCount += 1;
    portfolio.updatedAtIso = new Date().toISOString();
    portfolio.lastOutputRoot = outputRoot;
    const actions = [];
    const remainingOpen = [];
    for (const position of portfolio.openPositions) {
        const quote = quoteByContractId.get(position.contractId);
        const observation = observationByContractId.get(position.contractId);
        const executableExitPrice = resolveExecutableExitPrice(position.side, quote);
        const markPrice = resolveMarkPrice(position.side, quote);
        const signal = computeSignal(observation);
        const exitReason = classifyExitReason(signal, exitResidualThreshold, observation, executableExitPrice);
        if (markPrice !== undefined) {
            position.lastMarkPriceCents = markPrice;
            position.lastMarkTimeMs = loopObservationTimeMs;
        }
        if (exitReason && executableExitPrice !== undefined) {
            const realizedPnlCents = (executableExitPrice - position.entryPriceCents) * position.quantity;
            portfolio.cashCents += executableExitPrice * position.quantity;
            portfolio.realizedPnlCents += realizedPnlCents;
            const closed = {
                ...position,
                exitPriceCents: executableExitPrice,
                exitTimeMs: loopObservationTimeMs,
                exitReason,
                realizedPnlCents
            };
            portfolio.closedPositions.push(closed);
            actions.push({
                type: "exit",
                contractId: position.contractId,
                venueContractId: position.venueContractId,
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
            contractId: position.contractId,
            venueContractId: position.venueContractId,
            side: position.side,
            quantity: position.quantity,
            ...(signal === undefined ? {} : { signal }),
            ...(markPrice === undefined ? {} : { markPriceCents: markPrice }),
            reason: exitReason ? `${exitReason}_blocked_by_missing_exit_quote` : "position_still_valid"
        });
    }
    portfolio.openPositions = remainingOpen;
    const rankedCandidates = observations
        .map((observation) => buildEntryCandidate(observation, quoteByContractId.get(observation.contractId), contractById.get(observation.contractId)))
        .filter((candidate) => candidate !== null)
        .filter((candidate) => candidate.observation.mappingSafeFlag)
        .filter((candidate) => Math.abs(candidate.signal) >= entryResidualThreshold)
        .filter((candidate) => !portfolio.openPositions.some((position) => position.contractId === candidate.observation.contractId))
        .sort((left, right) => Math.abs(right.signal) - Math.abs(left.signal));
    for (const candidate of rankedCandidates) {
        if (portfolio.openPositions.length >= maxOpenPositions) {
            break;
        }
        const quantity = Math.max(1, Math.floor(maxPositionNotionalCents / Math.max(candidate.entryPriceCents, 1)));
        const costCents = quantity * candidate.entryPriceCents;
        if (costCents > portfolio.cashCents) {
            continue;
        }
        const contract = candidate.contract;
        const observation = candidate.observation;
        const position = {
            positionId: deterministicPositionId(observation.contractId, candidate.side, loopObservationTimeMs),
            contractId: observation.contractId,
            venueContractId: contract.venueContractId,
            questionText: contract.questionText,
            side: candidate.side,
            quantity,
            entryPriceCents: candidate.entryPriceCents,
            entryTimeMs: loopObservationTimeMs,
            entryObservationId: observation.observationId,
            entrySignal: candidate.signal,
            ...(candidate.markPriceCents === undefined ? {} : { lastMarkPriceCents: candidate.markPriceCents }),
            ...(candidate.markPriceCents === undefined ? {} : { lastMarkTimeMs: loopObservationTimeMs })
        };
        portfolio.cashCents -= costCents;
        portfolio.openPositions.push(position);
        actions.push({
            type: "entry",
            contractId: observation.contractId,
            venueContractId: contract.venueContractId,
            side: candidate.side,
            quantity,
            priceCents: candidate.entryPriceCents,
            signal: candidate.signal,
            reason: "signal_above_entry_threshold"
        });
    }
    const unrealizedPnlCents = portfolio.openPositions.reduce((sum, position) => {
        const markPrice = position.lastMarkPriceCents;
        if (markPrice === undefined) {
            return sum;
        }
        return sum + (markPrice - position.entryPriceCents) * position.quantity;
    }, 0);
    const netLiquidationCents = portfolio.cashCents +
        portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const entryNotionalCents = actions
        .filter((action) => action.type === "entry")
        .reduce((sum, action) => sum + action.priceCents * action.quantity, 0);
    const exitNotionalCents = actions
        .filter((action) => action.type === "exit")
        .reduce((sum, action) => sum + action.exitPriceCents * action.quantity, 0);
    const grossTradedNotionalCents = entryNotionalCents + exitNotionalCents;
    const grossExposureCents = portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const netExposureCents = portfolio.openPositions.reduce((sum, position) => sum +
        (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const performance = await buildPerformanceSnapshot({
        portfolioRoot,
        currentSummary: {
            loopTimeIso: baseSummary.loopTimeIso,
            netLiquidationCents,
            grossTradedNotionalCents,
            grossExposureRate: ratio(grossExposureCents, netLiquidationCents),
            netExposureRate: ratio(netExposureCents, netLiquidationCents)
        },
        portfolio,
        initialCapitalCents: startingCashCents
    });
    const summary = {
        ...baseSummary,
        consideredObservations: observations.length,
        eligibleEntries: rankedCandidates.length,
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
        performance,
        actions
    };
    await writeLoopArtifacts(portfolioRoot, summary, portfolio);
    return summary;
}
function buildEntryCandidate(observation, quote, contract) {
    if (!contract || !quote || !observation.tradableFlag) {
        return null;
    }
    const signal = computeSignal(observation);
    if (signal === undefined) {
        return null;
    }
    const side = signal >= 0 ? "no" : "yes";
    const entryPriceCents = resolveExecutableEntryPrice(side, quote);
    if (entryPriceCents === undefined) {
        return null;
    }
    const markPriceCents = resolveMarkPrice(side, quote);
    return {
        observation,
        contract,
        side,
        signal,
        entryPriceCents,
        ...(markPriceCents === undefined ? {} : { markPriceCents })
    };
}
function computeSignal(observation) {
    if (!observation) {
        return undefined;
    }
    return observation.uncertaintyAdjustedResidual ?? observation.calibratedResidual ?? observation.rawResidual;
}
function classifyExitReason(signal, exitResidualThreshold, observation, executableExitPrice) {
    if (!observation || !observation.tradableFlag || !observation.mappingSafeFlag) {
        return "observation_no_longer_tradable";
    }
    if (signal === undefined) {
        return "signal_missing";
    }
    if (Math.abs(signal) <= exitResidualThreshold) {
        return "signal_mean_reverted";
    }
    if (executableExitPrice === undefined) {
        return "missing_exit_quote";
    }
    return null;
}
function resolveExecutableEntryPrice(side, quote) {
    return side === "yes" ? quote.bestYesAsk : quote.bestNoAsk;
}
function resolveExecutableExitPrice(side, quote) {
    if (!quote) {
        return undefined;
    }
    return side === "yes" ? quote.bestYesBid : quote.bestNoBid;
}
function resolveMarkPrice(side, quote) {
    if (!quote) {
        return undefined;
    }
    if (side === "yes") {
        return midpoint(quote.bestYesBid, quote.bestYesAsk);
    }
    return midpoint(quote.bestNoBid, quote.bestNoAsk);
}
function midpoint(left, right) {
    if (left === undefined && right === undefined) {
        return undefined;
    }
    if (left === undefined) {
        return right;
    }
    if (right === undefined) {
        return left;
    }
    return (left + right) / 2;
}
function deriveLoopObservationTimeMs(observations, quotes) {
    const observationTimes = observations.map((observation) => observation.observationTimeMs);
    const quoteTimes = quotes.map((quote) => quote.quoteTimeMs);
    return Math.max(Date.now(), ...observationTimes, ...quoteTimes);
}
async function loadPortfolioState(portfolioRoot, startingCashCents) {
    const target = path.join(portfolioRoot, "portfolio-state.json");
    try {
        return JSON.parse(await readFile(target, "utf8"));
    }
    catch {
        return {
            strategyId: "btc-anchor-paper-v1",
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
async function writeLoopArtifacts(portfolioRoot, summary, portfolio) {
    if (portfolio) {
        portfolio.updatedAtIso = new Date().toISOString();
        await writeFile(path.join(portfolioRoot, "portfolio-state.json"), `${JSON.stringify(portfolio, null, 2)}\n`, "utf8");
    }
    const loopTarget = path.join(portfolioRoot, "loops", `${summary.loopTimeIso.replaceAll(":", "").replaceAll(".", "")}.json`);
    await mkdir(path.dirname(loopTarget), { recursive: true });
    await writeFile(loopTarget, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(path.join(portfolioRoot, "latest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(path.join(portfolioRoot, "performance-summary.json"), `${JSON.stringify(summary.performance, null, 2)}\n`, "utf8");
}
async function readJsonFile(target) {
    return JSON.parse(await readFile(target, "utf8"));
}
function deterministicPositionId(contractId, side, timeMs) {
    return `paper::${contractId}::${side}::${timeMs}`;
}
async function buildPerformanceSnapshot(inputs) {
    const history = await loadHistoricalLoopSnapshots(inputs.portfolioRoot);
    const ordered = [...history, inputs.currentSummary].sort((left, right) => left.loopTimeIso.localeCompare(right.loopTimeIso));
    const returns = ordered.slice(1).map((point, index) => {
        const prior = ordered[index];
        if (!prior || prior.netLiquidationCents === 0) {
            return 0;
        }
        return point.netLiquidationCents / prior.netLiquidationCents - 1;
    });
    const cumulativeReturn = inputs.currentSummary.netLiquidationCents / inputs.initialCapitalCents - 1;
    const realizedReturn = inputs.portfolio.realizedPnlCents / inputs.initialCapitalCents;
    const unrealizedValue = inputs.portfolio.openPositions.reduce((sum, position) => {
        const markPrice = position.lastMarkPriceCents ?? position.entryPriceCents;
        return sum + (markPrice - position.entryPriceCents) * position.quantity;
    }, 0);
    const unrealizedReturn = unrealizedValue / inputs.initialCapitalCents;
    const grossTradedNotionalCents = ordered.reduce((sum, point) => sum + (point.grossTradedNotionalCents ?? 0), 0);
    const averageNetLiq = mean(ordered.map((point) => point.netLiquidationCents));
    const turnoverRatio = averageNetLiq === 0 ? 0 : grossTradedNotionalCents / averageNetLiq;
    const currentGrossExposureCents = inputs.portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const currentNetExposureCents = inputs.portfolio.openPositions.reduce((sum, position) => sum +
        (position.side === "yes" ? 1 : -1) * (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);
    const wins = inputs.portfolio.closedPositions.filter((position) => position.realizedPnlCents > 0);
    const losses = inputs.portfolio.closedPositions.filter((position) => position.realizedPnlCents < 0);
    const grossProfit = wins.reduce((sum, position) => sum + position.realizedPnlCents, 0);
    const grossLoss = losses.reduce((sum, position) => sum + Math.abs(position.realizedPnlCents), 0);
    const averageHoldingMinutes = mean(inputs.portfolio.closedPositions.map((position) => (position.exitTimeMs - position.entryTimeMs) / 60_000));
    return {
        initialCapitalCents: inputs.initialCapitalCents,
        loopCount: ordered.length,
        closedTrades: inputs.portfolio.closedPositions.length,
        openTrades: inputs.portfolio.openPositions.length,
        grossTradedNotionalCents,
        turnoverRatio,
        currentGrossExposureCents,
        currentNetExposureCents,
        currentGrossExposureRate: ratio(currentGrossExposureCents, inputs.currentSummary.netLiquidationCents),
        currentNetExposureRate: ratio(currentNetExposureCents, inputs.currentSummary.netLiquidationCents),
        cumulativeReturn,
        realizedReturn,
        unrealizedReturn,
        maxDrawdown: computeMaxDrawdown(ordered.map((point) => point.netLiquidationCents)),
        ...(wins.length + losses.length === 0 ? {} : { winRate: ratio(wins.length, wins.length + losses.length) }),
        ...(wins.length === 0 ? {} : { averageWinCents: mean(wins.map((position) => position.realizedPnlCents)) }),
        ...(losses.length === 0 ? {} : { averageLossCents: mean(losses.map((position) => position.realizedPnlCents)) }),
        ...(grossLoss === 0 ? {} : { profitFactor: grossProfit / grossLoss }),
        ...(inputs.portfolio.closedPositions.length === 0 ? {} : { averageHoldingMinutes }),
        ...(returns.length < 2 ? {} : { loopSharpeRatio: computeSharpeRatio(returns) }),
        ...(returns.filter((value) => value < 0).length === 0 ? {} : { loopSortinoRatio: computeSortinoRatio(returns) })
    };
}
async function loadHistoricalLoopSnapshots(portfolioRoot) {
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
    const downsideDeviation = sampleStdDev(downside);
    if (downsideDeviation === 0) {
        return 0;
    }
    return mean(returns) / downsideDeviation * Math.sqrt(returns.length);
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
    const variance = values.reduce((sum, value) => sum + (value - average) * (value - average), 0) / (values.length - 1);
    return Math.sqrt(Math.max(variance, 0));
}
function ratio(numerator, denominator) {
    if (denominator === 0) {
        return 0;
    }
    return numerator / denominator;
}
