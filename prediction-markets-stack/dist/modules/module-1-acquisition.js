import { buildSourceEvent, classifyKalshiFamily } from "../venues/kalshi.js";
export class DefaultDiscoveryFamilyClassifier {
    classify(questionText, categoryLabel) {
        return classifyKalshiFamily(questionText, categoryLabel);
    }
}
export class DefaultKalshiAcquisitionFactory {
    buildEvent(input, payload) {
        return buildSourceEvent(input, payload);
    }
}
export class InMemorySourceEventSink {
    events = [];
    async append(event) {
        this.events.push(event);
    }
    bySourceClass(sourceClass) {
        return this.events.filter((event) => event.sourceClass === sourceClass);
    }
}
export class DefaultAcquisitionModule {
    sink;
    constructor(sink) {
        this.sink = sink;
    }
    recordDiscovery(event) {
        return this.assertAndAppend(event, "discovery");
    }
    recordMetadata(event) {
        return this.assertAndAppend(event, "metadata");
    }
    recordBook(event) {
        return this.assertAndAppend(event, "book");
    }
    recordTradeTicker(event) {
        return this.assertAndAppend(event, "trade_ticker");
    }
    recordLifecycleFee(event) {
        return this.assertAndAppend(event, "lifecycle_fee");
    }
    async assertAndAppend(event, sourceClass) {
        if (event.sourceClass !== sourceClass) {
            throw new Error(`Expected source class ${sourceClass} but received ${event.sourceClass}.`);
        }
        await this.sink.append(event);
    }
}
