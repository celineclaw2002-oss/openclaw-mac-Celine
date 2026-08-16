import { access, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface AnchorInputAuditOptions {
  outputRoot?: string;
  maxCrossSourceAgeMs?: number;
}

export interface AnchorInputAuditFinding {
  severity: "high" | "medium" | "low";
  code: string;
  message: string;
  evidence?: Record<string, unknown>;
}

export interface AnchorInputAuditSummary {
  outputRoot: string;
  checkedAtIso: string;
  findings: AnchorInputAuditFinding[];
}

export async function runAnchorInputAudit(
  options: AnchorInputAuditOptions = {}
): Promise<AnchorInputAuditSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const maxCrossSourceAgeMs = options.maxCrossSourceAgeMs ?? 120_000;
  const [kalshiSummary, coinbaseSummary, deribitSummary, futuresSelected, optionsSelected] = await Promise.all([
    readOptionalJsonFile<{ captureStartedAtMs?: number; captureCompletedAtMs?: number }>(
      path.join(outputRoot, "summaries", "capture-summary.json")
    ),
    readOptionalJsonFile<{ observationTimeMs?: number; recordedAtMs?: number; payloadRef?: string }>(
      path.join(outputRoot, "anchors", "coinbase-btc-spot-summary.json")
    ),
    readOptionalJsonFile<{
      observationTimeMs?: number;
      recordedAtMs?: number;
      payloadRef?: string;
      referenceSpotObservationTimeMs?: number;
      referenceSpotRecordedAtMs?: number;
      referenceSpotPayloadRef?: string;
      referenceSpotAgeMs?: number;
      referenceSpotGapMs?: number;
    }>(path.join(outputRoot, "anchors", "deribit-btc-anchor-summary.json")),
    readOptionalJsonFile<Array<{ instrument_name: string; book?: Record<string, unknown> }>>(
      path.join(outputRoot, "anchors", "deribit-btc-futures-selected.json")
    ),
    readOptionalJsonFile<Array<{ instrument_name: string; book?: Record<string, unknown> }>>(
      path.join(outputRoot, "anchors", "deribit-btc-options-selected.json")
    )
  ]);

  const findings: AnchorInputAuditFinding[] = [];
  if (!coinbaseSummary?.payloadRef) {
    findings.push({
      severity: "high",
      code: "missing_coinbase_payload_ref",
      message: "Coinbase anchor summary is missing a payload reference."
    });
  }
  if (!deribitSummary?.payloadRef) {
    findings.push({
      severity: "high",
      code: "missing_deribit_payload_ref",
      message: "Deribit anchor summary is missing a payload reference."
    });
  }
  if (!deribitSummary?.referenceSpotPayloadRef || deribitSummary.referenceSpotObservationTimeMs === undefined) {
    findings.push({
      severity: "high",
      code: "missing_reference_spot_lineage",
      message: "Deribit summary is missing the Coinbase lineage used for option selection."
    });
  }
  for (const ref of [
    coinbaseSummary?.payloadRef,
    deribitSummary?.payloadRef,
    deribitSummary?.referenceSpotPayloadRef
  ]) {
    if (!ref) {
      continue;
    }
    if (path.isAbsolute(ref)) {
      findings.push({
        severity: "medium",
        code: "absolute_payload_ref",
        message: "An anchor payload reference is absolute instead of session-relative.",
        evidence: { ref }
      });
      continue;
    }
    const resolved = path.resolve(outputRoot, ref);
    if (!resolved.startsWith(path.resolve(outputRoot))) {
      findings.push({
        severity: "high",
        code: "payload_ref_outside_session_root",
        message: "An anchor payload reference resolves outside the session root.",
        evidence: { ref }
      });
      continue;
    }
    try {
      await access(resolved);
    } catch {
      findings.push({
        severity: "medium",
        code: "payload_ref_missing_target",
        message: "An anchor payload reference does not resolve to an existing file.",
        evidence: { ref }
      });
    }
  }

  if ((deribitSummary?.referenceSpotAgeMs ?? 0) > maxCrossSourceAgeMs) {
    findings.push({
      severity: "high",
      code: "stale_reference_spot_for_deribit_selection",
      message: "Deribit option selection used a Coinbase spot input that is older than the allowed threshold.",
      evidence: {
        referenceSpotAgeMs: deribitSummary?.referenceSpotAgeMs,
        maxCrossSourceAgeMs
      }
    });
  }
  if (kalshiSummary?.captureCompletedAtMs !== undefined && deribitSummary?.recordedAtMs !== undefined) {
    const deribitLagMs = deribitSummary.recordedAtMs - kalshiSummary.captureCompletedAtMs;
    if (deribitLagMs > maxCrossSourceAgeMs) {
      findings.push({
        severity: "high",
        code: "stale_deribit_vs_kalshi_session",
        message: "Deribit capture occurred too far after the Kalshi capture completed.",
        evidence: {
          deribitLagMs,
          maxCrossSourceAgeMs
        }
      });
    }
  }
  if (futuresSelected && futuresSelected.some((future) => !future.book)) {
    findings.push({
      severity: "medium",
      code: "selected_future_missing_book_state",
      message: "At least one selected Deribit future is missing embedded replayable book state."
    });
  }
  if (optionsSelected && optionsSelected.some((option) => !option.book)) {
    findings.push({
      severity: "medium",
      code: "selected_option_missing_book_state",
      message: "At least one selected Deribit option is missing embedded replayable book state."
    });
  }

  const checkedAtMs =
    deribitSummary?.observationTimeMs ??
    coinbaseSummary?.observationTimeMs ??
    kalshiSummary?.captureCompletedAtMs ??
    0;
  const summary: AnchorInputAuditSummary = {
    outputRoot,
    checkedAtIso: checkedAtMs > 0 ? new Date(checkedAtMs).toISOString() : "1970-01-01T00:00:00.000Z",
    findings
  };

  await writeFile(
    path.join(outputRoot, "anchors", "anchor-input-audit.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );

  return summary;
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

async function readOptionalJsonFile<T>(target: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(target, "utf8")) as T;
  } catch {
    return undefined;
  }
}
