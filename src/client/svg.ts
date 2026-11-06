/** Validate SVG bytes and construct an isolated, script-free document. */
import DOMPurify from 'dompurify'

export interface PreparedDiagram {
  readonly html: string
  readonly width: number
  readonly height: number
}

/** Decode a complete UTF-8 diagram. Markdown fences are accepted; malformed XML is rejected. */
export function prepareDiagram(data: Uint8Array<ArrayBuffer>): PreparedDiagram {
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(data).trim()
  const fenced = decoded.match(/^```(?:svg|xml)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/iu)
  const parsed = new DOMParser().parseFromString(fenced?.[1] ?? decoded, 'image/svg+xml')
  const root = parsed.documentElement
  if (parsed.querySelector('parsererror') || parsed.doctype
    || root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('invalid-svg')
  const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/u).map(Number)
  const validBox = box?.length === 4 && box.every(Number.isFinite) && box[2]! > 0 && box[3]! > 0
  const width = validBox ? box[2]! : svgLength(root.getAttribute('width'))
  const height = validBox ? box[3]! : svgLength(root.getAttribute('height'))
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) throw new Error('invalid-size')
  const clean = DOMPurify.sanitize(new XMLSerializer().serializeToString(root), {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['style', 'use'],
    FORBID_TAGS: ['script', 'foreignObject', 'foreignobject', 'a', 'animate', 'animateMotion', 'animateTransform', 'set'],
    FORBID_ATTR: ['src'],
  })
  const cleaned = new DOMParser().parseFromString(clean, 'image/svg+xml')
  if (cleaned.querySelector('parsererror') || cleaned.documentElement.localName !== 'svg') throw new Error('invalid-svg')
  // Preserve local markers, gradients and <use>, and prevent external file/network references.
  for (const node of cleaned.querySelectorAll('*')) {
    for (const attr of Array.from(node.attributes)) {
      if (attr.localName === 'href' && !/^#[^\s]+$/u.test(attr.value)) node.removeAttributeNode(attr)
    }
  }
  const doc = document.implementation.createHTMLDocument('')
  const policy = doc.createElement('meta')
  policy.httpEquiv = 'Content-Security-Policy'
  policy.content = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"
  doc.head.prepend(policy)
  const style = doc.createElement('style')
  style.textContent = 'html{margin:0;width:100%;height:100%;overflow:auto;background:white}body{margin:0;box-sizing:border-box;min-width:100%;min-height:100%;padding:16px;background:white}svg{display:block;max-width:none}'
  doc.head.append(style)
  const svg = doc.importNode(cleaned.documentElement, true)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  if (!validBox) svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  doc.body.append(svg)
  return { html: `<!doctype html>${doc.documentElement.outerHTML}`, width, height }
}

function svgLength(value: string | null): number {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)(px|mm|cm|in|pt|pc)?$/u)
  if (!match) return NaN
  const units: Record<string, number> = { px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72, pc: 16 }
  return Number(match[1]) * (units[match[2] ?? 'px'] ?? NaN)
}
