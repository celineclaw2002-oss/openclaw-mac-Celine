import type { ExecutionTemplateId } from "../shared/enums.js";
interface OpportunityCensusRow {
    groupId: string;
    groupType: "overall" | "edge_type" | "hardness_class" | "series_key" | "event_key";
    observations: number;
    grossPositive: number;
    feeAdjustedPositive: number;
    depthAdjustedPositive: number;
    grossOpportunityCount: number;
    feeAdjustedOpportunityCount: number;
    depthAdjustedOpportunityCount: number;
    grossPositiveRate: number;
    feeAdjustedPositiveRate: number;
    depthAdjustedPositiveRate: number;
    grossOpportunityRate: number;
    feeAdjustedOpportunityRate: number;
    depthAdjustedOpportunityRate: number;
    meanGrossResidual: number;
    meanNetFeeAdjustedResidual: number;
    meanDepthAdjustedResidual: number;
    meanGrossOpportunityMagnitude: number;
}
interface ExecutionScorecardRow {
    groupId?: string;
    groupType?: "overall" | "series_key" | "event_key";
    executionTemplateId: ExecutionTemplateId;
    simulations: number;
    meanEntryFillProbability: number | null;
    meanFullCompletionProbability: number | null;
    meanExpectedSlippage: number | null;
    meanPnlToClose: number | null;
    meanPnlToResolution: number | null;
    medianPnlToClose: number | null;
    medianPnlToResolution: number | null;
    positivePnlToCloseRate: number | null;
    positivePnlToResolutionRate: number | null;
}
interface InternalConsistencySemanticScorecard {
    observations: number;
    semanticSafeObservations: number;
    executionSafeObservations: number;
    observationsWithQualityFlags: number;
    semanticSafeRate: number;
    executionSafeRate: number;
    flaggedObservationRate: number;
    hardEdgeRate: number;
    edgeTypeCounts: Record<string, number>;
    hardnessCounts: Record<string, number>;
}
interface InternalConsistencyProbabilityScorecard {
    available: false;
    reason: string;
}
interface SimulationCoverageSummary {
    expectedTemplatesPerObservation: number;
    expectedSimulations: number;
    actualSimulations: number;
    coverageComplete: boolean;
}
export interface InternalConsistencyExperimentSummary {
    outputRoot: string;
    scopeNote: string;
    observations: number;
    simulations: number;
    simulationCoverage: SimulationCoverageSummary;
    semanticQuality: InternalConsistencySemanticScorecard;
    structuralOpportunity: OpportunityCensusRow[];
    executionScorecard: ExecutionScorecardRow[];
    seriesOpportunity: OpportunityCensusRow[];
    seriesExecutionScorecard: ExecutionScorecardRow[];
    probabilityScorecard: InternalConsistencyProbabilityScorecard;
    economicScorecard: ExecutionScorecardRow[];
}
export declare function runInternalConsistencyExperimentRunner(options?: {
    outputRoot?: string;
}): Promise<InternalConsistencyExperimentSummary>;
export {};
