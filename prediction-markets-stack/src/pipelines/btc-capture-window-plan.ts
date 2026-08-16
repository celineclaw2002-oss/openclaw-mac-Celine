import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { runBtcMarketReadinessAudit, type BtcMarketReadinessAuditSummary } from "./btc-market-readiness-audit.js";

export interface BtcCaptureWindowPlanOptions {
  outputRoot?: string;
  openWarmupMinutes?: number;
  monitoringWindowMinutes?: number;
}

export interface BtcCaptureWindowRecommendation {
  action: "run_now" | "wait_for_open" | "no_visible_btc_families";
  reason: string;
  nextFamily?: string;
  nextOpenTimeMs?: number;
  nextOpenTimeIso?: string;
  recommendedCaptureStartMs?: number;
  recommendedCaptureStartIso?: string;
  recommendedCaptureEndMs?: number;
  recommendedCaptureEndIso?: string;
}

export interface BtcCaptureWindowPlanSummary {
  outputRoot: string;
  generatedAtIso: string;
  openWarmupMinutes: number;
  monitoringWindowMinutes: number;
  readiness: {
    visibleFamilies: number;
    tradableFamilies: number;
    nextOpenFamily?: string;
    nextOpenTimeMs?: number;
    nextOpenTimeIso?: string;
  };
  recommendation: BtcCaptureWindowRecommendation;
}

export async function runBtcCaptureWindowPlan(
  options: BtcCaptureWindowPlanOptions = {}
): Promise<BtcCaptureWindowPlanSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const openWarmupMinutes = options.openWarmupMinutes ?? 5;
  const monitoringWindowMinutes = options.monitoringWindowMinutes ?? 120;
  const readiness = await loadOrBuildReadiness(outputRoot);

  const recommendation = buildRecommendation(readiness, openWarmupMinutes, monitoringWindowMinutes);
  const summary: BtcCaptureWindowPlanSummary = {
    outputRoot,
    generatedAtIso: new Date().toISOString(),
    openWarmupMinutes,
    monitoringWindowMinutes,
    readiness: {
      visibleFamilies: readiness.visibleFamilies,
      tradableFamilies: readiness.tradableFamilies,
      ...(readiness.nextOpenFamily ? { nextOpenFamily: readiness.nextOpenFamily } : {}),
      ...(readiness.nextOpenTimeMs ? { nextOpenTimeMs: readiness.nextOpenTimeMs } : {}),
      ...(readiness.nextOpenTimeIso ? { nextOpenTimeIso: readiness.nextOpenTimeIso } : {})
    },
    recommendation
  };

  await writeFile(
    path.join(outputRoot, "summaries", "btc-capture-window-plan.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );

  return summary;
}

async function loadOrBuildReadiness(outputRoot: string): Promise<BtcMarketReadinessAuditSummary> {
  const target = path.join(outputRoot, "summaries", "btc-market-readiness.json");
  try {
    return JSON.parse(await readFile(target, "utf8")) as BtcMarketReadinessAuditSummary;
  } catch {
    return runBtcMarketReadinessAudit({ outputRoot });
  }
}

function buildRecommendation(
  readiness: BtcMarketReadinessAuditSummary,
  openWarmupMinutes: number,
  monitoringWindowMinutes: number
): BtcCaptureWindowRecommendation {
  if (readiness.tradableFamilies > 0) {
    return {
      action: "run_now",
      reason: "At least one BTC family is tradable in the current slice, so the external-anchor sleeve can be evaluated immediately.",
      ...(readiness.bestTradableFamily ? { nextFamily: readiness.bestTradableFamily } : {})
    };
  }

  if (!readiness.nextOpenTimeMs || !readiness.nextOpenFamily) {
    return {
      action: "no_visible_btc_families",
      reason: "No visible BTC family with a known next-open time was found in the current slice."
    };
  }

  const recommendedCaptureStartMs = readiness.nextOpenTimeMs + openWarmupMinutes * 60_000;
  const recommendedCaptureEndMs = recommendedCaptureStartMs + monitoringWindowMinutes * 60_000;
  return {
    action: "wait_for_open",
    reason:
      "Visible BTC families are still pre-open. The next meaningful anchor run should start shortly after the next family opens, once live tradable quotes can form.",
    nextFamily: readiness.nextOpenFamily,
    nextOpenTimeMs: readiness.nextOpenTimeMs,
    ...(readiness.nextOpenTimeIso ? { nextOpenTimeIso: readiness.nextOpenTimeIso } : {}),
    recommendedCaptureStartMs,
    recommendedCaptureStartIso: new Date(recommendedCaptureStartMs).toISOString(),
    recommendedCaptureEndMs,
    recommendedCaptureEndIso: new Date(recommendedCaptureEndMs).toISOString()
  };
}

async function resolveLatestCaptureRoot(cwd: string): Promise<string> {
  const capturesRoot = path.resolve(cwd, "data", "kalshi-live");
  const entries = await readdir(capturesRoot, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const latest = directories.at(-1);
  if (!latest) {
    throw new Error("No Kalshi live capture directories found.");
  }
  return path.join(capturesRoot, latest);
}
