import type { ContractExecutionState, ContractFeeState, ContractLifecycleState, ContractQuoteState } from "../domain/market-state.js";
import type { BookStageRecord, LifecycleFeeStageRecord, TradeTickerStageRecord } from "../domain/source-events.js";
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
export declare class InMemoryStateViewsModule implements StateViewsModule {
    private readonly store;
    constructor(store: InMemoryStateViewStore);
    buildQuoteState(contractId: string, quoteTimeMs: number): Promise<ContractQuoteState | null>;
    buildLifecycleState(contractId: string, stateTimeMs: number): Promise<ContractLifecycleState | null>;
    buildFeeState(contractId: string, stateTimeMs: number): Promise<ContractFeeState | null>;
    buildExecutionState(contractId: string, stateTimeMs: number): Promise<ContractExecutionState | null>;
}
