import type { ExecutionTemplateId } from "../shared/enums.js";
import type { ReplayLineage } from "../shared/identity.js";

export interface InternalConsistencyEdgeObservation extends ReplayLineage {
  observationId: string;
  edgeId: string;
  eventFamilyId: string;
  observationTimeMs: number;
  grossResidual: number;
  netFeeAdjustedResidual: number;
  depthAdjustedResidual: number;
  averageQuoteQuality?: number;
  modeledEntryFillProbability?: number;
  modeledExecutionPenalty?: number;
  semanticSafeFlag: boolean;
  executionSafeFlag: boolean;
  qualityFlags: string[];
}

export interface InternalConsistencyTradeSimulation extends ReplayLineage {
  observationId: string;
  executionTemplateId: ExecutionTemplateId;
  entryFillProbability?: number;
  fullCompletionProbability?: number;
  expectedSlippage?: number;
  simulatedPnlToClose?: number;
  simulatedPnlToResolution?: number;
}

export interface ExternalAnchorContractObservation extends ReplayLineage {
  observationId: string;
  contractId: string;
  anchorFamily: string;
  observationTimeMs: number;
  marketProbabilityMid?: number;
  rawResidual?: number;
  calibratedResidual?: number;
  uncertaintyAdjustedResidual?: number;
  mappingSafeFlag: boolean;
  tradableFlag: boolean;
  marketStatus?: string;
  openTimeMs?: number;
  eligibilityReason?: string;
  qualityFlags: string[];
}

export interface ExternalAnchorTradeSimulation extends ReplayLineage {
  observationId: string;
  executionTemplateId: ExecutionTemplateId;
  expectedSlippage?: number;
  simulatedPnlToClose?: number;
  simulatedPnlToResolution?: number;
}
