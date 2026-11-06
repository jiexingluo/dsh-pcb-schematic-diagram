/** Browser copy for the standalone schematic preview. */
declare const en: {
    readonly title: "PCB Schematic Diagram";
    readonly controls: "Schematic diagram controls";
    readonly zoomOut: "Zoom out";
    readonly zoomIn: "Zoom in";
    readonly actual: "Actual size";
    readonly fit: "Fit window";
    readonly percent: "{value}%";
    readonly invalid: "Cannot preview this schematic diagram. Use a complete UTF-8 SVG with a valid viewBox or positive dimensions.";
    readonly failed: "Could not initialize the viewer. Reload the file to retry.";
};
export declare const dictionaries: {
    en: {
        readonly title: "PCB Schematic Diagram";
        readonly controls: "Schematic diagram controls";
        readonly zoomOut: "Zoom out";
        readonly zoomIn: "Zoom in";
        readonly actual: "Actual size";
        readonly fit: "Fit window";
        readonly percent: "{value}%";
        readonly invalid: "Cannot preview this schematic diagram. Use a complete UTF-8 SVG with a valid viewBox or positive dimensions.";
        readonly failed: "Could not initialize the viewer. Reload the file to retry.";
    };
    zh: {
        readonly title: "PCB Schematic Diagram";
        readonly controls: "原理示意图查看控件";
        readonly zoomOut: "缩小";
        readonly zoomIn: "放大";
        readonly actual: "实际大小";
        readonly fit: "适应窗口";
        readonly percent: "{value}%";
        readonly invalid: "无法预览原理示意图。请使用完整的 UTF-8 SVG，并提供有效的 viewBox 或正数宽高。";
        readonly failed: "查看器初始化失败，请重新加载文件。";
    };
};
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Generated PCB schematic diagram controls. */
        pcbDiagram: keyof typeof en;
    }
}
export {};
