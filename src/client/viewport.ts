/** Frame-local zoom with pointer anchoring and reversible event listeners. */
import type { PreparedDiagram } from './svg.ts'

export interface DiagramViewport {
  readonly zoom: (factor: number) => void
  readonly actual: () => void
  readonly fit: () => void
  readonly dispose: () => void
}

/** Mount controls on a loaded frame; callers dispose them on replacement or unmount. */
export function mountViewport(frame: HTMLIFrameElement, prepared: PreparedDiagram, changed: (scale: number) => void): DiagramViewport {
  const doc = frame.contentDocument
  const svg = doc?.querySelector('svg')
  if (!doc || !svg) throw new Error('frame-unavailable')
  let scale = 1
  let fitting = true
  const resize = (requested: number, x = frame.clientWidth / 2, y = frame.clientHeight / 2) => {
    const viewport = doc.scrollingElement
    const prior = scale
    scale = Math.min(4, Math.max(0.25, Number.isFinite(requested) ? requested : 0.25))
    const left = viewport?.scrollLeft ?? 0
    const top = viewport?.scrollTop ?? 0
    svg.style.width = `${prepared.width * scale}px`
    svg.style.height = `${prepared.height * scale}px`
    if (viewport) {
      viewport.scrollLeft = (left + x - 16) * scale / prior - x + 16
      viewport.scrollTop = (top + y - 16) * scale / prior - y + 16
    }
    changed(scale)
  }
  const fit = () => {
    fitting = true
    resize(Math.min((frame.clientWidth - 32) / prepared.width, (frame.clientHeight - 32) / prepared.height))
    doc.defaultView?.scrollTo(0, 0)
  }
  const wheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    fitting = false
    resize(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), event.clientX, event.clientY)
  }
  doc.addEventListener('wheel', wheel, { passive: false })
  const observer = new ResizeObserver(() => { if (fitting) fit() })
  observer.observe(frame)
  fit()
  return {
    zoom: factor => { fitting = false; resize(scale * factor) },
    actual: () => { fitting = false; resize(1) },
    fit,
    dispose: () => { observer.disconnect(); doc.removeEventListener('wheel', wheel) },
  }
}
