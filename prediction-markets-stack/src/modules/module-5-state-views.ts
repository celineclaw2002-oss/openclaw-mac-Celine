import type { ContractExecutionState, ContractFeeState, ContractLifecycleState, ContractQuoteState } from "../domain/market-state.js";
import type {
  BookStageRecord,
  LifecycleFeeStageRecord,
  TradeTickerStageRecord
} from "../domain/source-events.js";
import { deterministicKey } from "../shared/identity.js";

export interface StateViewsModule {
  buildQuoteState(contractId: string, quoteTimeMs: number): Promise<ContractQuoteState | null>;
  buildLifecycleState(contractId: string, stateTimeMs: number): Promise<ContractLifecycleState | null>;
  buildFeeState(contractId: string, stateTimeMs: number): Promise<ContractFeeState | null>;
  buildExecutionState(contractId: string, stateTimeMs: number): Promise<ContractExecutionState | null>;
}

export interface InMemoryStateViewStore {
  booksByContractId: Map<string, BookStageRecord>;
  lifecycleByContractId: Map<string, LifecycleFeeStageRecord>;
  tickerByContractId: Map<string, TradeTickerStageRecord>;
}

export class InMemoryStateViewsModule implements StateViewsModule {
  constructor(private readonly store: InMemoryStateViewStore) {}

  async buildQuoteState(contractId: string, quoteTimeMs: number): Promise<ContractQuoteState | null> {
    const book = this.store.booksByContractId.get(contractId);
    const ticker = this.store.tickerByContractId.get(contractId);
    if (!book && !ticker) {
      return null;
    }
    const bestYesBid = book?.yesBids[0]?.[0] ?? ticker?.bestYesBid;
    const bestNoBid = book?.noBids[0]?.[0] ?? ticker?.bestNoBid;
    const bestYesAsk = bestNoBid === undefined ? undefined : 100 - bestNoBid;
    const bestNoAsk = bestYesBid === undefined ? undefined : 100 - bestYesBid;
    return {
      contractId,
      quoteTimeMs,
      ...(bestYesBid === undefined ? {} : { bestYesBid }),
      ...(bestYesAsk === undefined ? {} : { bestYesAsk }),
      ...(bestNoBid === undefined ? {} : { bestNoBid }),
      ...(bestNoAsk === undefined ? {} : { bestNoAsk }),
      depthLevels: {
        yesBids: book?.yesBids ?? [],
        noBids: book?.noBids ?? []
      },
      quoteQualityScore: bestYesBid === undefined ? 0.2 : 0.9,
      derivedQuoteFlags: [...(book?.qualityFlags ?? []), ...(ticker?.qualityFlags ?? [])],
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: book?.parseVersion ?? ticker?.parseVersion ?? "unknown"
    };
  }

  async buildLifecycleState(contractId: string, stateTimeMs: number): Promise<ContractLifecycleState | null> {
    const lifecycle = this.store.lifecycleByContractId.get(contractId);
    if (!lifecycle) {
      return null;
    }
    return {
      contractId,
      stateTimeMs,
      normalizedStatus: normalizeLifecycleStatus(lifecycle.rawStatus),
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: lifecycle.parseVersion
    };
  }

  async buildFeeState(contractId: string, stateTimeMs: number): Promise<ContractFeeState | null> {
    const lifecycle = this.store.lifecycleByContractId.get(contractId);
    if (!lifecycle) {
      return null;
    }
    return {
      contractId,
      stateTimeMs,
      feeScheduleId: lifecycle.feeScheduleId ?? deterministicKey(["fee", "default", contractId]),
      feeFormulaType: "kalshi-default",
      feeParameters: lifecycle.feeConfig,
      roundingRules: { unit: "cent" },
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: lifecycle.parseVersion
    };
  }

  async buildExecutionState(contractId: string, stateTimeMs: number): Promise<ContractExecutionState | null> {
    const ticker = this.store.tickerByContractId.get(contractId);
    const book = this.store.booksByContractId.get(contractId);
    if (!ticker && !book) {
      return null;
    }
    const yesDepth = sumDepth(book?.yesBids);
    const noDepth = sumDepth(book?.noBids);
    const totalDepth = yesDepth + noDepth;
    return {
      contractId,
      stateTimeMs,
      ...(totalDepth === 0 ? {} : { orderBookImbalance: (yesDepth - noDepth) / totalDepth }),
      ...(totalDepth === 0 ? {} : { depthAsymmetry: Math.abs(yesDepth - noDepth) / totalDepth }),
      ...(ticker?.volume === undefined ? {} : { tradeIntensityShort: ticker.volume }),
      ...(ticker?.openInterest === undefined ? {} : { queueEstimationConfidence: Math.min(1, ticker.openInterest / 1000) }),
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: ticker?.parseVersion ?? book?.parseVersion ?? "unknown"
    };
  }
}

function sumDepth(levels: Array<[price: number, size: number]> | undefined): number {
  if (!levels) {
    return 0;
  }
  return levels.reduce((sum, [, size]) => sum + size, 0);
}

function normalizeLifecycleStatus(rawStatus: string | undefined): ContractLifecycleState["normalizedStatus"] {
  switch (rawStatus?.toLowerCase()) {
    case "active":
    case "open":
      return "active";
    case "closed":
      return "closed";
    case "finalized":
      return "finalized";
    default:
      return "listed";
  }
}
