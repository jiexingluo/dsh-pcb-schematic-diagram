import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import type { SessionEventLikeEntry, SessionEventSource, SessionEventWindow } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionSeq } from '@deepseek-ai/dsh-session/types'
import type { ToolCallId, MessageId } from '@deepseek-ai/dsh-llm'
import { installAutoOpen, watchGeneratedFiles } from '../src/client/auto-open.ts'

function store<T>(value: T) {
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set: (next: T) => { value = next; for (const listener of [...listeners]) listener() },
    listeners,
  }
}

function feed(initial: readonly SessionEventLikeEntry[] = []) {
  const source = store<SessionEventWindow>({ revision: 0, hasMore: false, entries: initial, change: { kind: 'replace', entries: initial } })
  return {
    ...source,
    append(entry: SessionEventLikeEntry) {
      const previous = source.getSnapshot()
      source.set({ ...previous, revision: previous.revision + 1, entries: [...previous.entries, entry], change: { kind: 'append', entries: [entry] } })
    },
    replace(entries: readonly SessionEventLikeEntry[], kind: 'replace' | 'prepend' = 'replace') {
      source.set({ revision: source.getSnapshot().revision + 1, hasMore: false, entries, change: { kind, entries } })
    },
  }
}

function call(seq: number, path: string, name = 'write', args: Record<string, unknown> = { file_path: path, content: '<svg/>' }, id = 'c'): SessionEventLikeEntry {
  return { type: 'event', event: { type: 'tool/call', seq: seq as SessionSeq, time: seq,
    data: { turn: 1, step: 1, callId: id as ToolCallId, name, arguments: JSON.stringify(args) } } }
}

function result(seq: number, isError = false, path?: string, id = 'c'): SessionEventLikeEntry {
  return { type: 'event', event: { type: 'tool/result', seq: seq as SessionSeq, time: seq, surfaceOp: 'append',
    data: { turn: 1, step: 1, message: { id: `m${seq}` as MessageId, role: 'tool',
      source: { kind: 'tool', callId: id as ToolCallId }, toolCallId: id as ToolCallId, content: [], isError },
      ...(path === undefined ? {} : { meta: { path } }) } } }
}

function presented(seq: number, paths: string[]): SessionEventLikeEntry {
  return { type: 'event', event: { type: 'deliverables/presented', seq: seq as SessionSeq, time: seq,
    data: { turn: 1, callId: 'present' as ToolCallId, files: paths.map(path => ({ path })) } } }
}

describe.each(['resmap', 'diagram'])('%s automatic preview', extension => {
  it('waits for success, uses the recorded target, reopens updates and ignores other suffixes', () => {
    const source = feed()
    const open = vi.fn()
    watchGeneratedFiles(source, extension, path => `C:/work/${path}`, open)
    source.append(call(1, `draft.${extension}`))
    expect(open).not.toHaveBeenCalled()
    source.append(result(2, false, `D:/output/real name #1.${extension.toUpperCase()}`))
    expect(open).toHaveBeenLastCalledWith(`D:/output/real name #1.${extension.toUpperCase()}`)
    source.append(call(3, `updated.${extension}`, 'edit', { file_path: `updated.${extension}`, old_string: 'old', new_string: 'new' }))
    source.append(result(4))
    expect(open).toHaveBeenLastCalledWith(`C:/work/updated.${extension}`)
    source.append(call(5, 'unrelated.txt'))
    source.append(result(6))
    expect(open).toHaveBeenCalledTimes(2)
  })

  it('ignores failed writes, reads, unmatched results and duplicate sequence numbers', () => {
    const source = feed()
    const open = vi.fn()
    watchGeneratedFiles(source, extension, path => path, open)
    source.append(call(1, `a.${extension}`))
    source.append(result(2, true))
    source.append(call(3, `a.${extension}`, 'read'))
    source.append(result(4))
    source.append(result(5, false, `a.${extension}`))
    expect(open).not.toHaveBeenCalled()
    source.append(call(6, `a.${extension}`))
    source.append(result(7))
    source.append(result(7))
    expect(open).toHaveBeenCalledOnce()
  })

  it('does not navigate on initial history, reconnect replacement or older history pages', () => {
    const history = [call(1, `old.${extension}`), result(2)]
    const source = feed(history)
    const open = vi.fn()
    watchGeneratedFiles(source, extension, path => path, open)
    source.replace(history)
    source.replace(history, 'prepend')
    expect(open).not.toHaveBeenCalled()
    source.append(call(3, `new.${extension}`))
    source.append(result(4))
    expect(open).toHaveBeenCalledExactlyOnceWith(`new.${extension}`)
  })

  it('pairs a pending call from the baseline with its subsequent live success', () => {
    const source = feed([call(1, `pending.${extension}`)])
    const open = vi.fn()
    watchGeneratedFiles(source, extension, path => path, open)
    source.append(result(2))
    expect(open).toHaveBeenCalledExactlyOnceWith(`pending.${extension}`)
  })

  it('opens explicit present deliveries from script/MCP output and removes its listener', () => {
    const source = feed()
    const open = vi.fn()
    const dispose = watchGeneratedFiles(source, extension, path => path, open)
    source.append(presented(1, [`finished.${extension}`, 'notes.txt']))
    expect(open).toHaveBeenCalledExactlyOnceWith(`finished.${extension}`)
    dispose()
    source.append(presented(2, [`later.${extension}`]))
    expect(open).toHaveBeenCalledOnce()
    expect(source.listeners.size).toBe(0)
  })

  it('accepts editor mutations but ignores view commands and malformed arguments', () => {
    const source = feed()
    const open = vi.fn()
    watchGeneratedFiles(source, extension, path => path, open)
    for (const [index, command] of ['view', 'create', 'insert', 'str_replace'].entries()) {
      source.append(call(index * 2 + 1, '', 'str_replace_editor', {
        path: `editor.${extension}`, command, file_text: '<svg/>', insert_line: 0, new_str: 'new', old_str: 'old',
      }))
      source.append(result(index * 2 + 2))
    }
    expect(open).toHaveBeenCalledTimes(3)
  })

  it('recognizes completed nested PTC writes and ignores failures, reads and malformed arguments', () => {
    const source = feed()
    const open = vi.fn()
    watchGeneratedFiles(source, extension, path => `C:/work/${path}`, open)
    const dispatch = (seq: number, name: string, args: unknown, isError: boolean) => source.append({
      type: 'event', event: { type: 'tool/ptc-dispatch', seq: seq as SessionSeq, time: seq,
        data: { rootCallId: 'root' as ToolCallId, parentCallId: 'root' as ToolCallId, subCallId: `sub${seq}` as ToolCallId,
          name, arguments: args, isError, content: [] } },
    })
    const args = { file_path: `nested.${extension}`, content: '<svg/>' }
    dispatch(1, 'write', args, true)
    dispatch(2, 'read', args, false)
    dispatch(3, 'write', 'not an object', false)
    expect(open).not.toHaveBeenCalled()
    dispatch(4, 'write', args, false)
    expect(open).toHaveBeenCalledExactlyOnceWith(`C:/work/nested.${extension}`)
  })
})

it('follows only the foreground Session and releases references on navigation, disconnect and unload', async () => {
  const ctx = new Context()
  const selected = store<string | undefined>('one')
  const generation = store<object | undefined>({})
  const feeds: Record<string, ReturnType<typeof feed>> = { one: feed(), two: feed() }
  const releases: string[] = []
  const open = vi.fn()
  ctx.provide('connection', { generation } as never)
  ctx.provide('sidebarRight', { mounted: selected, openResource: open } as never)
  ctx.provide('sessions', {
    list: { getSnapshot: () => ({ byId: { one: { cwd: 'C:/one' }, two: { cwd: 'D:/two' } } }) },
    retain: (id: string) => ({
      binding: { eventSource: feeds[id], session: { projections: { faceOf: () => ({ getSnapshot: () => undefined }) } } },
      [Symbol.dispose]: () => { releases.push(id) },
    }),
  } as never)
  const fiber = ctx.plugin({ apply: (context: Context) => installAutoOpen(context, 'diagram') })
  await fiber.await()
  feeds.one!.append(presented(1, ['first.diagram']))
  expect(open).toHaveBeenLastCalledWith('dsh-resource://file/session/one/first.diagram', { kind: 'text' })
  selected.set('two')
  feeds.one!.append(presented(2, ['background.diagram']))
  expect(open).toHaveBeenCalledOnce()
  feeds.two!.append(presented(1, ['second.diagram']))
  expect(open).toHaveBeenCalledTimes(2)
  generation.set(undefined)
  feeds.two!.append(presented(2, ['disconnected.diagram']))
  generation.set({})
  expect(open).toHaveBeenCalledTimes(2)
  await fiber.dispose()
  expect(feeds.two!.listeners.size).toBe(0)
  expect(selected.listeners.size).toBe(0)
  expect(generation.listeners.size).toBe(0)
  expect(releases).toEqual(['one', 'two', 'two'])
})
