import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { researchPlatformEndState } from "../config/research-end-state.js";
import { writeRunManifest } from "../shared/run-manifest.js";
export async function runResearchPlatformReadinessAudit(options = {}) {
    const outputRoot = options.outputRoot ?? path.resolve(process.cwd(), "data", "platform-audits");
    await mkdir(outputRoot, { recursive: true });
    const auditRows = await Promise.all(researchPlatformEndState.domains.flatMap((domain) => domain.capabilities.map(async (capability) => buildCapabilityAuditRow(domain.domainId, domain.title, capability))));
    const domainSummaries = researchPlatformEndState.domains.map((domain) => {
        const rows = auditRows.filter((row) => row.domainId === domain.domainId);
        return {
            domainId: domain.domainId,
            title: domain.title,
            researchBasis: domain.researchBasis,
            objective: domain.objective,
            capabilities: rows.length,
            completed: rows.filter((row) => row.currentStatus === "complete").length,
            inProgress: rows.filter((row) => row.currentStatus === "in_progress").length,
            planned: rows.filter((row) => row.currentStatus === "planned").length,
            averageScore: mean(rows.map((row) => row.score))
        };
    });
    const summary = {
        checkedAtIso: new Date().toISOString(),
        platformName: researchPlatformEndState.platformName,
        version: researchPlatformEndState.version,
        northStar: researchPlatformEndState.northStar,
        overallScore: mean(auditRows.map((row) => row.score)),
        completedCapabilities: auditRows.filter((row) => row.currentStatus === "complete").length,
        inProgressCapabilities: auditRows.filter((row) => row.currentStatus === "in_progress").length,
        plannedCapabilities: auditRows.filter((row) => row.currentStatus === "planned").length,
        domainSummaries,
        capabilities: auditRows,
        priorityGaps: auditRows.filter((row) => row.currentStatus !== "complete").sort((left, right) => left.score - right.score).slice(0, 6),
        recommendedProgram: buildRecommendedProgram(auditRows)
    };
    await writeFile(path.join(outputRoot, "research-platform-end-state.json"), `${JSON.stringify(researchPlatformEndState, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputRoot, "research-platform-readiness.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeRunManifest({
        pipelineId: "research-platform-readiness-audit",
        outputRoot,
        sourceArtifacts: [path.join(outputRoot, "research-platform-end-state.json"), path.join(outputRoot, "research-platform-readiness.json")],
        summary: {
            overallScore: summary.overallScore,
            completedCapabilities: summary.completedCapabilities,
            plannedCapabilities: summary.plannedCapabilities
        }
    });
    return summary;
}
async function buildCapabilityAuditRow(domainId, domainTitle, capability) {
    const checks = capabilityChecks[capability.capabilityId] ?? [];
    const auditEvidence = [];
    let passedChecks = 0;
    for (const check of checks) {
        const present = await pathExists(check.path);
        if (present) {
            passedChecks += 1;
            auditEvidence.push(`present:${check.path}`);
        }
        else {
            auditEvidence.push(`missing:${check.path}`);
        }
    }
    const currentStatus = deriveCurrentStatus(capability.status, checks.length, passedChecks);
    const score = checks.length === 0 ? statusScore(currentStatus) : Math.round((passedChecks / checks.length) * 100);
    return {
        domainId,
        domainTitle,
        capabilityId: capability.capabilityId,
        title: capability.title,
        targetStatus: capability.status,
        currentStatus,
        score,
        whyItMatters: capability.whyItMatters,
        evidence: capability.evidence,
        auditEvidence,
        nextMilestone: capability.nextMilestone
    };
}
function deriveCurrentStatus(targetStatus, checks, passedChecks) {
    if (checks > 0 && passedChecks === checks) {
        return "complete";
    }
    if (checks > 0 && passedChecks > 0) {
        return "in_progress";
    }
    return targetStatus === "complete" ? "in_progress" : targetStatus;
}
function statusScore(status) {
    if (status === "complete") {
        return 100;
    }
    if (status === "in_progress") {
        return 50;
    }
    return 0;
}
async function pathExists(target) {
    try {
        await access(path.resolve(process.cwd(), target));
        return true;
    }
    catch {
        return false;
    }
}
function buildRecommendedProgram(rows) {
    const missing = rows.filter((row) => row.currentStatus === "planned").sort((left, right) => left.score - right.score);
    const weak = rows.filter((row) => row.currentStatus === "in_progress").sort((left, right) => left.score - right.score);
    return [
        ...missing.slice(0, 3).map((row) => `Build ${row.capabilityId}: ${row.nextMilestone}`),
        ...weak.slice(0, 3).map((row) => `Harden ${row.capabilityId}: ${row.nextMilestone}`)
    ];
}
function mean(values) {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
const capabilityChecks = {
    data_multivenue_capture: [
        { path: "src/pipelines/kalshi-live-capture.ts" },
        { path: "src/pipelines/polymarket-btc-milestone-scan.ts" },
        { path: "src/pipelines/coinbase-btc-spot-capture.ts" },
        { path: "src/pipelines/deribit-btc-anchor-capture.ts" }
    ],
    data_point_in_time_replay: [
        { path: "src/pipelines/polymarket-btc-research-backfill.ts" },
        { path: "data/backtests/polymarket-btc-research-backfill/20260821T073711656Z/summaries/research-snapshot-history.json" }
    ],
    data_lineage_integrity: [
        { path: "data/kalshi-live/20260816T194330976Z/raw" },
        { path: "data/kalshi-live/20260816T194330976Z/staging" },
        { path: "data/kalshi-live/20260816T194330976Z/normalized" },
        { path: "data/kalshi-live/20260816T194330976Z/observations" }
    ],
    semantic_contract_model: [
        { path: "src/modules/module-3-normalization.ts" },
        { path: "src/domain/contracts.ts" },
        { path: "src/domain/market-state.ts" }
    ],
    semantic_relationship_graph: [
        { path: "src/modules/module-4-graph.ts" },
        { path: "src/domain/graph.ts" },
        { path: "src/pipelines/internal-consistency-experiment-runner.ts" }
    ],
    model_anchor_baselines: [
        { path: "src/pipelines/btc-raw-anchor-probability.ts" },
        { path: "src/pipelines/polymarket-btc-barrier-backtest.ts" }
    ],
    model_proper_scoring: [
        { path: "data/backtests/polymarket-btc-barrier/20260820T134713906Z/summaries/barrier-backtest-summary.json" },
        { path: "src/pipelines/polymarket-btc-paper-loop.ts" }
    ],
    model_ensemble_stack: [{ path: "src/models" }],
    sim_deterministic_execution_templates: [
        { path: "src/modules/module-8-simulation.ts" },
        { path: "src/pipelines/btc-anchor-experiment-runner.ts" },
        { path: "src/pipelines/internal-consistency-experiment-runner.ts" }
    ],
    sim_paper_loops: [
        { path: "src/pipelines/btc-paper-trading-loop.ts" },
        { path: "src/pipelines/polymarket-btc-paper-loop.ts" },
        { path: "data/paper-trading/polymarket-btc-milestone/performance-summary.json" }
    ],
    sim_historical_portfolio_replay: [{ path: "data/backtests/polymarket-btc-research-backfill/portfolio-replay" }],
    risk_overlap_controls: [
        { path: "src/pipelines/polymarket-btc-paper-loop.ts" },
        { path: "data/paper-trading/polymarket-btc-milestone/research-summary.json" }
    ],
    risk_stress_framework: [{ path: "data/stress-tests" }],
    risk_capital_allocator: [{ path: "src/portfolio" }],
    prod_artifact_provenance: [{ path: "data/run-manifests" }],
    prod_monitoring: [{ path: "data/monitoring" }],
    prod_promotion_framework: [{ path: "docs/promotion-gates.md" }]
};
