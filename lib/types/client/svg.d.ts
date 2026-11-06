export interface PreparedDiagram {
    readonly html: string;
    readonly width: number;
    readonly height: number;
}
/** Decode a complete UTF-8 diagram. Markdown fences are accepted; malformed XML is rejected. */
export declare function prepareDiagram(data: Uint8Array<ArrayBuffer>): PreparedDiagram;
