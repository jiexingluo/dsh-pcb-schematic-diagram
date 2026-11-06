/** Help script/MCP generators announce finished diagrams through DSH's delivery tool. */
import type { Context } from '@deepseek-ai/cordis';
export declare const inject: string[];
/** Shell output cannot reliably identify written files, so ask for an explicit existing-file delivery. */
export declare function apply(ctx: Context): void;
