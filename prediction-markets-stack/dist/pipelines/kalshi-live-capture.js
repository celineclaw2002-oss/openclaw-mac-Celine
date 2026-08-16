import path from "node:path";
import { DefaultAcquisitionModule, DefaultDiscoveryFamilyClassifier, DefaultKalshiAcquisitionFactory, InMemorySourceEventSink } from "../modules/module-1-acquisition.js";
import { buildDiscoveryStageRecordFromPayload, KalshiStagingParser } from "../modules/module-2-staging.js";
import { KalshiNormalizationModule } from "../modules/module-3-normalization.js";
import { DeterministicGraphModule } from "../modules/module-4-graph.js";
import { DeterministicObservationModule } from "../modules/module-6-observations.js";
import { InMemoryStateViewsModule } from "../modules/module-5-state-views.js";
import { DeterministicSimulationModule } from "../modules/module-8-simulation.js";
import { FilesystemResearchStore } from "../runtime/filesystem-store.js";
import { KalshiHttpClient } from "../runtime/kalshi-api.js";
export async function runKalshiLiveCapture(options = {}) {
    const maxPages = options.maxPages ?? 5;
    const pageLimit = options.pageLimit ?? 50;
    const maxCandidatesPerSeries = options.maxCandidatesPerSeries ?? 10;
    const targetSeriesTickers = options.targetSeriesTickers ?? ["KXBTC", "KXFED", "KXUSCPIYEAR"];
    const maxCandidates = options.maxCandidates ?? targetSeriesTickers.length * maxCandidatesPerSeries;
    const outputRoot = options.outputRoot ??
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
    const candidateMarkets = [];
    const discoveryPages = [];
    const candidateDiscoveryMarkets = new Map();
    const discoveryRecords = [];
    const metadataRecords = [];
    const bookRecords = [];
    const tradeTickerRecords = [];
    const lifecycleFeeRecords = [];
    const families = [];
    const contracts = [];
    const thresholds = [];
    const buckets = [];
    const rules = [];
    for (const seriesTicker of targetSeriesTickers) {
        let cursor;
        let candidatesForSeries = 0;
        for (let page = 0; page < maxPages && candidateMarkets.length < maxCandidates; page += 1) {
            const cursorIn = cursor;
            const pageResponse = await client.listMarkets({
                ...(cursor ? { cursor } : {}),
                limit: pageLimit,
                seriesTicker
            });
            pagesFetched += 1;
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
            const discoveryPageEvent = factory.buildEvent({
                captureSessionId,
                collectorVersion: "live-kalshi-v1",
                endpointOrStream: `/markets?series_ticker=${seriesTicker}&page=${page + 1}`,
                sourceClass: "discovery",
                normalizedTimestampMs: discoveryPageTimestampMs,
                receiptTimestampMs: discoveryPageTimestampMs
            }, pageResponse);
            await acquisition.recordDiscovery(discoveryPageEvent);
            await store.appendSourceEvent(discoveryPageEvent);
            for (const market of pageResponse.markets) {
                const familyClass = classifier.classify(market.title, market.category ?? undefined);
                if (familyClass === "excluded_v1") {
                    continue;
                }
                candidateMarkets.push({
                    ticker: market.ticker,
                    title: market.title,
                    familyClass
                });
                candidateDiscoveryMarkets.set(market.ticker, {
                    marketPayload: market,
                    sourceEventId: discoveryPageEvent.sourceEventId
                });
                candidatesForSeries += 1;
                if (candidateMarkets.length >= maxCandidates) {
                    break;
                }
                if (candidatesForSeries >= maxCandidatesPerSeries) {
                    break;
                }
            }
            if (!cursor || candidateMarkets.length >= maxCandidates || candidatesForSeries >= maxCandidatesPerSeries) {
                break;
            }
        }
        if (candidateMarkets.length >= maxCandidates) {
            break;
        }
    }
    for (const candidate of candidateMarkets) {
        const detail = await client.getMarket(candidate.ticker);
        const orderbook = await client.getOrderbook(candidate.ticker);
        const nowMs = Date.now();
        const metadataEvent = factory.buildEvent({
            captureSessionId,
            collectorVersion: "live-kalshi-v1",
            endpointOrStream: `/markets/${candidate.ticker}`,
            sourceClass: "metadata",
            normalizedTimestampMs: nowMs,
            receiptTimestampMs: nowMs
        }, detail);
        const bookEvent = factory.buildEvent({
            captureSessionId,
            collectorVersion: "live-kalshi-v1",
            endpointOrStream: `/markets/${candidate.ticker}/orderbook`,
            sourceClass: "book",
            normalizedTimestampMs: nowMs,
            receiptTimestampMs: nowMs
        }, {
            market_ticker: candidate.ticker,
            orderbook_fp: orderbook.orderbook_fp
        });
        const tradeTickerEvent = factory.buildEvent({
            captureSessionId,
            collectorVersion: "live-kalshi-v1",
            endpointOrStream: `/markets/${candidate.ticker}`,
            sourceClass: "trade_ticker",
            normalizedTimestampMs: nowMs,
            receiptTimestampMs: nowMs
        }, detail);
        const lifecycleFeeEvent = factory.buildEvent({
            captureSessionId,
            collectorVersion: "live-kalshi-v1",
            endpointOrStream: `/markets/${candidate.ticker}`,
            sourceClass: "lifecycle_fee",
            normalizedTimestampMs: nowMs,
            receiptTimestampMs: nowMs
        }, detail);
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
        const discovery = buildDiscoveryStageRecordFromPayload(discoveryMarket.marketPayload, discoveryMarket.sourceEventId);
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
    const edges = [
        ...graph.generateComplementEdges(contracts, "graph-live-v1"),
        ...graph.generatePartitionEdges(contracts, buckets, "graph-live-v1"),
        ...graph.generateThresholdLadderEdges(contracts, thresholds, "graph-live-v1"),
        ...graph.generateTemporalNestedEdges(contracts, thresholds, "graph-live-v1")
    ];
    const contractIdByVenueContractId = new Map(contracts.map((contract) => [contract.venueContractId, contract.contractId]));
    const stateViews = new InMemoryStateViewsModule({
        booksByContractId: new Map(bookRecords.flatMap((record) => {
            const contractId = contractIdByVenueContractId.get(record.venueContractId);
            return contractId ? [[contractId, record]] : [];
        })),
        lifecycleByContractId: new Map(lifecycleFeeRecords.flatMap((record) => {
            const contractId = contractIdByVenueContractId.get(record.venueContractId);
            return contractId ? [[contractId, record]] : [];
        })),
        tickerByContractId: new Map(tradeTickerRecords.flatMap((record) => {
            const contractId = contractIdByVenueContractId.get(record.venueContractId);
            return contractId ? [[contractId, record]] : [];
        }))
    });
    const quoteStates = [];
    const lifecycleStates = [];
    const feeStates = [];
    const executionStates = [];
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
        feeByContractId: new Map(feeStates.map((state) => [state.contractId, state])),
        quotesByContractId: new Map(quoteStates.map((state) => [state.contractId, state]))
    });
    const internalObservations = [];
    for (const edge of edges) {
        const observation = await observationModule.buildInternalEdgeObservation(edge.edgeId, Date.now());
        if (observation) {
            internalObservations.push(observation);
        }
    }
    const simulationModule = new DeterministicSimulationModule({
        anchorObservationsById: new Map(),
        internalObservationsById: new Map(internalObservations.map((observation) => [observation.observationId, observation]))
    });
    const internalSimulations = [];
    for (const observation of internalObservations.slice(0, 10)) {
        const simulation = await simulationModule.simulateInternal(observation.observationId, "aggressive_all_legs");
        if (simulation) {
            internalSimulations.push(simulation);
        }
    }
    await Promise.all([
        store.writeSnapshot("summaries/capture-summary.json", {
            pagesFetched,
            marketsScanned: candidateMarkets.length,
            targetSeriesTickers,
            maxCandidatesPerSeries,
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
        pagesFetched,
        marketsScanned: candidateMarkets.length,
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
function timestampId(now) {
    return now.toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
}
