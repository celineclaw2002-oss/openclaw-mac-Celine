import { readdir } from "node:fs/promises";
import path from "node:path";

import type { AnchorRawSnapshot } from "../domain/anchors.js";
import { FilesystemResearchStore } from "../runtime/filesystem-store.js";
import { CoinbaseHttpClient } from "../runtime/coinbase-api.js";

export interface CoinbaseBtcSpotCaptureOptions {
  outputRoot?: string;
  productId?: string;
}

export interface CoinbaseBtcSpotCaptureSummary {
  outputRoot: string;
  productId: string;
  observationTimeMs: number;
  recordedAtMs: number;
  payloadRef: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
}

export async function runCoinbaseBtcSpotCapture(
  options: CoinbaseBtcSpotCaptureOptions = {}
): Promise<CoinbaseBtcSpotCaptureSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const productId = options.productId ?? "BTC-USD";
  const client = new CoinbaseHttpClient();
  const store = new FilesystemResearchStore(outputRoot);

  await store.ensureLayout();

  const ticker = await client.getTicker(productId);
  const observationTimeMs = Date.parse(ticker.time);
  const recordedAtMs = Date.now();
  const rawPayloadRef = "anchors/coinbase-btc-spot-raw.json";
  await store.writeSnapshot(rawPayloadRef, ticker);
  const rawSnapshot: AnchorRawSnapshot = {
    anchorFamily: "btc_thresholds",
    observationTimeMs,
    sourceName: `coinbase:${productId}`,
    payloadRef: rawPayloadRef,
    dataQualityScore: 0.8,
    normalizationVersion: "norm-v1",
    ruleParserVersion: "rule-v1",
    feeModelVersion: "fee-v1",
    parseVersion: "coinbase-spot-v1"
  };
  await store.writeSnapshot("anchors/coinbase-btc-spot-snapshot.json", rawSnapshot);

  const summary: CoinbaseBtcSpotCaptureSummary = {
    outputRoot,
    productId,
    observationTimeMs,
    recordedAtMs,
    payloadRef: rawPayloadRef,
    price: ticker.price,
    bid: ticker.bid,
    ask: ticker.ask,
    spread: ticker.ask - ticker.bid
  };
  await store.writeSnapshot("anchors/coinbase-btc-spot-summary.json", summary);
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
