import path from "node:path";

import { runAnchorInputAudit } from "./anchor-input-audit.js";
import { runBtcAnchorMappingAudit } from "./btc-anchor-mapping-audit.js";
import { runBtcCaptureWindowPlan } from "./btc-capture-window-plan.js";
import { runBtcMarketReadinessAudit } from "./btc-market-readiness-audit.js";
import { runBtcRawAnchorProbability } from "./btc-raw-anchor-probability.js";
import { runCoinbaseBtcSpotCapture } from "./coinbase-btc-spot-capture.js";
import { runDeribitBtcAnchorCapture } from "./deribit-btc-anchor-capture.js";
import { runKalshiLiveCapture } from "./kalshi-live-capture.js";
import { runSemanticAudit } from "./semantic-audit.js";

export interface BtcObservationSessionSummary {
  outputRoot: string;
  kalshiContracts: number;
  btcTradableFamilies: number;
  btcCaptureAction: "run_now" | "wait_for_open" | "no_visible_btc_families";
  btcNextOpenFamily?: string;
  btcNextOpenTimeIso?: string;
  btcRecommendedCaptureStartIso?: string;
  btcRecommendedCaptureEndIso?: string;
  btcAnchorStageStatus: "executed" | "skipped_pre_open";
  semanticAuditFindings: number;
  anchorInputAuditFindings: number;
  btcAnchorMappings: number;
  rawAnchorProbabilities: number;
}

export async function runBtcObservationSession(): Promise<BtcObservationSessionSummary> {
  const outputRoot = path.resolve(process.cwd(), "data", "kalshi-live", timestampId(new Date()));
  const kalshi = await runKalshiLiveCapture({ outputRoot });
  const readinessAudit = await runBtcMarketReadinessAudit({ outputRoot });
  const capturePlan = await runBtcCaptureWindowPlan({ outputRoot });
  const semanticAudit = await runSemanticAudit({ outputRoot });
  if (capturePlan.recommendation.action !== "run_now") {
    return {
      outputRoot,
      kalshiContracts: kalshi.normalizedContracts,
      btcTradableFamilies: readinessAudit.tradableFamilies,
      btcCaptureAction: capturePlan.recommendation.action,
      ...(capturePlan.recommendation.nextFamily ? { btcNextOpenFamily: capturePlan.recommendation.nextFamily } : {}),
      ...(capturePlan.recommendation.nextOpenTimeIso ? { btcNextOpenTimeIso: capturePlan.recommendation.nextOpenTimeIso } : {}),
      ...(capturePlan.recommendation.recommendedCaptureStartIso
        ? { btcRecommendedCaptureStartIso: capturePlan.recommendation.recommendedCaptureStartIso }
        : {}),
      ...(capturePlan.recommendation.recommendedCaptureEndIso
        ? { btcRecommendedCaptureEndIso: capturePlan.recommendation.recommendedCaptureEndIso }
        : {}),
      btcAnchorStageStatus: "skipped_pre_open",
      semanticAuditFindings: semanticAudit.findings.length,
      anchorInputAuditFindings: 0,
      btcAnchorMappings: 0,
      rawAnchorProbabilities: 0
    };
  }

  await runCoinbaseBtcSpotCapture({ outputRoot });
  await runDeribitBtcAnchorCapture({ outputRoot });
  const anchorInputAudit = await runAnchorInputAudit({ outputRoot });
  const mappingAudit = await runBtcAnchorMappingAudit({ outputRoot });
  const rawAnchor = await runBtcRawAnchorProbability({ outputRoot });

  return {
    outputRoot,
    kalshiContracts: kalshi.normalizedContracts,
    btcTradableFamilies: readinessAudit.tradableFamilies,
    btcCaptureAction: capturePlan.recommendation.action,
    ...(capturePlan.recommendation.nextFamily ? { btcNextOpenFamily: capturePlan.recommendation.nextFamily } : {}),
    ...(capturePlan.recommendation.nextOpenTimeIso ? { btcNextOpenTimeIso: capturePlan.recommendation.nextOpenTimeIso } : {}),
    ...(capturePlan.recommendation.recommendedCaptureStartIso
      ? { btcRecommendedCaptureStartIso: capturePlan.recommendation.recommendedCaptureStartIso }
      : {}),
    ...(capturePlan.recommendation.recommendedCaptureEndIso
      ? { btcRecommendedCaptureEndIso: capturePlan.recommendation.recommendedCaptureEndIso }
      : {}),
    btcAnchorStageStatus: "executed",
    semanticAuditFindings: semanticAudit.findings.length,
    anchorInputAuditFindings: anchorInputAudit.findings.length,
    btcAnchorMappings: mappingAudit.rows.length,
    rawAnchorProbabilities: rawAnchor.anchorsBuilt
  };
}

function timestampId(now: Date): string {
  return now.toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
}
