import { DefaultAcquisitionModule, DefaultKalshiAcquisitionFactory, InMemorySourceEventSink } from "../modules/module-1-acquisition.js";
import { KalshiStagingParser } from "../modules/module-2-staging.js";
import { KalshiNormalizationModule } from "../modules/module-3-normalization.js";
import { DeterministicGraphModule } from "../modules/module-4-graph.js";
export async function runKalshiBtcThresholdDemo() {
    const factory = new DefaultKalshiAcquisitionFactory();
    const sink = new InMemorySourceEventSink();
    const acquisition = new DefaultAcquisitionModule(sink);
    const parser = new KalshiStagingParser();
    const normalization = new KalshiNormalizationModule();
    const graph = new DeterministicGraphModule();
    const captureBase = {
        captureSessionId: "demo-session",
        collectorVersion: "collector-v1",
        normalizedTimestampMs: Date.UTC(2026, 7, 16, 15, 0, 0),
        receiptTimestampMs: Date.UTC(2026, 7, 16, 15, 0, 0)
    };
    const thresholdMarket = {
        ticker: "KXBTC-2026-12-31-110K",
        title: "Will BTC exceed $110,000 on December 31, 2026?",
        category: "Crypto",
        status: "active",
        rules_primary: "This market resolves YES if the BTC/USD reference is above 110000 at 4:00 PM ET on December 31, 2026.",
        settlement_source: "Kalshi BTC reference",
        settlement_timezone: "ET",
        settlement_time: "4:00 PM ET"
    };
    const bucketLow = {
        ticker: "KXBTC-2026-12-31-100-110K",
        title: "Will BTC settle between $100,000 and $110,000 on December 31, 2026?",
        category: "Crypto",
        status: "active",
        rules_primary: "This market resolves YES if the BTC/USD reference is between 100000 and 110000 at 4:00 PM ET on December 31, 2026.",
        settlement_source: "Kalshi BTC reference",
        settlement_timezone: "ET",
        settlement_time: "4:00 PM ET"
    };
    const bucketHigh = {
        ticker: "KXBTC-2026-12-31-110-120K",
        title: "Will BTC settle between $110,000 and $120,000 on December 31, 2026?",
        category: "Crypto",
        status: "active",
        rules_primary: "This market resolves YES if the BTC/USD reference is between 110000 and 120000 at 4:00 PM ET on December 31, 2026.",
        settlement_source: "Kalshi BTC reference",
        settlement_timezone: "ET",
        settlement_time: "4:00 PM ET"
    };
    const discoveryEvents = [thresholdMarket, bucketLow, bucketHigh].map((payload, index) => factory.buildEvent({
        ...captureBase,
        endpointOrStream: "/markets/discovery",
        sourceClass: "discovery",
        normalizedTimestampMs: captureBase.normalizedTimestampMs + index
    }, payload));
    const metadataEvents = [thresholdMarket, bucketLow, bucketHigh].map((payload, index) => factory.buildEvent({
        ...captureBase,
        endpointOrStream: "/markets/metadata",
        sourceClass: "metadata",
        normalizedTimestampMs: captureBase.normalizedTimestampMs + 100 + index
    }, payload));
    for (const event of discoveryEvents) {
        await acquisition.recordDiscovery(event);
    }
    for (const event of metadataEvents) {
        await acquisition.recordMetadata(event);
    }
    const discoveries = discoveryEvents.map((event) => parser.parseDiscovery(event));
    const metadatas = metadataEvents.map((event) => parser.parseMetadata(event));
    const contracts = discoveries.map((discovery, index) => normalization.buildContract(discovery, metadatas[index]));
    const thresholds = contracts
        .map((contract, index) => normalization.buildThreshold(contract, metadatas[index]))
        .filter((value) => value !== null);
    const buckets = contracts
        .map((contract, index) => normalization.buildBucket(contract, metadatas[index]))
        .filter((value) => value !== null);
    const thresholdEdges = graph.generateThresholdLadderEdges(contracts, thresholds, "graph-v1");
    const partitionEdges = graph.generatePartitionEdges(contracts, buckets, "graph-v1");
    const complementEdges = graph.generateComplementEdges(contracts, "graph-v1");
    return {
        sourceEventsCaptured: sink.events.length,
        normalizedContracts: contracts.length,
        thresholdCount: thresholds.length,
        bucketCount: buckets.length,
        complementEdges: complementEdges.length,
        partitionEdges: partitionEdges.length,
        thresholdEdges: thresholdEdges.length
    };
}
