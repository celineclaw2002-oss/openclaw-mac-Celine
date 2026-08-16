export interface BtcObservationSessionSummary {
    outputRoot: string;
    kalshiContracts: number;
    btcTradableFamilies: number;
    btcCaptureAction: "run_now" | "wait_for_open" | "no_visible_btc_families";
    btcNextOpenFamily?: string;
    btcNextOpenTimeIso?: string;
    btcRecommendedCaptureStartIso?: string;
    btcRecommendedCaptureEndIso?: string;
    btcAnchorStageStatus: "executed" | "skipped_pre_open";
    semanticAuditFindings: number;
    anchorInputAuditFindings: number;
    btcAnchorMappings: number;
    rawAnchorProbabilities: number;
}
export declare function runBtcObservationSession(): Promise<BtcObservationSessionSummary>;
