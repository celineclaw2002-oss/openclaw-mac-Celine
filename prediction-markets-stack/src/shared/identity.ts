export interface VersionLineage {
  normalizationVersion: string;
  ruleParserVersion: string;
  feeModelVersion: string;
  parseVersion: string;
}

export interface ReplayLineage extends VersionLineage {
  graphVersion?: string;
  anchorModelVersion?: string;
  calibrationVersion?: string;
  simulationVersion?: string;
}

export function deterministicKey(parts: Array<string | number | boolean>): string {
  return parts.map(String).join("::");
}
