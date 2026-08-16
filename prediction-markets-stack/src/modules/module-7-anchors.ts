import type { AnchorProbabilityState } from "../domain/anchors.js";
import { deterministicKey } from "../shared/identity.js";

export interface AnchorModule {
  buildBtcThresholdAnchor(contractId: string, observationTimeMs: number): Promise<AnchorProbabilityState | null>;
}

export interface BtcAnchorSeed {
  contractId: string;
  rawProbability: number;
  calibratedProbability?: number;
  uncertaintyBandLow?: number;
  uncertaintyBandHigh?: number;
  mappingConfidenceScore: number;
  latencyConfidenceScore?: number;
}

export class InMemoryAnchorModule implements AnchorModule {
  constructor(private readonly seedsByContractId: Map<string, BtcAnchorSeed>) {}

  async buildBtcThresholdAnchor(
    contractId: string,
    observationTimeMs: number
  ): Promise<AnchorProbabilityState | null> {
    const seed = this.seedsByContractId.get(contractId);
    if (!seed) {
      return null;
    }
    return {
      anchorFamily: "btc_thresholds",
      contractId,
      observationTimeMs,
      rawProbability: seed.rawProbability,
      ...(seed.calibratedProbability === undefined ? {} : { calibratedProbability: seed.calibratedProbability }),
      ...(seed.uncertaintyBandLow === undefined ? {} : { uncertaintyBandLow: seed.uncertaintyBandLow }),
      ...(seed.uncertaintyBandHigh === undefined ? {} : { uncertaintyBandHigh: seed.uncertaintyBandHigh }),
      mappingConfidenceScore: seed.mappingConfidenceScore,
      ...(seed.latencyConfidenceScore === undefined ? {} : { latencyConfidenceScore: seed.latencyConfidenceScore }),
      normalizationVersion: "norm-v1",
      ruleParserVersion: "rule-v1",
      feeModelVersion: "fee-v1",
      parseVersion: deterministicKey(["anchor-parse", contractId]),
      anchorModelVersion: "anchor-v1",
      calibrationVersion: "anchor-cal-v1"
    };
  }
}
