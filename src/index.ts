/** Help script/MCP generators announce finished diagrams through DSH's delivery tool. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'

export const inject = ['systemPrompt', 'tools']

/** Shell output cannot reliably identify written files, so ask for an explicit existing-file delivery. */
export function apply(ctx: Context): void {
  ctx.systemPrompt.section({
    name: 'pcb-diagram-auto-preview',
    order: ctx.systemPrompt.getSectionOrder('TOOL_WRITE'),
    text: ({ scope }) => ctx.tools.get('present', scope) === undefined ? ''
      : 'After successfully generating or updating a .diagram file using a shell, script, or MCP tool, '
        + 'call present with the final existing file path so its PCB diagram preview can open automatically. '
        + 'Do not present files merely read or mentioned, and do not present failed or incomplete output. '
        + 'Built-in write/edit operations already trigger the diagram preview.',
  })
}
