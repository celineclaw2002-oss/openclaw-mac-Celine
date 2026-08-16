import type { FamilyClass, VenueId } from "../shared/enums.js";
import type { PointInTime } from "../shared/time.js";
export type SourceClass = "discovery" | "metadata" | "book" | "trade_ticker" | "lifecycle_fee" | "anchor";
export interface SourceEvent extends PointInTime {
    sourceEventId: string;
    venueId: VenueId;
    sourceClass: SourceClass;
    endpointOrStream: string;
    rawPayload: string;
    payloadHash: string;
    captureSessionId: string;
    collectorVersion: string;
}
export interface DiscoveryStageRecord {
    sourceEventId: string;
    venueContractId: string;
    questionText: string;
    rawStatus?: string;
    openTimeMs?: number;
    closeTimeMs?: number;
    familyClass: FamilyClass;
    parseVersion: string;
    parseSuccess: boolean;
    qualityFlags: string[];
}
export interface MetadataStageRecord {
    sourceEventId: string;
    venueContractId: string;
    questionText: string;
    rulesText: string;
    rulesHash: string;
    resolutionSourceText?: string;
    settlementTimestampConvention?: string;
    settlementTimezone?: string;
    observationWindowText?: string;
    evaluationTimestampMs?: number;
    rawStatus?: string;
    parseVersion: string;
    parseSuccess: boolean;
    qualityFlags: string[];
}
export interface BookStageRecord {
    sourceEventId: string;
    venueContractId: string;
    yesBids: Array<[price: number, size: number]>;
    noBids: Array<[price: number, size: number]>;
    parseVersion: string;
    parseSuccess: boolean;
    qualityFlags: string[];
}
export interface TradeTickerStageRecord {
    sourceEventId: string;
    venueContractId: string;
    lastPrice?: number;
    bestYesBid?: number;
    bestYesAsk?: number;
    bestNoBid?: number;
    bestNoAsk?: number;
    volume?: number;
    openInterest?: number;
    parseVersion: string;
    parseSuccess: boolean;
    qualityFlags: string[];
}
export interface LifecycleFeeStageRecord {
    sourceEventId: string;
    venueContractId: string;
    seriesTicker?: string;
    eventTicker?: string;
    rawStatus?: string;
    canCloseEarly?: boolean;
    feeScheduleId?: string;
    feeType?: string;
    feeMultiplier?: number;
    feeConfig: Record<string, unknown>;
    parseVersion: string;
    parseSuccess: boolean;
    qualityFlags: string[];
}
