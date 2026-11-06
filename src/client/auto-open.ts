/** Open newly written diagrams from live Session facts, without replaying navigation. */
import type { Context } from '@deepseek-ai/cordis'
import type { SessionEventLikeEntry, SessionEventSource } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-tool-present/types'
import type {} from '@deepseek-ai/dsh-tool-executor-ptc/types'
import { fileAddressFor, isAbsoluteWorkspacePath, resolveWorkspacePath } from '@deepseek-ai/dsh-util-workspace-path'

declare module '@deepseek-ai/dsh-api-session-controller/client' {
  interface SessionReferenceSourceMap {
    /** Watches only the foreground Session for generated PCB previews. */
    pcbPreviewAutoOpen: unknown
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mutationPath(name: string, args: unknown): string | undefined {
  if (!record(args)) return undefined
  const path = name === 'str_replace_editor' ? args.path : args.file_path
  if (typeof path !== 'string' || path.trim() === '' || /[\u0000-\u001f\u007f]/u.test(path)) return undefined
  if (name === 'write' && typeof args.content === 'string') return path
  if (name === 'edit' && typeof args.old_string === 'string' && args.old_string.length > 0
    && typeof args.new_string === 'string' && args.new_string !== args.old_string) return path
  if (name !== 'str_replace_editor') return undefined
  if (args.command === 'create' && typeof args.file_text === 'string') return path
  if (args.command === 'str_replace' && typeof args.old_str === 'string' && args.old_str.length > 0
    && (args.new_str === undefined || typeof args.new_str === 'string')) return path
  if (args.command === 'insert' && Number.isInteger(args.insert_line) && Number(args.insert_line) >= 0
    && typeof args.new_str === 'string') return path
  return undefined
}

/** Subscribe to live successful mutations and declarations; history only establishes a baseline. */
export function watchGeneratedFiles(
  feed: SessionEventSource,
  extension: string,
  resolve: (path: string) => string,
  open: (path: string) => void,
): () => void {
  const calls = new Map<string, string>()
  let revision = -1
  let cursor = -1
  const accept = (entry: SessionEventLikeEntry, live: boolean): string[] => {
    if (entry.type !== 'event') return []
    const event = entry.event
    if (live && event.seq <= cursor) return []
    cursor = Math.max(cursor, event.seq)
    if (event.type === 'turn/start' || event.type === 'turn/end') calls.clear()
    if (event.type === 'tool/call') {
      let args: unknown
      try { args = JSON.parse(event.data.arguments) } catch { return [] }
      const path = mutationPath(event.data.name, args)
      if (path !== undefined) calls.set(event.data.callId, resolve(path))
    }
    if (event.type === 'deliverables/presented') return live ? event.data.files.map(file => resolve(file.path)) : []
    if (event.type === 'tool/ptc-dispatch') {
      if (!live || event.data.isError) return []
      const path = mutationPath(event.data.name, event.data.arguments)
      const meta = event.data.meta
      return path === undefined ? [] : [record(meta) && typeof meta.path === 'string' && isAbsoluteWorkspacePath(meta.path)
        ? meta.path : resolve(path)]
    }
    if (event.type !== 'tool/result' || event.surfaceOp !== 'append') return []
    const id = event.data.message.source.callId
    const argumentPath = calls.get(id)
    calls.delete(id)
    if (!live || event.data.message.isError || argumentPath === undefined) return []
    const meta = event.data.meta
    const path = record(meta) && typeof meta.path === 'string' && isAbsoluteWorkspacePath(meta.path)
      ? meta.path : argumentPath
    return [path]
  }
  const baseline = () => {
    calls.clear()
    cursor = -1
    const window = feed.getSnapshot()
    revision = window.revision
    for (const entry of window.entries) accept(entry, false)
  }
  baseline()
  return feed.subscribe(() => {
    const window = feed.getSnapshot()
    if (window.revision === revision) return
    if (window.revision !== revision + 1 || window.change.kind === 'replace' || window.change.kind === 'prepend') {
      baseline()
      return
    }
    revision = window.revision
    if (window.change.kind !== 'append') return
    const paths = window.change.entries.flatMap(entry => accept(entry, true))
    for (const path of new Set(paths)) {
      if (path.toLowerCase().endsWith(`.${extension}`) && !/[\u0000-\u001f\u007f]/u.test(path)) open(path)
    }
  })
}

/** Retain one foreground Session and release its listeners on navigation or connection change. */
export function installAutoOpen(ctx: Context, extension: string): void {
  const connection = ctx.get('connection') as ConnectionHandle
  ctx.effect(() => {
    let stop = () => {}
    const select = () => {
      stop()
      stop = () => {}
      const sessionId = ctx.sidebarRight.mounted.getSnapshot()
      if (sessionId === undefined || connection.generation.getSnapshot() === undefined) return
      const reference = ctx.sessions.retain(sessionId, { source: 'pcbPreviewAutoOpen' })
      const binding = reference.binding
      const unwatch = watchGeneratedFiles(binding.eventSource, extension, path => {
        const current = binding.session.projections.faceOf('workingDirectory').getSnapshot()
        const cwd = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd
        return resolveWorkspacePath(typeof current === 'string' ? current : cwd, path)
      }, path => {
        if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return
        const cwd = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd
        try { ctx.sidebarRight.openResource(fileAddressFor(sessionId, cwd, path), { kind: 'text' }) }
        catch (error) { console.warn('[pcb-preview] Automatic opening failed; open the file manually.', error) }
      })
      stop = () => { unwatch(); reference[Symbol.dispose]() }
    }
    const unmount = ctx.sidebarRight.mounted.subscribe(select)
    const reconnect = connection.generation.subscribe(select)
    select()
    return () => { unmount(); reconnect(); stop() }
  })
}
