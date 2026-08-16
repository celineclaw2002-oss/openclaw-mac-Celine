export interface BtcCaptureWindowPlanOptions {
    outputRoot?: string;
    openWarmupMinutes?: number;
    monitoringWindowMinutes?: number;
}
export interface BtcCaptureWindowRecommendation {
    action: "run_now" | "wait_for_open" | "no_visible_btc_families";
    reason: string;
    nextFamily?: string;
    nextOpenTimeMs?: number;
    nextOpenTimeIso?: string;
    recommendedCaptureStartMs?: number;
    recommendedCaptureStartIso?: string;
    recommendedCaptureEndMs?: number;
    recommendedCaptureEndIso?: string;
}
export interface BtcCaptureWindowPlanSummary {
    outputRoot: string;
    generatedAtIso: string;
    openWarmupMinutes: number;
    monitoringWindowMinutes: number;
    readiness: {
        visibleFamilies: number;
        tradableFamilies: number;
        nextOpenFamily?: string;
        nextOpenTimeMs?: number;
        nextOpenTimeIso?: string;
    };
    recommendation: BtcCaptureWindowRecommendation;
}
export declare function runBtcCaptureWindowPlan(options?: BtcCaptureWindowPlanOptions): Promise<BtcCaptureWindowPlanSummary>;
