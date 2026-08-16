import type { BookStageRecord, DiscoveryStageRecord, LifecycleFeeStageRecord, MetadataStageRecord, SourceEvent, TradeTickerStageRecord } from "../domain/source-events.js";
export interface StagingParser {
    parseDiscovery(event: SourceEvent): DiscoveryStageRecord;
    parseMetadata(event: SourceEvent): MetadataStageRecord;
    parseBook(event: SourceEvent): BookStageRecord;
    parseTradeTicker(event: SourceEvent): TradeTickerStageRecord;
    parseLifecycleFee(event: SourceEvent): LifecycleFeeStageRecord;
}
export declare class KalshiStagingParser implements StagingParser {
    parseDiscovery(event: SourceEvent): DiscoveryStageRecord;
    parseMetadata(event: SourceEvent): MetadataStageRecord;
    parseBook(event: SourceEvent): BookStageRecord;
    parseTradeTicker(event: SourceEvent): TradeTickerStageRecord;
    parseLifecycleFee(event: SourceEvent): LifecycleFeeStageRecord;
    private assertSourceClass;
}
export declare function buildDiscoveryStageRecordFromPayload(payload: unknown, sourceEventId: string): DiscoveryStageRecord;
