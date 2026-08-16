export interface DemoSummary {
    sourceEventsCaptured: number;
    normalizedContracts: number;
    thresholdCount: number;
    bucketCount: number;
    complementEdges: number;
    partitionEdges: number;
    thresholdEdges: number;
}
export declare function runKalshiBtcThresholdDemo(): Promise<DemoSummary>;
