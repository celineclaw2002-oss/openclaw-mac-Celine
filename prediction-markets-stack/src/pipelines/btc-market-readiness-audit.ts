import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface BtcMarketReadinessAuditOptions {
  outputRoot?: string;
}

export interface BtcFamilyReadinessRow {
  eventTicker: string;
  contracts: number;
  tradableContracts: number;
  initializedContracts: number;
  activeContracts: number;
  liveQuoteContracts: number;
  nonZeroLiquidityContracts: number;
  nonZeroVolumeContracts: number;
  earliestOpenTimeMs?: number;
  latestOpenTimeMs?: number;
  earliestOpenTimeIso?: string;
  latestOpenTimeIso?: string;
  readinessStatus: "tradable_ready" | "pre_open" | "live_but_empty" | "inactive";
  readinessScore: number;
  blockerReasons: string[];
}

export interface BtcMarketReadinessAuditSummary {
  outputRoot: string;
  checkedAtIso: string;
  seriesTicker: "KXBTC";
  captureCompletedAtMs?: number;
  visibleFamilies: number;
  tradableFamilies: number;
  bestTradableFamily?: string;
  nextOpenFamily?: string;
  nextOpenTimeMs?: number;
  nextOpenTimeIso?: string;
  families: BtcFamilyReadinessRow[];
}

interface CaptureSummaryShape {
  captureCompletedAtMs?: number;
}

interface DiscoveryPagesShape {
  seriesTicker?: string;
  payload?: {
    markets?: BtcDiscoveryMarket[];
  };
}

interface BtcDiscoveryMarket {
  event_ticker?: string | null;
  status?: string | null;
  open_time?: string | null;
  liquidity_dollars?: string | null;
  volume_fp?: string | null;
  yes_bid_dollars?: string | null;
  yes_ask_dollars?: string | null;
  no_bid_dollars?: string | null;
  no_ask_dollars?: string | null;
  series_ticker?: string | null;
}

export async function runBtcMarketReadinessAudit(
  options: BtcMarketReadinessAuditOptions = {}
): Promise<BtcMarketReadinessAuditSummary> {
  const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
  const [captureSummary, discoveryPages] = await Promise.all([
    readJsonFile<CaptureSummaryShape>(path.join(outputRoot, "summaries", "capture-summary.json")),
    readJsonFile<DiscoveryPagesShape[]>(path.join(outputRoot, "summaries", "discovery-pages.json"))
  ]);

  const captureCompletedAtMs = captureSummary.captureCompletedAtMs ?? Date.now();
  const rowsByEventTicker = new Map<string, BtcDiscoveryMarket[]>();

  for (const page of discoveryPages) {
    const pageSeriesTicker = page.seriesTicker;
    for (const market of page.payload?.markets ?? []) {
      const inferredSeriesTicker = market.series_ticker ?? market.event_ticker?.split("-")[0] ?? pageSeriesTicker;
      if (inferredSeriesTicker !== "KXBTC" || !market.event_ticker) {
        continue;
      }
      const rows = rowsByEventTicker.get(market.event_ticker);
      if (rows) {
        rows.push(market);
      } else {
        rowsByEventTicker.set(market.event_ticker, [market]);
      }
    }
  }

  const families: BtcFamilyReadinessRow[] = [...rowsByEventTicker.entries()]
    .map(([eventTicker, markets]) => buildFamilyReadinessRow(eventTicker, markets, captureCompletedAtMs))
    .sort((left, right) => {
      if (right.readinessScore !== left.readinessScore) {
        return right.readinessScore - left.readinessScore;
      }
      return left.eventTicker.localeCompare(right.eventTicker);
    });

  const tradableFamilies = families.filter((family) => family.readinessStatus === "tradable_ready");
  const preOpenFamilies = families
    .filter((family) => family.readinessStatus === "pre_open" && family.earliestOpenTimeMs !== undefined)
    .sort((left, right) => (left.earliestOpenTimeMs ?? Number.POSITIVE_INFINITY) - (right.earliestOpenTimeMs ?? Number.POSITIVE_INFINITY));

  const summary: BtcMarketReadinessAuditSummary = {
    outputRoot,
    checkedAtIso: new Date(captureCompletedAtMs).toISOString(),
    seriesTicker: "KXBTC",
    ...(captureSummary.captureCompletedAtMs === undefined ? {} : { captureCompletedAtMs }),
    visibleFamilies: families.length,
    tradableFamilies: tradableFamilies.length,
    ...(tradableFamilies[0] ? { bestTradableFamily: tradableFamilies[0].eventTicker } : {}),
    ...(preOpenFamilies[0]
      ? {
          nextOpenFamily: preOpenFamilies[0].eventTicker,
          nextOpenTimeMs: preOpenFamilies[0].earliestOpenTimeMs,
          nextOpenTimeIso: preOpenFamilies[0].earliestOpenTimeIso
        }
      : {}),
    families
  };

  await writeFile(
    path.join(outputRoot, "summaries", "btc-market-readiness.json"),
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

async function readJsonFile<T>(target: string): Promise<T> {
  return JSON.parse(await readFile(target, "utf8")) as T;
}

function buildFamilyReadinessRow(
  eventTicker: string,
  markets: Array<{
    status?: string | null;
    open_time?: string | null;
    liquidity_dollars?: string | null;
    volume_fp?: string | null;
    yes_bid_dollars?: string | null;
    yes_ask_dollars?: string | null;
    no_bid_dollars?: string | null;
    no_ask_dollars?: string | null;
  }>,
  nowMs: number
): BtcFamilyReadinessRow {
  const openTimes = markets
    .map((market) => (market.open_time ? Date.parse(market.open_time) : undefined))
    .filter((value): value is number => value !== undefined && Number.isFinite(value));
  const tradableContracts = markets.filter((market) => isMarketTradableCandidate(market, nowMs)).length;
  const initializedContracts = markets.filter((market) => normalizeStatus(market.status) === "initialized").length;
  const activeContracts = markets.filter((market) => normalizeStatus(market.status) === "active").length;
  const liveQuoteContracts = markets.filter(hasLiveQuotes).length;
  const nonZeroLiquidityContracts = markets.filter((market) => numericField(market.liquidity_dollars) > 0).length;
  const nonZeroVolumeContracts = markets.filter((market) => numericField(market.volume_fp) > 0).length;

  const blockerReasons: string[] = [];
  let readinessStatus: BtcFamilyReadinessRow["readinessStatus"] = "inactive";
  let readinessScore = 0;

  if (tradableContracts > 0 && liveQuoteContracts > 0) {
    readinessStatus = "tradable_ready";
    readinessScore = tradableContracts * 10 + liveQuoteContracts * 5 + nonZeroLiquidityContracts * 2 + nonZeroVolumeContracts;
  } else if (openTimes.length > 0 && Math.min(...openTimes) > nowMs) {
    readinessStatus = "pre_open";
    readinessScore = 20 - Math.min(12, (Math.min(...openTimes) - nowMs) / 3_600_000);
    blockerReasons.push("pre_open_family");
  } else if (tradableContracts > 0) {
    readinessStatus = "live_but_empty";
    readinessScore = tradableContracts * 5 + nonZeroLiquidityContracts + nonZeroVolumeContracts;
    blockerReasons.push("insufficient_live_quotes");
  } else {
    blockerReasons.push("no_tradable_contracts");
  }

  if (liveQuoteContracts === 0) {
    blockerReasons.push("no_live_quotes");
  }
  if (nonZeroLiquidityContracts === 0) {
    blockerReasons.push("zero_reported_liquidity");
  }
  if (nonZeroVolumeContracts === 0) {
    blockerReasons.push("zero_reported_volume");
  }
  if (initializedContracts === markets.length) {
    blockerReasons.push("all_contracts_initialized");
  }

  return {
    eventTicker,
    contracts: markets.length,
    tradableContracts,
    initializedContracts,
    activeContracts,
    liveQuoteContracts,
    nonZeroLiquidityContracts,
    nonZeroVolumeContracts,
    ...(openTimes.length === 0
      ? {}
      : {
          earliestOpenTimeMs: Math.min(...openTimes),
          latestOpenTimeMs: Math.max(...openTimes),
          earliestOpenTimeIso: new Date(Math.min(...openTimes)).toISOString(),
          latestOpenTimeIso: new Date(Math.max(...openTimes)).toISOString()
        }),
    readinessStatus,
    readinessScore,
    blockerReasons: [...new Set(blockerReasons)].sort()
  };
}

function normalizeStatus(status: string | null | undefined): "initialized" | "listed" | "active" | "other" {
  const normalized = status?.toLowerCase();
  if (normalized === "initialized") {
    return "initialized";
  }
  if (normalized === "listed") {
    return "listed";
  }
  if (normalized === "active" || normalized === "open") {
    return "active";
  }
  return "other";
}

function isMarketTradableCandidate(
  market: {
    status?: string | null;
    open_time?: string | null;
  },
  nowMs: number
): boolean {
  const status = market.status?.toLowerCase();
  const openTimeMs = market.open_time ? Date.parse(market.open_time) : undefined;
  const openByTime = openTimeMs === undefined || openTimeMs <= nowMs;
  return (status === "active" || status === "open" || status === "listed") && openByTime;
}

function hasLiveQuotes(market: {
  yes_bid_dollars?: string | null;
  yes_ask_dollars?: string | null;
  no_bid_dollars?: string | null;
  no_ask_dollars?: string | null;
}): boolean {
  const yesBid = numericField(market.yes_bid_dollars);
  const yesAsk = numericField(market.yes_ask_dollars);
  const noBid = numericField(market.no_bid_dollars);
  const noAsk = numericField(market.no_ask_dollars);
  return (yesBid > 0 || noBid > 0) && (yesAsk < 1 || noAsk < 1);
}

function numericField(value: string | null | undefined): number {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}
