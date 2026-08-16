export interface CoinbaseBtcSpotCaptureOptions {
    outputRoot?: string;
    productId?: string;
}
export interface CoinbaseBtcSpotCaptureSummary {
    outputRoot: string;
    productId: string;
    observationTimeMs: number;
    recordedAtMs: number;
    payloadRef: string;
    price: number;
    bid: number;
    ask: number;
    spread: number;
}
export declare function runCoinbaseBtcSpotCapture(options?: CoinbaseBtcSpotCaptureOptions): Promise<CoinbaseBtcSpotCaptureSummary>;
