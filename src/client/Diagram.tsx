/** File bytes are supplied by DSH; this component owns only the preview. */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { DocumentPreviewProps } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { prepareDiagram, type PreparedDiagram } from './svg.ts'
import { mountViewport, type DiagramViewport } from './viewport.ts'
import type {} from './locales.ts'
import css from './Diagram.module.css'

type DiagramProps = DocumentPreviewProps & PropsLocale<'pcbDiagram'>

/** Render an isolated diagram or a localized validation error. */
export function Diagram(props: DiagramProps): ReactNode {
  const data = props.content.kind === 'bytes' ? props.content.data : undefined
  const prepared = useMemo(() => {
    if (!data) return undefined
    try { return prepareDiagram(data) } catch (error) {
      if (!(error instanceof Error)) throw error
      return undefined
    }
  }, [data])
  if (!prepared) return <div className={css.error} role="alert">{props.t('invalid')}</div>
  // A changed document gets a fresh frame and state. Identical-byte reloads stay ready.
  return <DiagramFrame key={prepared.html} prepared={prepared} t={props.t} />
}

function DiagramFrame({ prepared, t }: { prepared: PreparedDiagram; t: DiagramProps['t'] }): ReactNode {
  const controls = useRef<DiagramViewport>()
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => () => { controls.current?.dispose() }, [])
  return <div className={css.root}>
    <div className={css.toolbar} role="group" aria-label={t('controls')}>
      <Button size="sm" disabled={!ready || scale <= 0.25} onClick={() => controls.current?.zoom(1 / 1.15)}>{t('zoomOut')}</Button>
      <span className={css.scale} aria-live="polite">{t('percent', { value: Math.round(scale * 100) })}</span>
      <Button size="sm" disabled={!ready || scale >= 4} onClick={() => controls.current?.zoom(1.15)}>{t('zoomIn')}</Button>
      <Button size="sm" disabled={!ready} onClick={() => controls.current?.actual()}>{t('actual')}</Button>
      <Button size="sm" disabled={!ready} onClick={() => controls.current?.fit()}>{t('fit')}</Button>
    </div>
    {failed && <p className={css.error} role="alert">{t('failed')}</p>}
    <iframe className={css.frame} title={t('title')} sandbox="allow-same-origin" referrerPolicy="no-referrer"
      srcDoc={prepared.html} onLoad={(event) => {
        controls.current?.dispose()
        controls.current = undefined
        try {
          controls.current = mountViewport(event.currentTarget, prepared, setScale)
          setFailed(false)
          setReady(true)
        } catch (error) {
          if (!(error instanceof Error)) throw error
          setReady(false)
          setFailed(true)
        }
      }} />
  </div>
}
