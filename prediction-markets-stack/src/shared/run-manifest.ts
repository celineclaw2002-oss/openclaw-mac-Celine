import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface RunManifest {
  manifestId: string;
  pipelineId: string;
  generatedAtIso: string;
  outputRoot?: string;
  sourceArtifacts: string[];
  parameters: Record<string, unknown>;
  summary: Record<string, unknown>;
}

export async function writeRunManifest(inputs: {
  pipelineId: string;
  outputRoot?: string;
  sourceArtifacts?: string[];
  parameters?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  manifestsRoot?: string;
}): Promise<RunManifest> {
  const generatedAtIso = new Date().toISOString();
  const manifest: RunManifest = {
    manifestId: `${inputs.pipelineId}::${generatedAtIso.replaceAll(":", "").replaceAll(".", "")}`,
    pipelineId: inputs.pipelineId,
    generatedAtIso,
    ...(inputs.outputRoot ? { outputRoot: inputs.outputRoot } : {}),
    sourceArtifacts: inputs.sourceArtifacts ?? [],
    parameters: inputs.parameters ?? {},
    summary: inputs.summary ?? {}
  };

  const manifestsRoot = path.resolve(process.cwd(), inputs.manifestsRoot ?? path.join("data", "run-manifests"));
  await mkdir(manifestsRoot, { recursive: true });
  await writeFile(path.join(manifestsRoot, `${manifest.manifestId}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}
