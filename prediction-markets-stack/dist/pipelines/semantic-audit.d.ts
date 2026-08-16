export interface SemanticAuditOptions {
    outputRoot?: string;
}
export interface SemanticAuditFinding {
    severity: "high" | "medium" | "low";
    code: string;
    message: string;
    evidence?: Record<string, unknown>;
}
export interface SemanticAuditSummary {
    outputRoot: string;
    checkedAtIso: string;
    findings: SemanticAuditFinding[];
    metrics: Record<string, number>;
}
export declare function runSemanticAudit(options?: SemanticAuditOptions): Promise<SemanticAuditSummary>;
