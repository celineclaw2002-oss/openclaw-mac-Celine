import type { SourceEvent } from "../domain/source-events.js";
export declare class FilesystemResearchStore {
    readonly rootDir: string;
    constructor(rootDir: string);
    ensureLayout(): Promise<void>;
    appendSourceEvent(event: SourceEvent): Promise<string>;
    writeSnapshot(relativePath: string, payload: unknown): Promise<string>;
}
