import type { ExternalAnchorContractObservation, InternalConsistencyEdgeObservation } from "../domain/observations.js";
import type { AnchorProbabilityState } from "../domain/anchors.js";
import type { RelationshipEdge } from "../domain/graph.js";
import type { ContractFeeState, ContractQuoteState } from "../domain/market-state.js";
export interface ObservationModule {
    buildInternalEdgeObservation(edgeId: string, observationTimeMs: number): Promise<InternalConsistencyEdgeObservation | null>;
    buildExternalAnchorObservation(contractId: string, observationTimeMs: number): Promise<ExternalAnchorContractObservation | null>;
}
export interface ObservationInputs {
    anchorsByContractId: Map<string, AnchorProbabilityState>;
    edgesById: Map<string, RelationshipEdge>;
    feeByContractId: Map<string, ContractFeeState>;
    quotesByContractId: Map<string, ContractQuoteState>;
}
export declare class DeterministicObservationModule implements ObservationModule {
    private readonly inputs;
    constructor(inputs: ObservationInputs);
    buildInternalEdgeObservation(edgeId: string, observationTimeMs: number): Promise<InternalConsistencyEdgeObservation | null>;
    buildExternalAnchorObservation(contractId: string, observationTimeMs: number): Promise<ExternalAnchorContractObservation | null>;
}
