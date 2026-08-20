interface ModelMetrics {
    modelId: string;
    sampleSize: number;
    positiveRate: number;
    brierScore: number;
    logLoss: number;
    meanPrediction: number;
    calibrationError: number;
}
interface SegmentMetrics {
    groupType: "overall" | "horizon_days" | "barrier_multiplier";
    groupId: string;
    sampleSize: number;
    rawBarrier: ModelMetrics;
    calibratedBarrier?: ModelMetrics;
    terminalBaseline: ModelMetrics;
}
interface IsotonicBlock {
    lowerX: number;
    upperX: number;
    fittedValue: number;
}
export interface PolymarketBtcBarrierBacktestOptions {
    outputRoot?: string;
    startIso?: string;
    endIso?: string;
    lookbackDays?: number;
    horizonDays?: number[];
    barrierMultipliers?: number[];
    trainFraction?: number;
}
export interface PolymarketBtcBarrierBacktestSummary {
    outputRoot: string;
    checkedAtIso: string;
    sourceNote: string;
    startIso: string;
    endIso: string;
    candleCount: number;
    lookbackDays: number;
    horizonDays: number[];
    barrierMultipliers: number[];
    observations: number;
    trainObservations: number;
    testObservations: number;
    overall: {
        rawBarrier: ModelMetrics;
        calibratedBarrier: ModelMetrics;
        terminalBaseline: ModelMetrics;
    };
    segmented: SegmentMetrics[];
    calibrationBlocks: IsotonicBlock[];
    verdict: string;
}
export declare function runPolymarketBtcBarrierBacktest(options?: PolymarketBtcBarrierBacktestOptions): Promise<PolymarketBtcBarrierBacktestSummary>;
export {};
