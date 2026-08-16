export interface BtcRawAnchorProbabilityOptions {
    outputRoot?: string;
}
export interface BtcRawAnchorProbabilitySummary {
    outputRoot: string;
    checkedAtIso: string;
    anchorsBuilt: number;
    anchorModelVersion: string;
}
export declare function runBtcRawAnchorProbability(options?: BtcRawAnchorProbabilityOptions): Promise<BtcRawAnchorProbabilitySummary>;
