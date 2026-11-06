/** File bytes are supplied by DSH; this component owns only the preview. */
import { type ReactNode } from 'react';
import type { DocumentPreviewProps } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
type DiagramProps = DocumentPreviewProps & PropsLocale<'pcbDiagram'>;
/** Render an isolated diagram or a localized validation error. */
export declare function Diagram(props: DiagramProps): ReactNode;
export {};
