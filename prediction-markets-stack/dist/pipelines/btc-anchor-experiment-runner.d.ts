import type { ExecutionTemplateId } from "../shared/enums.js";
export interface BtcAnchorExperimentRunnerOptions {
    outputRoot?: string;
    templates?: ExecutionTemplateId[];
    residualThresholds?: number[];
}
export interface BtcAnchorExperimentRun {
    observationId: string;
    contractId: string;
    executionTemplateId: ExecutionTemplateId;
    residualThreshold: number;
    signalDirection: "buy_yes" | "buy_no";
    residualSignal: number;
    simulatedPnlToClose?: number;
    simulatedPnlToResolution?: number;
    expectedSlippage?: number;
}
export interface BtcAnchorScorecardRow {
    executionTemplateId: ExecutionTemplateId;
    residualThreshold: number;
    eligibleObservations: number;
    simulatedTrades: number;
    meanResidualSignal: number;
    meanPnlToClose?: number;
    medianPnlToClose?: number;
    meanPnlToResolution?: number;
    medianPnlToResolution?: number;
    hitRateToClose?: number;
    hitRateToResolution?: number;
}
export interface BtcAnchorExperimentSummary {
    outputRoot: string;
    scopeNote: string;
    mappedObservations: number;
    diagnosticRows: number;
    observationTimeMs?: number;
    totalObservations: number;
    evaluatedTradableObservations: number;
    tradableObservations: number;
    nonTradableObservations: number;
    skippedIneligibleObservations: number;
    experimentRuns: number;
    scorecard: BtcAnchorScorecardRow[];
}
export declare function runBtcAnchorExperimentRunner(options?: BtcAnchorExperimentRunnerOptions): Promise<BtcAnchorExperimentSummary>;
