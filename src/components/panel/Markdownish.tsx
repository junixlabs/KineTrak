import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

// Dependency-free, XSS-safe markdown-lite renderer for agent/human-authored
// descriptions (specs, dated notes, rules). It builds React elements — never
// dangerouslySetInnerHTML — so all text is escaped by React and there is no
// injection surface (safe even in the anonymous share viewer). Supports the
// small subset those descriptions actually use: #/##/### headings, -/*/+ and
// 1. lists, ``` fenced code, blank-line paragraphs with soft line breaks, and
// inline `code`, **bold**, [text](url) links and bare-URL autolinks.

/** Only allow safe link targets (http/https or in-app relative); anything else
 *  (e.g. javascript:) renders as plain text, not a link. */
function safeHref(u: string): string | undefined {
  return /^(https?:\/\/|\/)/i.test(u) ? u : undefined
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1] !== undefined) {
      out.push(<code key={key} className="rounded bg-[#eef1f5] px-1 py-0.5 font-mono text-[11.5px] text-[#3a4048]">{m[1]}</code>)
    } else if (m[2] !== undefined) {
      out.push(<strong key={key} className="font-bold text-ink">{m[2]}</strong>)
    } else if (m[3] !== undefined) {
      const href = safeHref(m[4])
      out.push(href ? <a key={key} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-brand underline decoration-[#c9d8ff] underline-offset-2 hover:decoration-brand">{m[3]}</a> : m[0])
    } else if (m[5] !== undefined) {
      const href = safeHref(m[5])
      out.push(href ? <a key={key} href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="break-all text-brand underline decoration-[#c9d8ff] underline-offset-2 hover:decoration-brand">{m[5]}</a> : m[0])
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const HEAD = /^(#{1,3})\s+(.*)$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const NUM = /^\s*\d+\.\s+(.*)$/

export function Markdownish({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let para: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let code: string[] | null = null
  let k = 0

  const flushPara = () => {
    if (!para.length) return
    const key = `p${k++}`
    blocks.push(
      <p key={key} className="text-[13px] leading-[1.55] text-[#3a4048]">
        {para.map((ln, i) => (
          <span key={i}>
            {inline(ln, `${key}-${i}`)}
            {i < para.length - 1 && <br />}
          </span>
        ))}
      </p>,
    )
    para = []
  }
  const flushList = () => {
    if (!list) return
    const key = `l${k++}`
    const items = list.items.map((it, i) => (
      <li key={i} className="leading-[1.5]">{inline(it, `${key}-${i}`)}</li>
    ))
    blocks.push(
      list.ordered ? (
        <ol key={key} className="list-decimal space-y-0.5 pl-5 text-[13px] text-[#3a4048]">{items}</ol>
      ) : (
        <ul key={key} className="list-disc space-y-0.5 pl-5 text-[13px] text-[#3a4048]">{items}</ul>
      ),
    )
    list = null
  }

  for (const raw of lines) {
    // fenced code block
    if (raw.trimStart().startsWith('```')) {
      if (code) {
        blocks.push(<pre key={`c${k++}`} className="overflow-x-auto rounded-lg bg-[#f6f8fb] p-2.5 font-mono text-[11.5px] leading-[1.5] text-[#3a4048]">{code.join('\n')}</pre>)
        code = null
      } else {
        flushPara(); flushList(); code = []
      }
      continue
    }
    if (code) { code.push(raw); continue }

    const h = HEAD.exec(raw)
    if (h) {
      flushPara(); flushList()
      const lvl = h[1].length
      const cls = lvl === 1 ? 'text-[14.5px]' : lvl === 2 ? 'text-[13.5px]' : 'text-[12.5px]'
      blocks.push(<div key={`h${k++}`} className={`mt-1 font-bold text-ink ${cls}`}>{inline(h[2], `h${k}`)}</div>)
      continue
    }
    const b = BULLET.exec(raw)
    const n = NUM.exec(raw)
    if (b || n) {
      flushPara()
      const ordered = !!n
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] } }
      list.items.push((b ? b[1] : n![1]))
      continue
    }
    if (raw.trim() === '') { flushPara(); flushList(); continue }
    para.push(raw)
  }
  flushPara(); flushList()
  if (code) blocks.push(<pre key={`c${k++}`} className="overflow-x-auto rounded-lg bg-[#f6f8fb] p-2.5 font-mono text-[11.5px] leading-[1.5] text-[#3a4048]">{code.join('\n')}</pre>)

  return <div className="space-y-2">{blocks}</div>
}

/** Description field: renders formatted markdown; click to edit as an auto-growing
 *  textarea; blur returns to the rendered view. Read-only (snapshot) never edits. */
export function MarkdownField({
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  readOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const grow = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useLayoutEffect(() => { if (editing) grow() }, [editing])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  if (!readOnly && editing) {
    return (
      <textarea
        ref={ref}
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); grow() }}
        onBlur={() => setEditing(false)}
        rows={3}
        className="w-full resize-none overflow-hidden rounded-lg border border-brand bg-white px-2.5 py-2 text-[13px] leading-[1.55] text-[#3a4048] outline-none"
      />
    )
  }

  const hasText = value.trim().length > 0
  return (
    <div
      onClick={() => { if (!readOnly) setEditing(true) }}
      className={`rounded-lg px-2.5 py-2 ${readOnly ? '' : 'cursor-text hover:bg-[#f7f9fc]'} ${hasText ? '' : 'text-[13px] text-faint'}`}
      title={readOnly ? undefined : 'Click to edit'}
    >
      {hasText ? <Markdownish text={value} /> : (placeholder ?? 'Empty')}
    </div>
  )
}
