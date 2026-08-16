export interface BtcAnchorResidualsOptions {
    outputRoot?: string;
}
export interface BtcAnchorResidualsSummary {
    outputRoot: string;
    mappedAnchors: number;
    diagnosticRows: number;
    observationsBuilt: number;
    tradableObservations: number;
    nonTradableAnchors: number;
    inactiveReasons: Record<string, number>;
    coverageStatus?: "no_anchor_contracts_captured" | "anchors_evaluated";
    blockerReason?: string;
    observationTimeMs?: number;
}
export declare function runBtcAnchorResiduals(options?: BtcAnchorResidualsOptions): Promise<BtcAnchorResidualsSummary>;
