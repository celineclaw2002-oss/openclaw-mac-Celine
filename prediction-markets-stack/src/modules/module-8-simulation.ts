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
    const edgeMagnitude = Math.abs(observation.grossResidual);
    const baseFillProbability = observation.modeledEntryFillProbability ?? 0.55;
    const fillProbability = Math.max(
      0.05,
      Math.min(
        0.99,
        baseFillProbability +
          (template === "aggressive_all_legs" ? 0.15 : template === "hybrid_edge_tiered" ? 0.05 : -0.05)
      )
    );
    const completionProbability = Math.max(
      0,
      Math.min(0.99, fillProbability - (template === "aggressive_all_legs" ? 0.03 : 0.08))
    );
    const feeEstimate = Math.max(0, edgeMagnitude - observation.netFeeAdjustedResidual);
    const executionPenalty =
      observation.modeledExecutionPenalty ??
      Math.max(0, observation.netFeeAdjustedResidual - observation.depthAdjustedResidual);
    const feeScale = template === "aggressive_all_legs" ? 1 : template === "hybrid_edge_tiered" ? 0.85 : 0.7;
    const executionScale =
      template === "aggressive_all_legs" ? 1.15 : template === "hybrid_edge_tiered" ? 0.95 : 0.75;
    const expectedSlippage = Math.max(
      0.05,
      executionPenalty * (template === "aggressive_all_legs" ? 0.7 : template === "hybrid_edge_tiered" ? 0.55 : 0.4)
    );
    const closePnl =
      (edgeMagnitude - feeEstimate * feeScale - executionPenalty * executionScale - expectedSlippage) *
      completionProbability;
    const resolutionPnl =
      (edgeMagnitude - feeEstimate * feeScale - executionPenalty * executionScale * 0.5 - expectedSlippage * 0.5) *
      completionProbability;
    return {
      observationId,
      executionTemplateId: template,
      entryFillProbability: fillProbability,
      fullCompletionProbability: completionProbability,
      expectedSlippage,
      simulatedPnlToClose: closePnl,
      simulatedPnlToResolution: resolutionPnl,
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
    if (!observation.tradableFlag) {
      return null;
    }
    const signal = observation.calibratedResidual ?? observation.rawResidual;
    if (signal === undefined) {
      return null;
    }
    const slippage = template === "aggressive_all_legs" ? 0.012 : 0.006;
    const edgeAfterSlippage = Math.abs(signal) - slippage;
    return {
      observationId,
      executionTemplateId: template,
      expectedSlippage: slippage,
      simulatedPnlToClose: edgeAfterSlippage * 0.5,
      simulatedPnlToResolution: edgeAfterSlippage,
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: "sim-v1",
      ...(observation.anchorModelVersion ? { anchorModelVersion: observation.anchorModelVersion } : {}),
      simulationVersion: "sim-v1"
    };
  }
}
