import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CanonicalContract } from "../domain/contracts.js";
import type { ContractQuoteState } from "../domain/market-state.js";
import type { ExternalAnchorContractObservation } from "../domain/observations.js";
import { runBtcAnchorExperimentRunner } from "./btc-anchor-experiment-runner.js";
import { runBtcAnchorResiduals } from "./btc-anchor-residuals.js";
import { runBtcObservationSession } from "./btc-observation-session.js";

type PaperSide = "yes" | "no";

interface PaperPosition {
  positionId: string;
  contractId: string;
  venueContractId: string;
  questionText: string;
  side: PaperSide;
  quantity: number;
  entryPriceCents: number;
  entryTimeMs: number;
  entryObservationId: string;
  entrySignal: number;
  lastMarkPriceCents?: number;
  lastMarkTimeMs?: number;
}

interface ClosedPaperPosition extends PaperPosition {
  exitPriceCents: number;
  exitTimeMs: number;
  exitReason: string;
  realizedPnlCents: number;
}

interface PaperPortfolioState {
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
  contractId: string;
  venueContractId: string;
  side: PaperSide;
  quantity: number;
  priceCents: number;
  signal: number;
  reason: string;
}

interface ExitAction {
  type: "exit";
  contractId: string;
  venueContractId: string;
  side: PaperSide;
  quantity: number;
  entryPriceCents: number;
  exitPriceCents: number;
  realizedPnlCents: number;
  reason: string;
}

interface HoldAction {
  type: "hold";
  contractId: string;
  venueContractId: string;
  side: PaperSide;
  quantity: number;
  signal?: number;
  markPriceCents?: number;
  reason: string;
}

export interface BtcPaperTradingLoopOptions {
  outputRoot?: string;
  portfolioRoot?: string;
  startingCashCents?: number;
  maxOpenPositions?: number;
  maxPositionNotionalCents?: number;
  entryResidualThreshold?: number;
  exitResidualThreshold?: number;
}

export interface BtcPaperTradingLoopSummary {
  outputRoot: string;
  portfolioRoot: string;
  loopTimeIso: string;
  observationSessionAction: "executed" | "reused";
  btcCaptureAction: "run_now" | "wait_for_open" | "no_visible_btc_families";
  entryResidualThreshold: number;
  exitResidualThreshold: number;
  consideredObservations: number;
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
  actions: Array<EntryAction | ExitAction | HoldAction>;
  skippedReason?: string;
}

export async function runBtcPaperTradingLoop(
  options: BtcPaperTradingLoopOptions = {}
): Promise<BtcPaperTradingLoopSummary> {
  const portfolioRoot = path.resolve(
    process.cwd(),
    options.portfolioRoot ?? path.join("data", "paper-trading", "btc-anchor")
  );
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
    observationSessionAction: options.outputRoot ? ("reused" as const) : ("executed" as const),
    btcCaptureAction: observationSession?.btcCaptureAction ?? "run_now",
    entryResidualThreshold,
    exitResidualThreshold
  };

  if (observationSession && observationSession.btcAnchorStageStatus !== "executed") {
    const portfolio = await loadPortfolioState(portfolioRoot, startingCashCents);
    portfolio.loopCount += 1;
    portfolio.updatedAtIso = new Date().toISOString();
    portfolio.lastOutputRoot = outputRoot;
    const markedOpenValue = portfolio.openPositions.reduce(
      (sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity,
      0
    );
    const blockedSummary: BtcPaperTradingLoopSummary = {
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
      netLiquidationCents: portfolio.cashCents + markedOpenValue,
      actions: [],
      skippedReason:
        observationSession.btcCaptureAction === "wait_for_open"
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
    readJsonFile<ExternalAnchorContractObservation[]>(path.join(outputRoot, "observations", "external-anchor-btc.json")),
    readJsonFile<ContractQuoteState[]>(path.join(outputRoot, "state", "quote-states.json")),
    readJsonFile<CanonicalContract[]>(path.join(outputRoot, "normalized", "contracts.json"))
  ]);

  const observationByContractId = new Map(observations.map((observation) => [observation.contractId, observation]));
  const quoteByContractId = new Map(quotes.map((quote) => [quote.contractId, quote]));
  const contractById = new Map(contracts.map((contract) => [contract.contractId, contract]));
  const loopObservationTimeMs = deriveLoopObservationTimeMs(observations, quotes);

  const portfolio = await loadPortfolioState(portfolioRoot, startingCashCents);
  portfolio.loopCount += 1;
  portfolio.updatedAtIso = new Date().toISOString();
  portfolio.lastOutputRoot = outputRoot;

  const actions: Array<EntryAction | ExitAction | HoldAction> = [];
  const remainingOpen: PaperPosition[] = [];

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
      const closed: ClosedPaperPosition = {
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
    .filter((candidate): candidate is EntryCandidate => candidate !== null)
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
    const position: PaperPosition = {
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

  const netLiquidationCents =
    portfolio.cashCents +
    portfolio.openPositions.reduce((sum, position) => sum + (position.lastMarkPriceCents ?? position.entryPriceCents) * position.quantity, 0);

  const summary: BtcPaperTradingLoopSummary = {
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
    actions
  };

  await writeLoopArtifacts(portfolioRoot, summary, portfolio);
  return summary;
}

interface EntryCandidate {
  observation: ExternalAnchorContractObservation;
  contract: CanonicalContract;
  side: PaperSide;
  signal: number;
  entryPriceCents: number;
  markPriceCents?: number;
}

function buildEntryCandidate(
  observation: ExternalAnchorContractObservation,
  quote: ContractQuoteState | undefined,
  contract: CanonicalContract | undefined
): EntryCandidate | null {
  if (!contract || !quote || !observation.tradableFlag) {
    return null;
  }
  const signal = computeSignal(observation);
  if (signal === undefined) {
    return null;
  }
  const side: PaperSide = signal >= 0 ? "no" : "yes";
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

function computeSignal(observation: ExternalAnchorContractObservation | undefined): number | undefined {
  if (!observation) {
    return undefined;
  }
  return observation.uncertaintyAdjustedResidual ?? observation.calibratedResidual ?? observation.rawResidual;
}

function classifyExitReason(
  signal: number | undefined,
  exitResidualThreshold: number,
  observation: ExternalAnchorContractObservation | undefined,
  executableExitPrice: number | undefined
): string | null {
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

function resolveExecutableEntryPrice(side: PaperSide, quote: ContractQuoteState): number | undefined {
  return side === "yes" ? quote.bestYesAsk : quote.bestNoAsk;
}

function resolveExecutableExitPrice(side: PaperSide, quote: ContractQuoteState | undefined): number | undefined {
  if (!quote) {
    return undefined;
  }
  return side === "yes" ? quote.bestYesBid : quote.bestNoBid;
}

function resolveMarkPrice(side: PaperSide, quote: ContractQuoteState | undefined): number | undefined {
  if (!quote) {
    return undefined;
  }
  if (side === "yes") {
    return midpoint(quote.bestYesBid, quote.bestYesAsk);
  }
  return midpoint(quote.bestNoBid, quote.bestNoAsk);
}

function midpoint(left: number | undefined, right: number | undefined): number | undefined {
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

function deriveLoopObservationTimeMs(
  observations: ExternalAnchorContractObservation[],
  quotes: ContractQuoteState[]
): number {
  const observationTimes = observations.map((observation) => observation.observationTimeMs);
  const quoteTimes = quotes.map((quote) => quote.quoteTimeMs);
  return Math.max(Date.now(), ...observationTimes, ...quoteTimes);
}

async function loadPortfolioState(portfolioRoot: string, startingCashCents: number): Promise<PaperPortfolioState> {
  const target = path.join(portfolioRoot, "portfolio-state.json");
  try {
    return JSON.parse(await readFile(target, "utf8")) as PaperPortfolioState;
  } catch {
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

async function writeLoopArtifacts(
  portfolioRoot: string,
  summary: BtcPaperTradingLoopSummary,
  portfolio: PaperPortfolioState | undefined
): Promise<void> {
  if (portfolio) {
    portfolio.updatedAtIso = new Date().toISOString();
    await writeFile(path.join(portfolioRoot, "portfolio-state.json"), `${JSON.stringify(portfolio, null, 2)}\n`, "utf8");
  }
  const loopTarget = path.join(portfolioRoot, "loops", `${summary.loopTimeIso.replaceAll(":", "").replaceAll(".", "")}.json`);
  await mkdir(path.dirname(loopTarget), { recursive: true });
  await writeFile(loopTarget, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(path.join(portfolioRoot, "latest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

async function readJsonFile<T>(target: string): Promise<T> {
  return JSON.parse(await readFile(target, "utf8")) as T;
}

function deterministicPositionId(contractId: string, side: PaperSide, timeMs: number): string {
  return `paper::${contractId}::${side}::${timeMs}`;
}
