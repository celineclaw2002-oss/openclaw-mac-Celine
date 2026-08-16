import type { FamilyClass } from "../shared/enums.js";
import type { SourceClass, SourceEvent } from "../domain/source-events.js";
import { type KalshiSourceEventInput } from "../venues/kalshi.js";
export interface DiscoveryFamilyClassifier {
    classify(questionText: string, categoryLabel?: string): FamilyClass;
}
export interface AcquisitionModule {
    recordDiscovery(event: SourceEvent): Promise<void>;
    recordMetadata(event: SourceEvent): Promise<void>;
    recordBook(event: SourceEvent): Promise<void>;
    recordTradeTicker(event: SourceEvent): Promise<void>;
    recordLifecycleFee(event: SourceEvent): Promise<void>;
}
export interface SourceEventSink {
    append(event: SourceEvent): Promise<void>;
}
export interface KalshiAcquisitionFactory {
    buildEvent(input: KalshiSourceEventInput, payload: unknown): SourceEvent;
}
export declare class DefaultDiscoveryFamilyClassifier implements DiscoveryFamilyClassifier {
    classify(questionText: string, categoryLabel?: string): FamilyClass;
}
export declare class DefaultKalshiAcquisitionFactory implements KalshiAcquisitionFactory {
    buildEvent(input: KalshiSourceEventInput, payload: unknown): SourceEvent;
}
export declare class InMemorySourceEventSink implements SourceEventSink {
    readonly events: SourceEvent[];
    append(event: SourceEvent): Promise<void>;
    bySourceClass(sourceClass: SourceClass): SourceEvent[];
}
export declare class DefaultAcquisitionModule implements AcquisitionModule {
    private readonly sink;
    constructor(sink: SourceEventSink);
    recordDiscovery(event: SourceEvent): Promise<void>;
    recordMetadata(event: SourceEvent): Promise<void>;
    recordBook(event: SourceEvent): Promise<void>;
    recordTradeTicker(event: SourceEvent): Promise<void>;
    recordLifecycleFee(event: SourceEvent): Promise<void>;
    private assertAndAppend;
}
