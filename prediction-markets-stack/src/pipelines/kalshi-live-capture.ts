import path from "node:path";

import {
  DefaultAcquisitionModule,
  DefaultDiscoveryFamilyClassifier,
  DefaultKalshiAcquisitionFactory,
  InMemorySourceEventSink
} from "../modules/module-1-acquisition.js";
import {
  buildDiscoveryStageRecordFromPayload,
  KalshiStagingParser
} from "../modules/module-2-staging.js";
import { KalshiNormalizationModule } from "../modules/module-3-normalization.js";
import { DeterministicGraphModule } from "../modules/module-4-graph.js";
import { DeterministicObservationModule } from "../modules/module-6-observations.js";
import { InMemoryStateViewsModule } from "../modules/module-5-state-views.js";
import { DeterministicSimulationModule } from "../modules/module-8-simulation.js";
import { FilesystemResearchStore } from "../runtime/filesystem-store.js";
import { KalshiHttpClient } from "../runtime/kalshi-api.js";
import type {
  BucketDefinition,
  CanonicalContract,
  EventFamily,
  ResolutionRuleRecord,
  ThresholdDefinition
} from "../domain/contracts.js";
import type {
  BookStageRecord,
  DiscoveryStageRecord,
  LifecycleFeeStageRecord,
  MetadataStageRecord,
  TradeTickerStageRecord
} from "../domain/source-events.js";
import type { RelationshipEdge } from "../domain/graph.js";
import type {
  ContractExecutionState,
  ContractFeeState,
  ContractLifecycleState,
  ContractQuoteState
} from "../domain/market-state.js";
import type {
  InternalConsistencyEdgeObservation,
  InternalConsistencyTradeSimulation
} from "../domain/observations.js";

export interface KalshiLiveCaptureOptions {
  maxPages?: number;
  pageLimit?: number;
  maxCandidates?: number;
  maxCandidatesPerSeries?: number;
  outputRoot?: string;
  targetSeriesTickers?: string[];
}

export interface KalshiLiveCaptureSummary {
  captureStartedAtMs: number;
  captureCompletedAtMs: number;
  pagesFetched: number;
  marketsScanned: number;
  candidateMarkets: number;
  sourceEventsCaptured: number;
  discoveryRecords: number;
  metadataRecords: number;
  normalizedContracts: number;
  thresholds: number;
  buckets: number;
  graphEdges: number;
  outputRoot: string;
}

interface SeriesSelectionDiagnostic {
  seriesTicker: string;
  scannedCandidates: number;
  tradableCandidates: number;
  selectedCandidates: number;
  selectionMode: "tradable_only" | "skipped_no_tradable_candidates";
  chosenFamilyKey?: string;
  visibleFamilies?: number;
  tradableFamilies?: number;
}

export async function runKalshiLiveCapture(
  options: KalshiLiveCaptureOptions = {}
): Promise<KalshiLiveCaptureSummary> {
  const captureStartedAtMs = Date.now();
  const maxPages = options.maxPages ?? 5;
  const pageLimit = options.pageLimit ?? 50;
  const maxCandidatesPerSeries = options.maxCandidatesPerSeries ?? pageLimit * maxPages;
  const targetSeriesTickers = options.targetSeriesTickers ?? ["KXBTC", "KXFED"];
  const maxCandidates = options.maxCandidates ?? targetSeriesTickers.length * pageLimit * maxPages;
  const outputRoot =
    options.outputRoot ??
    path.resolve(process.cwd(), "data", "kalshi-live", timestampId(new Date()));

  const client = new KalshiHttpClient();
  const store = new FilesystemResearchStore(outputRoot);
  const sink = new InMemorySourceEventSink();
  const acquisition = new DefaultAcquisitionModule(sink);
  const factory = new DefaultKalshiAcquisitionFactory();
  const classifier = new DefaultDiscoveryFamilyClassifier();
  const parser = new KalshiStagingParser();
  const normalization = new KalshiNormalizationModule();
  const graph = new DeterministicGraphModule();
  const captureSessionId = `kalshi-live-${timestampId(new Date())}`;

  await store.ensureLayout();

  let pagesFetched = 0;
  let marketsScanned = 0;
  const candidateMarkets: Array<{ ticker: string; title: string; familyClass: string }> = [];
  const discoveryPages: Array<{
    seriesTicker: string;
    pageNumber: number;
    cursorIn?: string;
    cursorOut?: string;
    marketCount: number;
    payload: unknown;
  }> = [];
  const seriesSelectionDiagnostics: SeriesSelectionDiagnostic[] = [];
  const candidateDiscoveryMarkets = new Map<
    string,
    {
      marketPayload: unknown;
      sourceEventId: string;
    }
  >();
  const discoveryRecords: DiscoveryStageRecord[] = [];
  const metadataRecords: MetadataStageRecord[] = [];
  const bookRecords: BookStageRecord[] = [];
  const tradeTickerRecords: TradeTickerStageRecord[] = [];
  const lifecycleFeeRecords: LifecycleFeeStageRecord[] = [];
  const families: EventFamily[] = [];
  const contracts: CanonicalContract[] = [];
  const thresholds: ThresholdDefinition[] = [];
  const buckets: BucketDefinition[] = [];
  const rules: ResolutionRuleRecord[] = [];

  for (const seriesTicker of targetSeriesTickers) {
    let cursor: string | undefined;
    const seriesCandidates: Array<{
      ticker: string;
      title: string;
      familyClass: string;
      familyKey: string;
      marketPayload: unknown;
      sourceEventId: string;
      familyScore: number;
    }> = [];
    for (let page = 0; page < maxPages && candidateMarkets.length < maxCandidates; page += 1) {
      const cursorIn = cursor;
      const pageResponse = await client.listMarkets({
        ...(cursor ? { cursor } : {}),
        limit: pageLimit,
        seriesTicker
      });
      pagesFetched += 1;
      marketsScanned += pageResponse.markets.length;
      cursor = pageResponse.cursor || undefined;
      discoveryPages.push({
        seriesTicker,
        pageNumber: page + 1,
        ...(cursorIn ? { cursorIn } : {}),
        ...(cursor ? { cursorOut: cursor } : {}),
        marketCount: pageResponse.markets.length,
        payload: pageResponse
      });
      const discoveryPageTimestampMs = Date.now();
      const discoveryPageEvent = factory.buildEvent(
        {
          captureSessionId,
          collectorVersion: "live-kalshi-v1",
          endpointOrStream: buildMarketsEndpoint(seriesTicker, pageLimit, cursorIn),
          sourceClass: "discovery",
          normalizedTimestampMs: discoveryPageTimestampMs,
          receiptTimestampMs: discoveryPageTimestampMs
        },
        pageResponse
      );
      await acquisition.recordDiscovery(discoveryPageEvent);
      await store.appendSourceEvent(discoveryPageEvent);
      for (const market of pageResponse.markets) {
        const familyClass = classifier.classify(market.title, market.category ?? undefined);
        if (familyClass === "excluded_v1") {
          continue;
        }
        const familyKey = market.event_ticker ?? market.title;
        seriesCandidates.push({
          ticker: market.ticker,
          title: market.title,
          familyClass,
          familyKey,
          marketPayload: market,
          sourceEventId: discoveryPageEvent.sourceEventId,
          familyScore: scoreCandidateMarket(market, discoveryPageTimestampMs)
        });
      }
      if (!cursor || candidateMarkets.length >= maxCandidates) {
        break;
      }
    }

    const tradableCandidates = seriesCandidates.filter((candidate) =>
      isObject(candidate.marketPayload) &&
      isMarketTradableCandidate(
        {
          status: typeof candidate.marketPayload.status === "string" ? candidate.marketPayload.status : null,
          open_time:
            typeof candidate.marketPayload.open_time === "string" ? candidate.marketPayload.open_time : null
        },
        Date.now()
      )
    );
    if (tradableCandidates.length === 0) {
      seriesSelectionDiagnostics.push({
        seriesTicker,
        scannedCandidates: seriesCandidates.length,
        tradableCandidates: 0,
        selectedCandidates: 0,
        selectionMode: "skipped_no_tradable_candidates"
      });
      continue;
    }

    const tradableFamilyCount = new Set(tradableCandidates.map((candidate) => candidate.familyKey)).size;
    const visibleFamilyCount = new Set(seriesCandidates.map((candidate) => candidate.familyKey)).size;
    const chosenFamilyKey =
      seriesTicker === "KXBTC" ? chooseBestTradableFamilyKey(tradableCandidates) : undefined;
    const chosenPool = chosenFamilyKey
      ? tradableCandidates.filter((candidate) => candidate.familyKey === chosenFamilyKey)
      : tradableCandidates;
    const chosen = chosenPool.sort((left, right) => {
      if (right.familyScore !== left.familyScore) {
        return right.familyScore - left.familyScore;
      }
      if (left.familyKey !== right.familyKey) {
        return left.familyKey.localeCompare(right.familyKey);
      }
      return left.ticker.localeCompare(right.ticker);
    });
    let acceptedForSeries = 0;
    for (const candidate of chosen) {
      if (acceptedForSeries >= maxCandidatesPerSeries) {
        break;
      }
      candidateMarkets.push({
        ticker: candidate.ticker,
        title: candidate.title,
        familyClass: candidate.familyClass
      });
      candidateDiscoveryMarkets.set(candidate.ticker, {
        marketPayload: candidate.marketPayload,
        sourceEventId: candidate.sourceEventId
      });
      acceptedForSeries += 1;
      if (candidateMarkets.length >= maxCandidates) {
        break;
      }
    }
    seriesSelectionDiagnostics.push({
      seriesTicker,
      scannedCandidates: seriesCandidates.length,
      tradableCandidates: tradableCandidates.length,
      selectedCandidates: acceptedForSeries,
      selectionMode: "tradable_only",
      ...(chosenFamilyKey ? { chosenFamilyKey } : {}),
      visibleFamilies: visibleFamilyCount,
      tradableFamilies: tradableFamilyCount
    });

  if (candidateMarkets.length >= maxCandidates) {
      break;
    }
  }

  const uniqueSeriesTickers = [...new Set(targetSeriesTickers)];
  const uniqueEventTickers = [...new Set(
    candidateMarkets
      .map((candidate) => candidateDiscoveryMarkets.get(candidate.ticker)?.marketPayload)
      .map((payload) => (isObject(payload) && typeof payload.event_ticker === "string" ? payload.event_ticker : undefined))
      .filter((ticker): ticker is string => ticker !== undefined)
  )];
  const [seriesDetails, eventDetails] = await Promise.all([
    Promise.all(
      uniqueSeriesTickers.map(async (seriesTicker) => {
        const response = await client.getSeries(seriesTicker);
        return [seriesTicker, response.series] as const;
      })
    ),
    Promise.all(
      uniqueEventTickers.map(async (eventTicker) => {
        const response = await client.getEvent(eventTicker);
        return [eventTicker, response.event] as const;
      })
    )
  ]);
  const seriesByTicker = new Map(seriesDetails);
  const eventByTicker = new Map(eventDetails);
  const selectedBySeries = summarizeSelectedBySeries(candidateMarkets);
  const tradableSelectedBySeries = summarizeTradableSelectedBySeries(candidateMarkets, candidateDiscoveryMarkets);

  for (const candidate of candidateMarkets) {
    const detail = await client.getMarket(candidate.ticker);
    const orderbook = await client.getOrderbook(candidate.ticker);
    const nowMs = Date.now();
    const metadataEvent = factory.buildEvent(
      {
        captureSessionId,
        collectorVersion: "live-kalshi-v1",
        endpointOrStream: `/markets/${candidate.ticker}`,
        sourceClass: "metadata",
        normalizedTimestampMs: nowMs,
        receiptTimestampMs: nowMs
      },
      detail
    );
    const bookEvent = factory.buildEvent(
      {
        captureSessionId,
        collectorVersion: "live-kalshi-v1",
        endpointOrStream: `/markets/${candidate.ticker}/orderbook`,
        sourceClass: "book",
        normalizedTimestampMs: nowMs,
        receiptTimestampMs: nowMs
      },
      {
        market_ticker: candidate.ticker,
        orderbook_fp: orderbook.orderbook_fp
      }
    );
    const tradeTickerEvent = factory.buildEvent(
      {
        captureSessionId,
        collectorVersion: "live-kalshi-v1",
        endpointOrStream: `/markets/${candidate.ticker}`,
        sourceClass: "trade_ticker",
        normalizedTimestampMs: nowMs,
        receiptTimestampMs: nowMs
      },
      detail
    );
    const marketPayload = detail.market;
    const eventDetails = marketPayload.event_ticker ? eventByTicker.get(marketPayload.event_ticker) : undefined;
    const seriesDetails = eventDetails?.series_ticker
      ? seriesByTicker.get(eventDetails.series_ticker)
      : marketPayload.series_ticker
        ? seriesByTicker.get(marketPayload.series_ticker)
        : undefined;
    const enrichedLifecyclePayload = {
      market: {
        ...marketPayload,
        ...(eventDetails?.series_ticker ? { series_ticker: eventDetails.series_ticker } : {}),
        ...(seriesDetails?.fee_type ? { fee_type: seriesDetails.fee_type } : {}),
        ...(seriesDetails?.fee_multiplier === undefined || seriesDetails.fee_multiplier === null
          ? {}
          : { fee_multiplier: seriesDetails.fee_multiplier }),
        ...(eventDetails?.fee_type_override ? { fee_type_override: eventDetails.fee_type_override } : {}),
        ...(eventDetails?.fee_multiplier_override === undefined || eventDetails.fee_multiplier_override === null
          ? {}
          : { fee_multiplier_override: eventDetails.fee_multiplier_override })
      }
    };
    const lifecycleFeeEvent = factory.buildEvent(
      {
        captureSessionId,
        collectorVersion: "live-kalshi-v1",
        endpointOrStream: `/markets/${candidate.ticker}`,
        sourceClass: "lifecycle_fee",
        normalizedTimestampMs: nowMs,
        receiptTimestampMs: nowMs
      },
      enrichedLifecyclePayload
    );

    await acquisition.recordMetadata(metadataEvent);
    await acquisition.recordBook(bookEvent);
    await acquisition.recordTradeTicker(tradeTickerEvent);
    await acquisition.recordLifecycleFee(lifecycleFeeEvent);

    await Promise.all([
      store.appendSourceEvent(metadataEvent),
      store.appendSourceEvent(bookEvent),
      store.appendSourceEvent(tradeTickerEvent),
      store.appendSourceEvent(lifecycleFeeEvent)
    ]);

    const discoveryMarket = candidateDiscoveryMarkets.get(candidate.ticker);
    if (!discoveryMarket) {
      throw new Error(`Missing discovery market payload for ${candidate.ticker}.`);
    }
    const discovery = buildDiscoveryStageRecordFromPayload(
      discoveryMarket.marketPayload,
      discoveryMarket.sourceEventId
    );
    const metadata = parser.parseMetadata(metadataEvent);
    const book = parser.parseBook(bookEvent);
    const tradeTicker = parser.parseTradeTicker(tradeTickerEvent);
    const lifecycleFee = parser.parseLifecycleFee(lifecycleFeeEvent);
    discoveryRecords.push(discovery);
    metadataRecords.push(metadata);
    bookRecords.push(book);
    tradeTickerRecords.push(tradeTicker);
    lifecycleFeeRecords.push(lifecycleFee);

    const family = normalization.buildFamily(discovery, metadata);
    const contract = normalization.buildContract(discovery, metadata);
    const threshold = normalization.buildThreshold(contract, metadata);
    const bucket = normalization.buildBucket(contract, metadata);
    const rule = normalization.buildRule(contract, metadata);

    families.push(family);
    contracts.push(contract);
    rules.push(rule);
    if (threshold) {
      thresholds.push(threshold);
    }
    if (bucket) {
      buckets.push(bucket);
    }
  }

  const edges: RelationshipEdge[] = [
    ...graph.generateComplementEdges(contracts, "graph-live-v1"),
    ...graph.generatePartitionEdges(contracts, buckets, "graph-live-v1"),
    ...graph.generateThresholdLadderEdges(contracts, thresholds, "graph-live-v1"),
    ...graph.generateTemporalNestedEdges(contracts, thresholds, "graph-live-v1")
  ];

  const contractIdByVenueContractId = new Map(
    contracts.map((contract) => [contract.venueContractId, contract.contractId])
  );
  const stateViews = new InMemoryStateViewsModule({
    booksByContractId: new Map(
      bookRecords.flatMap((record) => {
        const contractId = contractIdByVenueContractId.get(record.venueContractId);
        return contractId ? [[contractId, record] as const] : [];
      })
    ),
    lifecycleByContractId: new Map(
      lifecycleFeeRecords.flatMap((record) => {
        const contractId = contractIdByVenueContractId.get(record.venueContractId);
        return contractId ? [[contractId, record] as const] : [];
      })
    ),
    tickerByContractId: new Map(
      tradeTickerRecords.flatMap((record) => {
        const contractId = contractIdByVenueContractId.get(record.venueContractId);
        return contractId ? [[contractId, record] as const] : [];
      })
    )
  });

  const quoteStates: ContractQuoteState[] = [];
  const lifecycleStates: ContractLifecycleState[] = [];
  const feeStates: ContractFeeState[] = [];
  const executionStates: ContractExecutionState[] = [];
  for (const contract of contracts) {
    const quote = await stateViews.buildQuoteState(contract.contractId, Date.now());
    const lifecycle = await stateViews.buildLifecycleState(contract.contractId, Date.now());
    const fee = await stateViews.buildFeeState(contract.contractId, Date.now());
    const execution = await stateViews.buildExecutionState(contract.contractId, Date.now());
    if (quote) {
      quoteStates.push(quote);
    }
    if (lifecycle) {
      lifecycleStates.push(lifecycle);
    }
    if (fee) {
      feeStates.push(fee);
    }
    if (execution) {
      executionStates.push(execution);
    }
  }

  const observationModule = new DeterministicObservationModule({
    anchorsByContractId: new Map(),
    edgesById: new Map(edges.map((edge) => [edge.edgeId, edge])),
    executionByContractId: new Map(executionStates.map((state) => [state.contractId, state])),
    feeByContractId: new Map(feeStates.map((state) => [state.contractId, state])),
    quotesByContractId: new Map(quoteStates.map((state) => [state.contractId, state]))
  });
  const internalObservations: InternalConsistencyEdgeObservation[] = [];
  for (const edge of edges) {
    const observation = await observationModule.buildInternalEdgeObservation(edge.edgeId, Date.now());
    if (observation) {
      internalObservations.push(observation);
    }
  }

  const simulationModule = new DeterministicSimulationModule({
    anchorObservationsById: new Map(),
    internalObservationsById: new Map(
      internalObservations.map((observation) => [observation.observationId, observation])
    )
  });
  const internalSimulations: InternalConsistencyTradeSimulation[] = [];
  for (const observation of internalObservations.filter((row) => row.executionSafeFlag)) {
    for (const template of ["aggressive_all_legs", "passive_first", "hybrid_edge_tiered"] as const) {
      const simulation = await simulationModule.simulateInternal(observation.observationId, template);
      if (simulation) {
        internalSimulations.push(simulation);
      }
    }
  }

  const captureCompletedAtMs = Date.now();

  await Promise.all([
    store.writeSnapshot("summaries/capture-summary.json", {
      captureStartedAtMs,
      captureCompletedAtMs,
      pagesFetched,
      marketsScanned,
      targetSeriesTickers,
      maxCandidatesPerSeries,
      selectedBySeries,
      seriesSelectionDiagnostics,
      tradableSelectedBySeries,
      candidateMarkets: candidateMarkets.length,
      sourceEventsCaptured: sink.events.length,
      normalizedContracts: contracts.length,
      thresholds: thresholds.length,
      buckets: buckets.length,
      graphEdges: edges.length,
      quoteStates: quoteStates.length,
      internalObservations: internalObservations.length,
      internalSimulations: internalSimulations.length
    }),
    store.writeSnapshot("summaries/discovery-pages.json", discoveryPages),
    store.writeSnapshot("summaries/candidate-markets.json", candidateMarkets),
    store.writeSnapshot(
      "summaries/series-fee-metadata.json",
      [...seriesByTicker.entries()].map(([seriesTicker, series]) => ({
        seriesTicker,
        feeType: series.fee_type ?? null,
        feeMultiplier: series.fee_multiplier ?? null,
        title: series.title ?? null,
        category: series.category ?? null
      }))
    ),
    store.writeSnapshot(
      "summaries/event-fee-metadata.json",
      [...eventByTicker.entries()].map(([eventTicker, event]) => ({
        eventTicker,
        seriesTicker: event.series_ticker ?? null,
        feeTypeOverride: event.fee_type_override ?? null,
        feeMultiplierOverride: event.fee_multiplier_override ?? null,
        title: event.title ?? null
      }))
    ),
    store.writeSnapshot("staging/discovery-records.json", discoveryRecords),
    store.writeSnapshot("staging/metadata-records.json", metadataRecords),
    store.writeSnapshot("staging/book-records.json", bookRecords),
    store.writeSnapshot("staging/trade-ticker-records.json", tradeTickerRecords),
    store.writeSnapshot("staging/lifecycle-fee-records.json", lifecycleFeeRecords),
    store.writeSnapshot("normalized/families.json", families),
    store.writeSnapshot("normalized/contracts.json", contracts),
    store.writeSnapshot("normalized/thresholds.json", thresholds),
    store.writeSnapshot("normalized/buckets.json", buckets),
    store.writeSnapshot("normalized/rules.json", rules),
    store.writeSnapshot("graphs/edges.json", edges),
    store.writeSnapshot("state/quote-states.json", quoteStates),
    store.writeSnapshot("state/lifecycle-states.json", lifecycleStates),
    store.writeSnapshot("state/fee-states.json", feeStates),
    store.writeSnapshot("state/execution-states.json", executionStates),
    store.writeSnapshot("observations/internal-consistency.json", internalObservations),
    store.writeSnapshot("simulations/internal-consistency.json", internalSimulations)
  ]);
  return {
    captureStartedAtMs,
    captureCompletedAtMs,
    pagesFetched,
    marketsScanned,
    candidateMarkets: candidateMarkets.length,
    sourceEventsCaptured: sink.events.length,
    discoveryRecords: discoveryRecords.length,
    metadataRecords: metadataRecords.length,
    normalizedContracts: contracts.length,
    thresholds: thresholds.length,
    buckets: buckets.length,
    graphEdges: edges.length,
    outputRoot
  };
}

function timestampId(now: Date): string {
  return now.toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
}

function buildMarketsEndpoint(seriesTicker: string, limit: number, cursor?: string): string {
  const params = new URLSearchParams({
    limit: String(limit),
    series_ticker: seriesTicker
  });
  if (cursor) {
    params.set("cursor", cursor);
  }
  return `/markets?${params.toString()}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function scoreCandidateMarket(
  market: {
    status?: string | null;
    open_time?: string | null;
    liquidity_dollars?: string | null;
    volume_fp?: string | null;
  },
  nowMs: number
): number {
  const status = market.status?.toLowerCase();
  const openTimeMs = market.open_time ? Date.parse(market.open_time) : undefined;
  const liquidity = Number(market.liquidity_dollars ?? "0");
  const volume = Number(market.volume_fp ?? "0");
  const isOpenByTime = openTimeMs === undefined || openTimeMs <= nowMs;

  let score = 0;
  if (status === "active" || status === "open") {
    score += 100;
  } else if (status === "listed" && isOpenByTime) {
    score += 80;
  } else if (status === "listed") {
    score += 40;
  } else if (status === "initialized") {
    score += 10;
  }
  if (isOpenByTime) {
    score += 20;
  }
  score += Math.min(liquidity, 50);
  score += Math.min(volume, 25);
  return score;
}

function chooseBestTradableFamilyKey(
  candidates: Array<{
    familyKey: string;
    familyScore: number;
  }>
): string | undefined {
  if (candidates.length === 0) {
    return undefined;
  }
  const stats = new Map<string, { count: number; score: number }>();
  for (const candidate of candidates) {
    const row = stats.get(candidate.familyKey);
    if (row) {
      row.count += 1;
      row.score += candidate.familyScore;
    } else {
      stats.set(candidate.familyKey, { count: 1, score: candidate.familyScore });
    }
  }
  return [...stats.entries()]
    .sort((left, right) => {
      const leftRank = left[1].count * 10 + left[1].score / left[1].count;
      const rightRank = right[1].count * 10 + right[1].score / right[1].count;
      if (rightRank !== leftRank) {
        return rightRank - leftRank;
      }
      return left[0].localeCompare(right[0]);
    })[0]?.[0];
}

function summarizeSelectedBySeries(
  candidates: Array<{ ticker: string }>
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    const series = candidate.ticker.split("-")[0] ?? candidate.ticker;
    counts.set(series, (counts.get(series) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function summarizeTradableSelectedBySeries(
  candidates: Array<{ ticker: string }>,
  candidateDiscoveryMarkets: Map<string, { marketPayload: unknown; sourceEventId: string }>
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    const marketPayload = candidateDiscoveryMarkets.get(candidate.ticker)?.marketPayload;
    if (
      !isObject(marketPayload) ||
      !isMarketTradableCandidate(
        {
          status: typeof marketPayload.status === "string" ? marketPayload.status : null,
          open_time: typeof marketPayload.open_time === "string" ? marketPayload.open_time : null
        },
        Date.now()
      )
    ) {
      continue;
    }
    const series = candidate.ticker.split("-")[0] ?? candidate.ticker;
    counts.set(series, (counts.get(series) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}
