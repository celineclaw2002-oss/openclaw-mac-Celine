import type { BucketDefinition, CanonicalContract, ThresholdDefinition } from "../domain/contracts.js";
import type { RelationshipEdge } from "../domain/graph.js";
export interface GraphModule {
    generateComplementEdges(contracts: CanonicalContract[], graphVersion: string): RelationshipEdge[];
    generatePartitionEdges(contracts: CanonicalContract[], buckets: BucketDefinition[], graphVersion: string): RelationshipEdge[];
    generateThresholdLadderEdges(contracts: CanonicalContract[], thresholds: ThresholdDefinition[], graphVersion: string): RelationshipEdge[];
    generateTemporalNestedEdges(contracts: CanonicalContract[], thresholds: ThresholdDefinition[], graphVersion: string): RelationshipEdge[];
}
export declare class DeterministicGraphModule implements GraphModule {
    generateComplementEdges(contracts: CanonicalContract[], graphVersion: string): RelationshipEdge[];
    generatePartitionEdges(contracts: CanonicalContract[], buckets: BucketDefinition[], graphVersion: string): RelationshipEdge[];
    generateThresholdLadderEdges(contracts: CanonicalContract[], thresholds: ThresholdDefinition[], graphVersion: string): RelationshipEdge[];
    generateTemporalNestedEdges(contracts: CanonicalContract[], thresholds: ThresholdDefinition[], graphVersion: string): RelationshipEdge[];
}
