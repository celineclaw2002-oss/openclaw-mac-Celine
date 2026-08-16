import type { EdgeType, HardnessClass } from "../shared/enums.js";
export interface RelationshipEdge {
    edgeId: string;
    edgeType: EdgeType;
    sourceContractIds: string[];
    targetContractIds: string[];
    hardnessClass: HardnessClass;
    constraintForm: "equality" | "sum_to_one" | "monotone_ineq" | "nested_ineq" | "other";
    confidenceScore: number;
    ruleDependencyScore: number;
    graphVersion: string;
    supportingEvidence: Record<string, unknown>;
}
