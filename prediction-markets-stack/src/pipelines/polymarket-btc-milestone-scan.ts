import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PolymarketEventRecord, PolymarketMarketRecord } from "../runtime/polymarket-api.js";
import { PolymarketGammaClient } from "../runtime/polymarket-api.js";

export interface PolymarketBtcMilestoneScanOptions {
  outputRoot?: string;
  limit?: number;
}

export interface PolymarketBtcMilestoneRow {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  question: string;
  marketSlug: string;
  active: boolean;
  closed: boolean;
  restricted: boolean;
  acceptingOrders: boolean;
  enableOrderBook: boolean;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  spread?: number;
  endDate?: string;
  liquidityNum?: number;
  volume24hr?: number;
  volume1wk?: number;
}

export interface PolymarketBtcMilestoneScanSummary {
  outputRoot: string;
  checkedAtIso: string;
  scannedEvents: number;
  matchingEvents: number;
  matchingMarkets: number;
  openMarkets: number;
  orderBookMarkets: number;
  quoteReadyMarkets: number;
  unrestrictedQuoteReadyMarkets: number;
  reservePathVerdict:
    | "viable_public_data_with_restriction_risk"
    | "viable_public_data"
    | "data_visible_but_not_trade_ready"
    | "no_matching_markets";
  primaryRecommendation: string;
  bestMarket?: PolymarketBtcMilestoneRow;
  markets: PolymarketBtcMilestoneRow[];
}

export async function runPolymarketBtcMilestoneScan(
  options: PolymarketBtcMilestoneScanOptions = {}
): Promise<PolymarketBtcMilestoneScanSummary> {
  const outputRoot =
    options.outputRoot ?? path.resolve(process.cwd(), "data", "polymarket-live", timestampId(new Date()));
  await mkdir(path.join(outputRoot, "raw"), { recursive: true });
  await mkdir(path.join(outputRoot, "summaries"), { recursive: true });

  const client = new PolymarketGammaClient();
  const events = await client.listEvents({
    limit: options.limit ?? 500,
    active: true,
    closed: false
  });

  const matchingEvents = events.filter(matchesBtcMilestoneEvent);
  const rows = matchingEvents.flatMap((event) => flattenMatchingMarkets(event));
  const openMarkets = rows.filter((row) => row.active && !row.closed);
  const orderBookMarkets = openMarkets.filter((row) => row.enableOrderBook);
  const quoteReadyMarkets = orderBookMarkets.filter((row) => row.bestBid !== undefined && row.bestAsk !== undefined);
  const unrestrictedQuoteReadyMarkets = quoteReadyMarkets.filter((row) => !row.restricted);
  const bestMarket = [...quoteReadyMarkets].sort(compareReservePathPriority)[0];

  const summary: PolymarketBtcMilestoneScanSummary = {
    outputRoot,
    checkedAtIso: new Date().toISOString(),
    scannedEvents: events.length,
    matchingEvents: matchingEvents.length,
    matchingMarkets: rows.length,
    openMarkets: openMarkets.length,
    orderBookMarkets: orderBookMarkets.length,
    quoteReadyMarkets: quoteReadyMarkets.length,
    unrestrictedQuoteReadyMarkets: unrestrictedQuoteReadyMarkets.length,
    reservePathVerdict:
      quoteReadyMarkets.length === 0
        ? rows.length === 0
          ? "no_matching_markets"
          : "data_visible_but_not_trade_ready"
        : unrestrictedQuoteReadyMarkets.length === 0
          ? "viable_public_data_with_restriction_risk"
          : "viable_public_data",
    primaryRecommendation:
      quoteReadyMarkets.length === 0
        ? rows.length === 0
          ? "No live BTC milestone markets matched the current scan, so this reserve path is not ready yet."
          : "BTC milestone markets are visible on Polymarket, but the current scan did not find quote-ready order-book markets."
        : unrestrictedQuoteReadyMarkets.length === 0
          ? "Use Polymarket as the always-on research and paper-trading reserve path, but treat venue/jurisdiction restrictions as a production gating item."
          : "Promote Polymarket BTC milestone markets into the always-on reserve sleeve so the system is no longer blocked by Kalshi pre-open windows.",
    ...(bestMarket ? { bestMarket } : {}),
    markets: rows.sort(compareReservePathPriority)
  };

  await writeFile(path.join(outputRoot, "raw", "events.json"), `${JSON.stringify(events, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(outputRoot, "summaries", "btc-milestone-scan.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );

  return summary;
}

function matchesBtcMilestoneEvent(event: PolymarketEventRecord): boolean {
  const haystack = `${event.title} ${event.slug}`.toLowerCase();
  return haystack.includes("bitcoin hit") || haystack.includes("bitcoin above") || haystack.includes("bitcoin");
}

function flattenMatchingMarkets(event: PolymarketEventRecord): PolymarketBtcMilestoneRow[] {
  return (event.markets ?? [])
    .filter(matchesBtcMilestoneMarket)
    .map((market) => {
      const spread =
        market.bestBid !== undefined && market.bestAsk !== undefined ? market.bestAsk - market.bestBid : undefined;
      return {
        eventId: event.id,
        eventSlug: event.slug,
        eventTitle: event.title,
        question: market.question,
        marketSlug: market.slug,
        active: market.active ?? false,
        closed: market.closed ?? false,
        restricted: market.restricted ?? event.restricted ?? false,
        acceptingOrders: market.acceptingOrders ?? false,
        enableOrderBook: market.enableOrderBook ?? false,
        ...(market.bestBid === undefined ? {} : { bestBid: market.bestBid }),
        ...(market.bestAsk === undefined ? {} : { bestAsk: market.bestAsk }),
        ...(market.lastTradePrice === undefined ? {} : { lastTradePrice: market.lastTradePrice }),
        ...(spread === undefined ? {} : { spread }),
        ...(market.endDate ? { endDate: market.endDate } : {}),
        ...(market.liquidityNum === undefined ? {} : { liquidityNum: market.liquidityNum }),
        ...(market.volume24hr === undefined ? {} : { volume24hr: market.volume24hr }),
        ...(market.volume1wk === undefined ? {} : { volume1wk: market.volume1wk })
      };
    });
}

function matchesBtcMilestoneMarket(market: PolymarketMarketRecord): boolean {
  const text = `${market.question} ${market.slug}`.toLowerCase();
  return text.includes("bitcoin hit") || text.includes("bitcoin") || text.includes("btc");
}

function compareReservePathPriority(left: PolymarketBtcMilestoneRow, right: PolymarketBtcMilestoneRow): number {
  const leftScore = reservePathPriorityScore(left);
  const rightScore = reservePathPriorityScore(right);
  if (rightScore !== leftScore) {
    return rightScore - leftScore;
  }
  return left.marketSlug.localeCompare(right.marketSlug);
}

function reservePathPriorityScore(row: PolymarketBtcMilestoneRow): number {
  let score = 0;
  if (row.active && !row.closed) {
    score += 100;
  }
  if (row.enableOrderBook) {
    score += 25;
  }
  if (row.bestBid !== undefined && row.bestAsk !== undefined) {
    score += 50;
  }
  if (row.acceptingOrders) {
    score += 20;
  }
  if (!row.restricted) {
    score += 10;
  }
  score += (row.volume24hr ?? 0) / 1000;
  score += (row.liquidityNum ?? 0) / 10000;
  score -= row.spread ?? 1;
  return score;
}

function timestampId(now: Date): string {
  return now.toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
}
