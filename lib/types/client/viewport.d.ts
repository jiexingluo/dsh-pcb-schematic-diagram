/** Frame-local zoom with pointer anchoring and reversible event listeners. */
import type { PreparedDiagram } from './svg.ts';
export interface DiagramViewport {
    readonly zoom: (factor: number) => void;
    readonly actual: () => void;
    readonly fit: () => void;
    readonly dispose: () => void;
}
/** Mount controls on a loaded frame; callers dispose them on replacement or unmount. */
export declare function mountViewport(frame: HTMLIFrameElement, prepared: PreparedDiagram, changed: (scale: number) => void): DiagramViewport;
