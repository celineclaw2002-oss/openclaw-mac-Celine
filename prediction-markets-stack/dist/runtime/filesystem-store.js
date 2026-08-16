import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export class FilesystemResearchStore {
    rootDir;
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    async ensureLayout() {
        await mkdir(this.rootDir, { recursive: true });
        for (const relative of [
            "raw/discovery",
            "raw/metadata",
            "raw/book",
            "raw/trade_ticker",
            "raw/lifecycle_fee",
            "staging",
            "normalized",
            "graphs",
            "anchors",
            "summaries",
            "state",
            "observations",
            "simulations"
        ]) {
            await mkdir(path.join(this.rootDir, relative), { recursive: true });
        }
    }
    async appendSourceEvent(event) {
        const target = path.join(this.rootDir, "raw", event.sourceClass, `${event.captureSessionId}.jsonl`);
        await appendFile(target, `${JSON.stringify(event)}\n`, "utf8");
        return target;
    }
    async writeSnapshot(relativePath, payload) {
        const target = path.join(this.rootDir, relativePath);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
        return target;
    }
}
