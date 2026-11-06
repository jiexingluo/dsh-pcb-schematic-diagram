// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { expect, it, vi } from 'vitest'
vi.mock('../src/client/Diagram.tsx', () => ({ Diagram: () => null }))
import { apply } from '../src/client/index.ts'

it('registers only diagram files and retires contributions on unload', async () => {
  const ctx = new Context()
  const removeLocale = vi.fn()
  const removePreview = vi.fn()
  const removeSlot = vi.fn()
  const registerPreview = vi.fn((_options: unknown) => removePreview)
  const registerSlot = vi.fn((_options: unknown) => removeSlot)
  ctx.provide('locale', { register: () => removeLocale, bind: () => () => 'PCB Schematic Diagram' } as never)
  ctx.provide('documentPreviews', { register: registerPreview } as never)
  ctx.provide('slots', {
    inject: (_name: string, callback: () => () => void) => callback(), register: registerSlot,
  } as never)
  const fiber = ctx.plugin({ apply })
  try {
    await fiber.await()
    expect(registerPreview.mock.calls[0]?.[0]).toMatchObject({
      id: 'dsh-pcb-schematic-diagram', extensions: ['diagram'], loading: 'bytes-complete',
    })
    expect(registerSlot.mock.calls[0]?.[0]).toMatchObject({ name: 'sidebar.right.tab.document', locale: 'pcbDiagram' })
    await fiber.dispose()
    expect(removeLocale).toHaveBeenCalledOnce()
    expect(removePreview).toHaveBeenCalledOnce()
    expect(removeSlot).toHaveBeenCalledOnce()
  } finally { await fiber.dispose() }
})
