import type { FamilyClass } from "../shared/enums.js";
import type { SourceClass, SourceEvent } from "../domain/source-events.js";
import {
  buildSourceEvent,
  classifyKalshiFamily,
  type KalshiSourceEventInput
} from "../venues/kalshi.js";

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

export class DefaultDiscoveryFamilyClassifier implements DiscoveryFamilyClassifier {
  classify(questionText: string, categoryLabel?: string): FamilyClass {
    return classifyKalshiFamily(questionText, categoryLabel);
  }
}

export class DefaultKalshiAcquisitionFactory implements KalshiAcquisitionFactory {
  buildEvent(input: KalshiSourceEventInput, payload: unknown): SourceEvent {
    return buildSourceEvent(input, payload);
  }
}

export class InMemorySourceEventSink implements SourceEventSink {
  readonly events: SourceEvent[] = [];

  async append(event: SourceEvent): Promise<void> {
    this.events.push(event);
  }

  bySourceClass(sourceClass: SourceClass): SourceEvent[] {
    return this.events.filter((event) => event.sourceClass === sourceClass);
  }
}

export class DefaultAcquisitionModule implements AcquisitionModule {
  constructor(private readonly sink: SourceEventSink) {}

  recordDiscovery(event: SourceEvent): Promise<void> {
    return this.assertAndAppend(event, "discovery");
  }

  recordMetadata(event: SourceEvent): Promise<void> {
    return this.assertAndAppend(event, "metadata");
  }

  recordBook(event: SourceEvent): Promise<void> {
    return this.assertAndAppend(event, "book");
  }

  recordTradeTicker(event: SourceEvent): Promise<void> {
    return this.assertAndAppend(event, "trade_ticker");
  }

  recordLifecycleFee(event: SourceEvent): Promise<void> {
    return this.assertAndAppend(event, "lifecycle_fee");
  }

  private async assertAndAppend(event: SourceEvent, sourceClass: SourceClass): Promise<void> {
    if (event.sourceClass !== sourceClass) {
      throw new Error(`Expected source class ${sourceClass} but received ${event.sourceClass}.`);
    }
    await this.sink.append(event);
  }
}
