export class DeterministicSimulationModule {
    inputs;
    constructor(inputs) {
        this.inputs = inputs;
    }
    async simulateInternal(observationId, template) {
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
    async simulateAnchor(observationId, template) {
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
