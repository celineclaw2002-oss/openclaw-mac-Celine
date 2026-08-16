import type { AnchorFamily } from "../shared/enums.js";
import type { ReplayLineage } from "../shared/identity.js";

export interface AnchorRawSnapshot extends ReplayLineage {
  anchorFamily: AnchorFamily;
  observationTimeMs: number;
  sourceName: string;
  payloadRef: string;
  dataQualityScore: number;
}

export interface AnchorProbabilityState extends ReplayLineage {
  anchorFamily: AnchorFamily;
  contractId: string;
  observationTimeMs: number;
  rawProbability: number;
  calibratedProbability?: number;
  uncertaintyBandLow?: number;
  uncertaintyBandHigh?: number;
  mappingConfidenceScore: number;
  latencyConfidenceScore?: number;
}
