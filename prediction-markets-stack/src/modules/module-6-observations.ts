import type { ExternalAnchorContractObservation, InternalConsistencyEdgeObservation } from "../domain/observations.js";
import type { AnchorProbabilityState } from "../domain/anchors.js";
import type { RelationshipEdge } from "../domain/graph.js";
import type { ContractFeeState, ContractQuoteState } from "../domain/market-state.js";
import { deterministicKey } from "../shared/identity.js";

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

export class DeterministicObservationModule implements ObservationModule {
  constructor(private readonly inputs: ObservationInputs) {}

  async buildInternalEdgeObservation(
    edgeId: string,
    observationTimeMs: number
  ): Promise<InternalConsistencyEdgeObservation | null> {
    const edge = this.inputs.edgesById.get(edgeId);
    if (!edge) {
      return null;
    }
    const sourceMid = averageMid(edge.sourceContractIds, this.inputs.quotesByContractId);
    const targetMid = averageMid(edge.targetContractIds, this.inputs.quotesByContractId);
    if (sourceMid === null) {
      return null;
    }
    const theoreticalTarget = edge.edgeType === "complement" ? 100 - sourceMid : sourceMid;
    const comparison = targetMid ?? theoreticalTarget;
    const grossResidual = sourceMid - comparison;
    const avgFee = averageFee(edge.sourceContractIds, this.inputs.feeByContractId);
    return {
      observationId: deterministicKey(["obs", "internal", edgeId, observationTimeMs]),
      edgeId,
      eventFamilyId: edge.sourceContractIds[0] ?? "unknown",
      observationTimeMs,
      grossResidual,
      netFeeAdjustedResidual: grossResidual - avgFee,
      depthAdjustedResidual: grossResidual - avgFee * 1.25,
      semanticSafeFlag: edge.confidenceScore >= 0.75,
      executionSafeFlag: avgFee <= 1.5,
      qualityFlags: [],
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: "obs-v1",
      graphVersion: edge.graphVersion,
      simulationVersion: "sim-v1"
    };
  }

  async buildExternalAnchorObservation(
    contractId: string,
    observationTimeMs: number
  ): Promise<ExternalAnchorContractObservation | null> {
    const quote = this.inputs.quotesByContractId.get(contractId);
    const anchor = this.inputs.anchorsByContractId.get(contractId);
    if (!quote || !anchor) {
      return null;
    }
    const mid = midpointFromQuote(quote);
    if (mid === null) {
      return null;
    }
    const marketProbabilityMid = mid / 100;
    const rawResidual = marketProbabilityMid - anchor.rawProbability;
    return {
      observationId: deterministicKey(["obs", "anchor", contractId, observationTimeMs]),
      contractId,
      anchorFamily: anchor.anchorFamily,
      observationTimeMs,
      marketProbabilityMid,
      rawResidual,
      calibratedResidual: rawResidual - ((anchor.calibratedProbability ?? anchor.rawProbability) - anchor.rawProbability),
      uncertaintyAdjustedResidual:
        rawResidual - ((anchor.uncertaintyBandHigh ?? anchor.rawProbability) - (anchor.uncertaintyBandLow ?? anchor.rawProbability)),
      mappingSafeFlag: anchor.mappingConfidenceScore >= 0.75,
      qualityFlags: [],
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: "obs-v1",
      anchorModelVersion: "anchor-v1",
      simulationVersion: "sim-v1"
    };
  }
}

function averageMid(contractIds: string[], quotes: Map<string, ContractQuoteState>): number | null {
  const mids = contractIds
    .map((contractId) => quotes.get(contractId))
    .map((quote) => (quote ? midpointFromQuote(quote) : null))
    .filter((value): value is number => value !== null);
  if (mids.length === 0) {
    return null;
  }
  return mids.reduce((sum, value) => sum + value, 0) / mids.length;
}

function midpointFromQuote(quote: ContractQuoteState): number | null {
  if (quote.bestYesBid !== undefined && quote.bestYesAsk !== undefined) {
    return (quote.bestYesBid + quote.bestYesAsk) / 2;
  }
  if (quote.bestYesBid !== undefined) {
    return quote.bestYesBid;
  }
  if (quote.bestNoBid !== undefined) {
    return 100 - quote.bestNoBid;
  }
  return null;
}

function averageFee(contractIds: string[], fees: Map<string, ContractFeeState>): number {
  const present = contractIds.map((contractId) => fees.get(contractId)).filter(Boolean);
  if (present.length === 0) {
    return 0.5;
  }
  return 1;
}
