import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { FilesystemResearchStore } from "../runtime/filesystem-store.js";
import { DeribitHttpClient } from "../runtime/deribit-api.js";
export async function runDeribitBtcAnchorCapture(options = {}) {
    const outputRoot = options.outputRoot ?? (await resolveLatestCaptureRoot(process.cwd()));
    const currency = options.targetCurrency ?? "BTC";
    const nearExpiryCount = options.nearExpiryCount ?? 3;
    const strikeDistanceFraction = options.strikeDistanceFraction ?? 0.2;
    const client = new DeribitHttpClient();
    const store = new FilesystemResearchStore(outputRoot);
    await store.ensureLayout();
    const [futureInstruments, optionInstruments, futureBooks, optionBooks, referenceSpot] = await Promise.all([
        client.getInstruments(currency, "future"),
        client.getInstruments(currency, "option"),
        client.getBookSummaryByCurrency(currency, "future"),
        client.getBookSummaryByCurrency(currency, "option"),
        readLatestCoinbaseSpot(outputRoot)
    ]);
    const referenceSpotPrice = referenceSpot?.price;
    const selectedFutures = selectNearestExpiries(futureInstruments, futureBooks, nearExpiryCount);
    const selectedOptions = selectRepresentativeOptions(optionInstruments, optionBooks, referenceSpotPrice, nearExpiryCount, strikeDistanceFraction);
    const observationTimeMs = latestSelectedBookTimestamp(selectedFutures, selectedOptions) ??
        latestBookTimestamp([...futureBooks, ...optionBooks]) ??
        Date.now();
    const recordedAtMs = Date.now();
    const rawPayloadRef = "anchors/deribit-btc-anchor-raw.json";
    await store.writeSnapshot(rawPayloadRef, {
        observationTimeMs,
        currency,
        futureInstruments,
        optionInstruments,
        futureBooks,
        optionBooks
    });
    const rawSnapshot = {
        anchorFamily: "btc_thresholds",
        observationTimeMs,
        sourceName: `deribit:${currency}`,
        payloadRef: rawPayloadRef,
        dataQualityScore: 0.85,
        normalizationVersion: "norm-v1",
        ruleParserVersion: "rule-v1",
        feeModelVersion: "fee-v1",
        parseVersion: "deribit-anchor-v1"
    };
    const summary = {
        outputRoot,
        currency,
        observationTimeMs,
        recordedAtMs,
        payloadRef: rawPayloadRef,
        nearExpiryCount,
        strikeDistanceFraction,
        futuresUniverse: futureInstruments.length,
        optionsUniverse: optionInstruments.length,
        selectedFutures: selectedFutures.length,
        selectedOptions: selectedOptions.length,
        ...(referenceSpotPrice === undefined ? {} : { referenceSpotPrice }),
        ...(referenceSpot?.observationTimeMs === undefined ? {} : { referenceSpotObservationTimeMs: referenceSpot.observationTimeMs }),
        ...(referenceSpot?.recordedAtMs === undefined ? {} : { referenceSpotRecordedAtMs: referenceSpot.recordedAtMs }),
        ...(referenceSpot?.payloadRef ? { referenceSpotPayloadRef: referenceSpot.payloadRef } : {}),
        ...(referenceSpot?.observationTimeMs === undefined
            ? {}
            : {
                referenceSpotGapMs: observationTimeMs - referenceSpot.observationTimeMs,
                referenceSpotAgeMs: Math.abs(observationTimeMs - referenceSpot.observationTimeMs)
            })
    };
    await Promise.all([
        store.writeSnapshot("anchors/deribit-btc-anchor-snapshot.json", rawSnapshot),
        store.writeSnapshot("anchors/deribit-btc-futures-selected.json", selectedFutures),
        store.writeSnapshot("anchors/deribit-btc-options-selected.json", selectedOptions),
        store.writeSnapshot("anchors/deribit-btc-anchor-summary.json", summary)
    ]);
    return summary;
}
function latestSelectedBookTimestamp(futures, options) {
    return latestBookTimestamp([
        ...futures.map((future) => future.book).filter(Boolean),
        ...options.map((option) => option.book).filter(Boolean)
    ]);
}
function latestBookTimestamp(books) {
    const timestamps = books
        .map((book) => book?.creation_timestamp)
        .filter((timestamp) => typeof timestamp === "number" && Number.isFinite(timestamp));
    if (timestamps.length === 0) {
        return undefined;
    }
    return Math.max(...timestamps);
}
async function resolveLatestCaptureRoot(cwd) {
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
async function readLatestCoinbaseSpot(outputRoot) {
    const target = path.join(outputRoot, "anchors", "coinbase-btc-spot-summary.json");
    try {
        const raw = await readFile(target, "utf8");
        const payload = JSON.parse(raw);
        return payload;
    }
    catch {
        return undefined;
    }
}
function selectNearestExpiries(instruments, books, nearExpiryCount) {
    const booksByInstrument = new Map(books.map((book) => [book.instrument_name, book]));
    const seen = new Set();
    const selectedExpiries = instruments
        .map((instrument) => instrument.expiration_timestamp)
        .filter((expiry) => {
        if (seen.has(expiry)) {
            return false;
        }
        seen.add(expiry);
        return true;
    })
        .sort((left, right) => left - right)
        .slice(0, nearExpiryCount);
    return instruments
        .filter((instrument) => selectedExpiries.includes(instrument.expiration_timestamp))
        .map((instrument) => {
        const book = booksByInstrument.get(instrument.instrument_name);
        return {
            ...instrument,
            ...(book ? { book } : {})
        };
    });
}
function selectRepresentativeOptions(instruments, books, referenceSpotPrice, nearExpiryCount, strikeDistanceFraction) {
    const booksByInstrument = new Map(books.map((book) => [book.instrument_name, book]));
    const selectedExpiries = Array.from(new Set(instruments.map((instrument) => instrument.expiration_timestamp)))
        .sort((left, right) => left - right)
        .slice(0, nearExpiryCount);
    return instruments
        .filter((instrument) => selectedExpiries.includes(instrument.expiration_timestamp))
        .filter((instrument) => {
        if (referenceSpotPrice === undefined || instrument.strike === undefined) {
            return true;
        }
        const distance = Math.abs(instrument.strike - referenceSpotPrice) / referenceSpotPrice;
        return distance <= strikeDistanceFraction;
    })
        .map((instrument) => {
        const book = booksByInstrument.get(instrument.instrument_name);
        return {
            ...instrument,
            ...(book ? { book } : {})
        };
    })
        .sort((left, right) => {
        if (left.expiration_timestamp !== right.expiration_timestamp) {
            return left.expiration_timestamp - right.expiration_timestamp;
        }
        return (left.strike ?? 0) - (right.strike ?? 0);
    });
}
