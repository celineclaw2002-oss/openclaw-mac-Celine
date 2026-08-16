export interface DeribitBtcAnchorCaptureOptions {
    outputRoot?: string;
    targetCurrency?: "BTC";
    nearExpiryCount?: number;
    strikeDistanceFraction?: number;
}
export interface DeribitBtcAnchorCaptureSummary {
    outputRoot: string;
    currency: "BTC";
    observationTimeMs: number;
    recordedAtMs: number;
    payloadRef: string;
    nearExpiryCount: number;
    strikeDistanceFraction: number;
    futuresUniverse: number;
    optionsUniverse: number;
    selectedFutures: number;
    selectedOptions: number;
    referenceSpotPrice?: number;
    referenceSpotObservationTimeMs?: number;
    referenceSpotRecordedAtMs?: number;
    referenceSpotPayloadRef?: string;
    referenceSpotAgeMs?: number;
    referenceSpotGapMs?: number;
}
export declare function runDeribitBtcAnchorCapture(options?: DeribitBtcAnchorCaptureOptions): Promise<DeribitBtcAnchorCaptureSummary>;
