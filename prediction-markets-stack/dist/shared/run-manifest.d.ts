export interface RunManifest {
    manifestId: string;
    pipelineId: string;
    generatedAtIso: string;
    outputRoot?: string;
    sourceArtifacts: string[];
    parameters: Record<string, unknown>;
    summary: Record<string, unknown>;
}
export declare function writeRunManifest(inputs: {
    pipelineId: string;
    outputRoot?: string;
    sourceArtifacts?: string[];
    parameters?: Record<string, unknown>;
    summary?: Record<string, unknown>;
    manifestsRoot?: string;
}): Promise<RunManifest>;
