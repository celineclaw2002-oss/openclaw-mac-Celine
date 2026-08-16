import type { BucketDefinition, CanonicalContract, ThresholdDefinition } from "../domain/contracts.js";
import type { RelationshipEdge } from "../domain/graph.js";
import { deterministicKey } from "../shared/identity.js";

export interface GraphModule {
  generateComplementEdges(contracts: CanonicalContract[], graphVersion: string): RelationshipEdge[];
  generatePartitionEdges(
    contracts: CanonicalContract[],
    buckets: BucketDefinition[],
    graphVersion: string
  ): RelationshipEdge[];
  generateThresholdLadderEdges(
    contracts: CanonicalContract[],
    thresholds: ThresholdDefinition[],
    graphVersion: string
  ): RelationshipEdge[];
  generateTemporalNestedEdges(
    contracts: CanonicalContract[],
    thresholds: ThresholdDefinition[],
    graphVersion: string
  ): RelationshipEdge[];
}

export class DeterministicGraphModule implements GraphModule {
  generateComplementEdges(contracts: CanonicalContract[], graphVersion: string): RelationshipEdge[] {
    const grouped = new Map<string, CanonicalContract[]>();
    for (const contract of contracts) {
      const key = deterministicKey([contract.eventFamilyId, normalizeQuestionStem(contract.questionText)]);
      const bucket = grouped.get(key) ?? [];
      bucket.push(contract);
      grouped.set(key, bucket);
    }
    const edges: RelationshipEdge[] = [];
    for (const group of grouped.values()) {
      if (group.length !== 2) {
        continue;
      }
      const [left, right] = group;
      if (!left || !right) {
        continue;
      }
      edges.push({
        edgeId: deterministicKey(["edge", "complement", left.contractId, right.contractId]),
        edgeType: "complement",
        sourceContractIds: [left.contractId],
        targetContractIds: [right.contractId],
        hardnessClass: "hard",
        constraintForm: "equality",
        confidenceScore: Math.min(left.semanticConfidence, right.semanticConfidence),
        ruleDependencyScore: 0.95,
        graphVersion,
        supportingEvidence: { method: "same_family_same_stem_pairing" }
      });
    }
    return edges;
  }

  generatePartitionEdges(
    contracts: CanonicalContract[],
    buckets: BucketDefinition[],
    graphVersion: string
  ): RelationshipEdge[] {
    const contractsById = new Map(contracts.map((contract) => [contract.contractId, contract]));
    const groups = new Map<string, BucketDefinition[]>();
    for (const bucket of buckets) {
      const group = groups.get(bucket.bucketGroupId) ?? [];
      group.push(bucket);
      groups.set(bucket.bucketGroupId, group);
    }
    const edges: RelationshipEdge[] = [];
    for (const [bucketGroupId, members] of groups.entries()) {
      const contractIds = members
        .map((bucket) => bucket.contractId)
        .filter((contractId) => contractsById.has(contractId));
      if (contractIds.length < 2) {
        continue;
      }
      const exhaustive = members.every((member) => member.isExhaustiveClaimed);
      if (exhaustive) {
        edges.push({
          edgeId: deterministicKey(["edge", "partition_sum", bucketGroupId]),
          edgeType: "partition_sum",
          sourceContractIds: contractIds,
          targetContractIds: [],
          hardnessClass: "hard",
          constraintForm: "sum_to_one",
          confidenceScore: Math.min(...contractIds.map((id) => contractsById.get(id)?.semanticConfidence ?? 0.5)),
          ruleDependencyScore: 0.95,
          graphVersion,
          supportingEvidence: { bucketGroupId, members: contractIds.length }
        });
      }
      for (const contractId of contractIds) {
        edges.push({
          edgeId: deterministicKey(["edge", "partition_member", bucketGroupId, contractId]),
          edgeType: "partition_member",
          sourceContractIds: [contractId],
          targetContractIds: contractIds.filter((id) => id !== contractId),
          hardnessClass: "hard",
          constraintForm: "other",
          confidenceScore: contractsById.get(contractId)?.semanticConfidence ?? 0.5,
          ruleDependencyScore: 0.9,
          graphVersion,
          supportingEvidence: { bucketGroupId }
        });
      }
    }
    return edges;
  }

  generateThresholdLadderEdges(
    contracts: CanonicalContract[],
    thresholds: ThresholdDefinition[],
    graphVersion: string
  ): RelationshipEdge[] {
    const contractsById = new Map(contracts.map((contract) => [contract.contractId, contract]));
    const grouped = new Map<string, ThresholdDefinition[]>();
    for (const threshold of thresholds) {
      const operatorFamily =
        threshold.comparisonOperator === ">" || threshold.comparisonOperator === ">=" ? "upper" : "lower";
      const key = deterministicKey([
        threshold.referenceVariable,
        threshold.evaluationTimestampMs ?? "unknown_eval_ts",
        threshold.evaluationTimezone ?? "UTC",
        operatorFamily,
        threshold.referencePriceDefinition ?? "unknown_reference_price"
      ]);
      const group = grouped.get(key) ?? [];
      group.push(threshold);
      grouped.set(key, group);
    }
    const edges: RelationshipEdge[] = [];
    for (const group of grouped.values()) {
      const sorted = [...group].sort((left, right) => left.thresholdValue - right.thresholdValue);
      for (let index = 0; index < sorted.length - 1; index += 1) {
        const left = sorted[index];
        const right = sorted[index + 1];
        if (!left || !right) {
          continue;
        }
        edges.push({
          edgeId: deterministicKey(["edge", "threshold_monotone", left.contractId, right.contractId]),
          edgeType: "threshold_monotone",
          sourceContractIds: [left.contractId],
          targetContractIds: [right.contractId],
          hardnessClass: "hard",
          constraintForm: "monotone_ineq",
          confidenceScore: Math.min(
            contractsById.get(left.contractId)?.semanticConfidence ?? 0.5,
            contractsById.get(right.contractId)?.semanticConfidence ?? 0.5
          ),
          ruleDependencyScore: 0.9,
          graphVersion,
          supportingEvidence: {
            referenceVariable: left.referenceVariable,
            evaluationTimestampMs: left.evaluationTimestampMs,
            leftThreshold: left.thresholdValue,
            rightThreshold: right.thresholdValue
          }
        });
      }
    }
    return edges;
  }

  generateTemporalNestedEdges(
    contracts: CanonicalContract[],
    thresholds: ThresholdDefinition[],
    graphVersion: string
  ): RelationshipEdge[] {
    const contractsById = new Map(contracts.map((contract) => [contract.contractId, contract]));
    const edges: RelationshipEdge[] = [];
    const grouped = new Map<string, ThresholdDefinition[]>();
    for (const threshold of thresholds) {
      const key = deterministicKey([threshold.referenceVariable, threshold.thresholdValue]);
      const group = grouped.get(key) ?? [];
      group.push(threshold);
      grouped.set(key, group);
    }
    for (const group of grouped.values()) {
      for (let index = 0; index < group.length; index += 1) {
        for (let inner = index + 1; inner < group.length; inner += 1) {
          const left = group[index];
          const right = group[inner];
          if (!left || !right || !left.evaluationTimestampMs || !right.evaluationTimestampMs) {
            continue;
          }
          const earlier = left.evaluationTimestampMs <= right.evaluationTimestampMs ? left : right;
          const later = earlier === left ? right : left;
          edges.push({
            edgeId: deterministicKey(["edge", "temporal_nested", earlier.contractId, later.contractId]),
            edgeType: "temporal_nested",
            sourceContractIds: [earlier.contractId],
            targetContractIds: [later.contractId],
            hardnessClass: "conditional",
            constraintForm: "nested_ineq",
            confidenceScore: Math.min(
              contractsById.get(earlier.contractId)?.semanticConfidence ?? 0.5,
              contractsById.get(later.contractId)?.semanticConfidence ?? 0.5
            ),
            ruleDependencyScore: 0.8,
            graphVersion,
            supportingEvidence: { thresholdValue: earlier.thresholdValue }
          });
        }
      }
    }
    return edges;
  }
}

function normalizeQuestionStem(questionText: string): string {
  return questionText
    .toLowerCase()
    .replaceAll(/will|does|the|a|an|\?|yes|no/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
