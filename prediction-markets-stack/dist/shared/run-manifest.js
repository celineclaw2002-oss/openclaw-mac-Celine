import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export async function writeRunManifest(inputs) {
    const generatedAtIso = new Date().toISOString();
    const manifest = {
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
