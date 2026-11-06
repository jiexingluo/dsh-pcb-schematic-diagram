/** Open newly written diagrams from live Session facts, without replaying navigation. */
import type { Context } from '@deepseek-ai/cordis';
import type { SessionEventSource } from '@deepseek-ai/dsh-api-session-controller/client';
declare module '@deepseek-ai/dsh-api-session-controller/client' {
    interface SessionReferenceSourceMap {
        /** Watches only the foreground Session for generated PCB previews. */
        pcbPreviewAutoOpen: unknown;
    }
}
/** Subscribe to live successful mutations and declarations; history only establishes a baseline. */
export declare function watchGeneratedFiles(feed: SessionEventSource, extension: string, resolve: (path: string) => string, open: (path: string) => void): () => void;
/** Retain one foreground Session and release its listeners on navigation or connection change. */
export declare function installAutoOpen(ctx: Context, extension: string): void;
