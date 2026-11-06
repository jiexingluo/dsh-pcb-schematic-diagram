/** Browser copy for the standalone schematic preview. */
const en = {
  title: 'PCB Schematic Diagram',
  controls: 'Schematic diagram controls',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  actual: 'Actual size',
  fit: 'Fit window',
  percent: '{value}%',
  invalid: 'Cannot preview this schematic diagram. Use a complete UTF-8 SVG with a valid viewBox or positive dimensions.',
  failed: 'Could not initialize the viewer. Reload the file to retry.',
} as const

const zh = {
  title: 'PCB Schematic Diagram',
  controls: '原理示意图查看控件',
  zoomOut: '缩小',
  zoomIn: '放大',
  actual: '实际大小',
  fit: '适应窗口',
  percent: '{value}%',
  invalid: '无法预览原理示意图。请使用完整的 UTF-8 SVG，并提供有效的 viewBox 或正数宽高。',
  failed: '查看器初始化失败，请重新加载文件。',
} as const

export const dictionaries = { en, zh }

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Generated PCB schematic diagram controls. */
    pcbDiagram: keyof typeof en
  }
}
