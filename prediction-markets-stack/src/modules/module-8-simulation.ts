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

export class DeterministicSimulationModule implements SimulationModule {
  constructor(private readonly inputs: SimulationInputs) {}

  async simulateInternal(
    observationId: string,
    template: ExecutionTemplateId
  ): Promise<InternalConsistencyTradeSimulation | null> {
    const observation = this.inputs.internalObservationsById.get(observationId);
    if (!observation) {
      return null;
    }
    const fillProbability = template === "aggressive_all_legs" ? 0.95 : 0.7;
    return {
      observationId,
      executionTemplateId: template,
      entryFillProbability: fillProbability,
      fullCompletionProbability: fillProbability - 0.05,
      expectedSlippage: template === "passive_first" ? 0.5 : 1.0,
      simulatedPnlToClose: observation.depthAdjustedResidual * 0.5,
      simulatedPnlToResolution: observation.netFeeAdjustedResidual * 0.8,
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: "sim-v1",
      ...(observation.graphVersion ? { graphVersion: observation.graphVersion } : {}),
      simulationVersion: "sim-v1"
    };
  }

  async simulateAnchor(
    observationId: string,
    template: ExecutionTemplateId
  ): Promise<ExternalAnchorTradeSimulation | null> {
    const observation = this.inputs.anchorObservationsById.get(observationId);
    if (!observation) {
      return null;
    }
    const slippage = template === "aggressive_all_legs" ? 0.012 : 0.006;
    return {
      observationId,
      executionTemplateId: template,
      expectedSlippage: slippage,
      simulatedPnlToClose: observation.rawResidual - slippage,
      simulatedPnlToResolution: (observation.calibratedResidual ?? observation.rawResidual) - slippage,
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: "sim-v1",
      ...(observation.anchorModelVersion ? { anchorModelVersion: observation.anchorModelVersion } : {}),
      simulationVersion: "sim-v1"
    };
  }
}
