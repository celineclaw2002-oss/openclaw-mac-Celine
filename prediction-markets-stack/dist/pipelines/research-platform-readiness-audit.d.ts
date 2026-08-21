import { type EndStateCapabilityStatus } from "../config/research-end-state.js";
interface CapabilityAuditRow {
    domainId: string;
    domainTitle: string;
    capabilityId: string;
    title: string;
    targetStatus: EndStateCapabilityStatus;
    currentStatus: EndStateCapabilityStatus;
    score: number;
    whyItMatters: string;
    evidence: string[];
    auditEvidence: string[];
    nextMilestone: string;
}
interface DomainAuditSummary {
    domainId: string;
    title: string;
    researchBasis: string;
    objective: string;
    capabilities: number;
    completed: number;
    inProgress: number;
    planned: number;
    averageScore: number;
}
export interface ResearchPlatformReadinessAuditSummary {
    checkedAtIso: string;
    platformName: string;
    version: string;
    northStar: string;
    overallScore: number;
    completedCapabilities: number;
    inProgressCapabilities: number;
    plannedCapabilities: number;
    domainSummaries: DomainAuditSummary[];
    capabilities: CapabilityAuditRow[];
    priorityGaps: CapabilityAuditRow[];
    recommendedProgram: string[];
}
export declare function runResearchPlatformReadinessAudit(options?: {
    outputRoot?: string;
}): Promise<ResearchPlatformReadinessAuditSummary>;
export {};
