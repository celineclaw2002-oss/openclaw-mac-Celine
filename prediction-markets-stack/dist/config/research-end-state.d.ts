export type EndStateCapabilityStatus = "planned" | "in_progress" | "complete";
export interface EndStateCapabilityDefinition {
    capabilityId: string;
    title: string;
    whyItMatters: string;
    status: EndStateCapabilityStatus;
    evidence: string[];
    nextMilestone: string;
}
export interface EndStateDomainDefinition {
    domainId: string;
    title: string;
    researchBasis: string;
    objective: string;
    capabilities: EndStateCapabilityDefinition[];
}
export interface ResearchPlatformEndStateDefinition {
    version: string;
    platformName: string;
    northStar: string;
    endStateDefinition: string;
    domains: EndStateDomainDefinition[];
}
export declare const researchPlatformEndState: ResearchPlatformEndStateDefinition;
