import type { ExternalAnchorTradeSimulation, InternalConsistencyTradeSimulation } from "../domain/observations.js";
import type { ExecutionTemplateId } from "../shared/enums.js";
import type { ExternalAnchorContractObservation, InternalConsistencyEdgeObservation } from "../domain/observations.js";
export interface SimulationModule {
    simulateInternal(observationId: string, template: ExecutionTemplateId): Promise<InternalConsistencyTradeSimulation | null>;
    simulateAnchor(observationId: string, template: ExecutionTemplateId): Promise<ExternalAnchorTradeSimulation | null>;
}
export interface SimulationInputs {
    anchorObservationsById: Map<string, ExternalAnchorContractObservation>;
    internalObservationsById: Map<string, InternalConsistencyEdgeObservation>;
}
export declare class DeterministicSimulationModule implements SimulationModule {
    private readonly inputs;
    constructor(inputs: SimulationInputs);
    simulateInternal(observationId: string, template: ExecutionTemplateId): Promise<InternalConsistencyTradeSimulation | null>;
    simulateAnchor(observationId: string, template: ExecutionTemplateId): Promise<ExternalAnchorTradeSimulation | null>;
}
