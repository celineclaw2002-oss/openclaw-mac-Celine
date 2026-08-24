import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  researchPlatformEndState,
  type EndStateCapabilityDefinition,
  type EndStateCapabilityStatus
} from "../config/research-end-state.js";
import { writeRunManifest } from "../shared/run-manifest.js";

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

interface CapabilityQualityAssessment {
  currentStatus?: EndStateCapabilityStatus;
  score?: number;
  auditEvidence?: string[];
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

export async function runResearchPlatformReadinessAudit(
  options: { outputRoot?: string } = {}
): Promise<ResearchPlatformReadinessAuditSummary> {
  const outputRoot = options.outputRoot ?? path.resolve(process.cwd(), "data", "platform-audits");
  await mkdir(outputRoot, { recursive: true });

  const auditRows = await Promise.all(
    researchPlatformEndState.domains.flatMap((domain) =>
      domain.capabilities.map(async (capability) => buildCapabilityAuditRow(domain.domainId, domain.title, capability))
    )
  );

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

  const summary: ResearchPlatformReadinessAuditSummary = {
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

async function buildCapabilityAuditRow(
  domainId: string,
  domainTitle: string,
  capability: EndStateCapabilityDefinition
): Promise<CapabilityAuditRow> {
  const checks = capabilityChecks[capability.capabilityId] ?? [];
  const auditEvidence: string[] = [];
  let passedChecks = 0;
  for (const check of checks) {
    const present = await pathExists(check.path);
    if (present) {
      passedChecks += 1;
      auditEvidence.push(`present:${check.path}`);
    } else {
      auditEvidence.push(`missing:${check.path}`);
    }
  }
  const currentStatus = deriveCurrentStatus(capability.status, checks.length, passedChecks);
  const baseScore = checks.length === 0 ? statusScore(currentStatus) : Math.round((passedChecks / checks.length) * 100);
  const quality = await assessCapabilityQuality(capability.capabilityId);
  return {
    domainId,
    domainTitle,
    capabilityId: capability.capabilityId,
    title: capability.title,
    targetStatus: capability.status,
    currentStatus: quality.currentStatus ?? currentStatus,
    score: quality.score ?? baseScore,
    whyItMatters: capability.whyItMatters,
    evidence: capability.evidence,
    auditEvidence: [...auditEvidence, ...(quality.auditEvidence ?? [])],
    nextMilestone: capability.nextMilestone
  };
}

function deriveCurrentStatus(
  targetStatus: EndStateCapabilityStatus,
  checks: number,
  passedChecks: number
): EndStateCapabilityStatus {
  if (checks > 0 && passedChecks === checks) {
    return "complete";
  }
  if (checks > 0 && passedChecks > 0) {
    return "in_progress";
  }
  return targetStatus === "complete" ? "in_progress" : targetStatus;
}

function statusScore(status: EndStateCapabilityStatus): number {
  if (status === "complete") {
    return 100;
  }
  if (status === "in_progress") {
    return 50;
  }
  return 0;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(path.resolve(process.cwd(), target));
    return true;
  } catch {
    return false;
  }
}

async function assessCapabilityQuality(capabilityId: string): Promise<CapabilityQualityAssessment> {
  switch (capabilityId) {
    case "data_point_in_time_replay": {
      const summary = await readJsonIfPresent<{
        sourceNote?: string;
        marketSurface?: string;
      }>("data/backtests/polymarket-btc-research-backfill/20260821T093859131Z/summaries/research-backfill-summary.json");
      if (!summary) {
        return {};
      }
      const sourceNote = (summary.sourceNote ?? "").toLowerCase();
      if (
        summary.marketSurface === "terminal_baseline" ||
        summary.marketSurface === "frozen_live" ||
        sourceNote.includes("synthetic") ||
        sourceNote.includes("frozen")
      ) {
        return {
          currentStatus: "in_progress",
          score: 35,
          auditEvidence: ["quality_blocker:replay_uses_synthetic_or_frozen_market_surfaces"]
        };
      }
      return {};
    }
    case "model_proper_scoring": {
      const summary = await readJsonIfPresent<{
        sourceNote?: string;
        verdict?: string;
        overall?: {
          rawBarrier?: { brierScore?: number; logLoss?: number };
          calibratedBarrier?: { brierScore?: number; logLoss?: number };
        };
      }>("data/backtests/polymarket-btc-barrier/20260820T134713906Z/summaries/barrier-backtest-summary.json");
      if (!summary) {
        return {};
      }
      const raw = summary.overall?.rawBarrier;
      const calibrated = summary.overall?.calibratedBarrier;
      if (
        raw &&
        calibrated &&
        (calibrated.brierScore ?? Number.POSITIVE_INFINITY) >= (raw.brierScore ?? Number.POSITIVE_INFINITY) &&
        (calibrated.logLoss ?? Number.POSITIVE_INFINITY) >= (raw.logLoss ?? Number.POSITIVE_INFINITY)
      ) {
        return {
          currentStatus: "in_progress",
          score: 45,
          auditEvidence: ["quality_blocker:recalibration_fails_out_of_sample_against_raw_model"]
        };
      }
      return {};
    }
    case "sim_paper_loops": {
      const performance = await readJsonIfPresent<{
        closedTrades?: number;
        loopSharpeRatio?: number;
        cumulativeReturn?: number;
        openTrades?: number;
      }>("data/paper-trading/polymarket-btc-milestone/performance-summary.json");
      if (!performance) {
        return {};
      }
      if ((performance.closedTrades ?? 0) === 0 || (performance.loopSharpeRatio ?? 0) <= 0.05) {
        return {
          currentStatus: "in_progress",
          score: 40,
          auditEvidence: ["quality_blocker:paper_loop_has_no_realized_trade_validation"]
        };
      }
      return {};
    }
    case "sim_historical_portfolio_replay": {
      const replay = await readJsonIfPresent<{
        realizedPnlCents?: number;
        maxDrawdown?: number;
        netLiquidationCents?: number;
      }>("data/backtests/polymarket-btc-research-backfill/portfolio-replay/replay-summary.json");
      if (!replay) {
        return {};
      }
      if ((replay.realizedPnlCents ?? 0) < 0 || (replay.maxDrawdown ?? 0) <= -0.1 || (replay.netLiquidationCents ?? 100_000) < 100_000) {
        return {
          currentStatus: "in_progress",
          score: 25,
          auditEvidence: ["quality_blocker:historical_portfolio_replay_is_not_economically_viable"]
        };
      }
      return {};
    }
    case "risk_overlap_controls": {
      const research = await readJsonIfPresent<{
        concentration?: { largestDirectionExposureRate?: number };
      }>("data/paper-trading/polymarket-btc-milestone/research-summary.json");
      if (!research) {
        return {};
      }
      if ((research.concentration?.largestDirectionExposureRate ?? 0) > 0.35) {
        return {
          currentStatus: "in_progress",
          score: 45,
          auditEvidence: ["quality_blocker:book_remains_concentrated_in_one_direction"]
        };
      }
      return {};
    }
    default:
      return {};
  }
}

async function readJsonIfPresent<T>(target: string): Promise<T | undefined> {
  try {
    const resolved = path.resolve(process.cwd(), target);
    return JSON.parse(await readFile(resolved, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function buildRecommendedProgram(rows: CapabilityAuditRow[]): string[] {
  const missing = rows.filter((row) => row.currentStatus === "planned").sort((left, right) => left.score - right.score);
  const weak = rows.filter((row) => row.currentStatus === "in_progress").sort((left, right) => left.score - right.score);
  return [
    ...missing.slice(0, 3).map((row) => `Build ${row.capabilityId}: ${row.nextMilestone}`),
    ...weak.slice(0, 3).map((row) => `Harden ${row.capabilityId}: ${row.nextMilestone}`)
  ];
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const capabilityChecks: Record<string, Array<{ path: string }>> = {
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
