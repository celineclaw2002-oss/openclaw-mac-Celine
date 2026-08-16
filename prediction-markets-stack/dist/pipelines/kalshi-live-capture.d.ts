export interface KalshiLiveCaptureOptions {
    maxPages?: number;
    pageLimit?: number;
    maxCandidates?: number;
    maxCandidatesPerSeries?: number;
    outputRoot?: string;
    targetSeriesTickers?: string[];
}
export interface KalshiLiveCaptureSummary {
    captureStartedAtMs: number;
    captureCompletedAtMs: number;
    pagesFetched: number;
    marketsScanned: number;
    candidateMarkets: number;
    sourceEventsCaptured: number;
    discoveryRecords: number;
    metadataRecords: number;
    normalizedContracts: number;
    thresholds: number;
    buckets: number;
    graphEdges: number;
    outputRoot: string;
}
export declare function runKalshiLiveCapture(options?: KalshiLiveCaptureOptions): Promise<KalshiLiveCaptureSummary>;
