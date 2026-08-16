export interface PointInTime {
  venueTimestampMs?: number;
  receiptTimestampMs: number;
  normalizedTimestampMs: number;
}

export interface ValidityWindow {
  validFromMs: number;
  validToMs?: number;
}
