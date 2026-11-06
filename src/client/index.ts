/** Right-sidebar renderer for generated SVG schematic diagrams. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { Diagram } from './Diagram.tsx'
import { dictionaries } from './locales.ts'
import { installAutoOpen } from './auto-open.ts'

export const inject = ['documentPreviews', 'slots', 'locale', 'sessions', 'sidebarRight', 'connection']

/** Register metadata, localized copy and a disposable document-body renderer. */
export function apply(ctx: Context): void {
  const id = 'dsh-pcb-schematic-diagram'
  ctx.effect(() => ctx.locale.register('pcbDiagram', dictionaries))
  const t = ctx.locale.bind('pcbDiagram')
  ctx.effect(() => ctx.documentPreviews.register({ id, extensions: ['diagram'], title: () => t('title'), loading: 'bytes-complete' }))
  ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({
    name: 'sidebar.right.tab.document', key: id, locale: 'pcbDiagram',
  }, Diagram)))
  installAutoOpen(ctx, 'diagram')
}
