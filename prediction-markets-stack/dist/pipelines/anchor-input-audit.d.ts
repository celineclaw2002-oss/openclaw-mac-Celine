export interface AnchorInputAuditOptions {
    outputRoot?: string;
    maxCrossSourceAgeMs?: number;
}
export interface AnchorInputAuditFinding {
    severity: "high" | "medium" | "low";
    code: string;
    message: string;
    evidence?: Record<string, unknown>;
}
export interface AnchorInputAuditSummary {
    outputRoot: string;
    checkedAtIso: string;
    findings: AnchorInputAuditFinding[];
}
export declare function runAnchorInputAudit(options?: AnchorInputAuditOptions): Promise<AnchorInputAuditSummary>;
