import { Context } from '@deepseek-ai/cordis'
import { expect, it, vi } from 'vitest'
import { apply } from '../src/index.ts'

it('requests explicit existing-file delivery only when present is available and removes guidance on unload', async () => {
  const ctx = new Context()
  const remove = vi.fn()
  let available = true
  let owner: Context
  let text: ((context: { scope?: never }) => string) | undefined
  ctx.provide('tools', { get: () => available ? {} : undefined } as never)
  ctx.provide('systemPrompt', {
    getSectionOrder: () => 100,
    section: (value: { text: typeof text }) => { text = value.text; owner.effect(() => remove); return remove },
  } as never)
  const fiber = ctx.plugin({ apply: (context: Context) => { owner = context; apply(context) } })
  await fiber.await()
  expect(text?.({})).toContain('call present')
  expect(text?.({})).toContain('.diagram')
  available = false
  expect(text?.({})).toBe('')
  await fiber.dispose()
  expect(remove).toHaveBeenCalledOnce()
})
