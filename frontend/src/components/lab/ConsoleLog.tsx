import { useEffect, useRef } from 'react'

export interface LogLine {
  ts: number
  text: string
}

function fmt(ts: number) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

export default function ConsoleLog({ lines, height = 260 }: { lines: LogLine[]; height?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [lines])

  return (
    <div
      ref={ref}
      className="overflow-auto border border-ink/30 bg-ink/[0.97] text-paper-cream/90 font-mono text-[12px] leading-[1.6] p-3"
      style={{ height }}
    >
      {lines.length === 0 ? (
        <span className="text-paper-cream/35">{'> awaiting commands …'}</span>
      ) : (
        lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <span className="text-paper-cream/40">[{fmt(l.ts)}]</span>{' '}
            <span>{l.text}</span>
          </div>
        ))
      )}
    </div>
  )
}
