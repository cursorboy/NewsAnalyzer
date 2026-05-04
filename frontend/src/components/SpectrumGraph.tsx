import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SAMPLE_ARTICLES, type ArticleMarker } from '../lib/sampleArticles'

// Lay out markers with organic-feeling vertical scatter. Strategy:
// 1) Seed each marker with a pseudo-random y derived from a stable hash of its
//    source + title — guarantees the same article always lands at the same y
//    across renders, but the distribution looks like a natural scatter rather
//    than a horizontal grid.
// 2) Iteratively resolve collisions by nudging overlapping markers apart in y.
//    Continuous values (no fixed tracks) keep the result feeling organic.
function hashString(s: string): number {
  let h = 2166136261 >>> 0 // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function dejitter(input: ArticleMarker[]): ArticleMarker[] {
  const Y_MIN = 0.06
  const Y_MAX = 0.94
  const MIN_DX = 0.07
  const MIN_DY = 0.08
  const X_JITTER = 0.045 // max ± horizontal nudge from the original x
  const out = input.map((m, i) => {
    const seed = hashString(`${m.src || 'src'}|${m.title || ''}|${i}`)
    // Hash → stable y across renders, distributed across the full plot height.
    const ty = (seed % 1000) / 1000
    // Hash → stable x-jitter so a cluster of articles at the same score
    // doesn't form a single vertical column when y tracks are exhausted.
    const tx = ((seed >>> 10) % 1000) / 1000 - 0.5 // [-0.5, 0.5]
    return {
      ...m,
      x: Math.max(-1, Math.min(1, m.x + tx * X_JITTER * 2)),
      y: Y_MIN + ty * (Y_MAX - Y_MIN),
    }
  })

  // Iterative collision resolution. Each pass: for any two markers within the
  // collision zone, push them apart in BOTH axes. Y is preferred (more room),
  // but X gets a small nudge too so densely-packed clusters spread out.
  const STEP_Y = 0.024
  const STEP_X = 0.012
  for (let pass = 0; pass < 40; pass++) {
    let moved = false
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = Math.abs(out[i].x - out[j].x)
        const dy = Math.abs(out[i].y - out[j].y)
        if (dx < MIN_DX && dy < MIN_DY) {
          // Push apart in y first, then nudge x slightly so very-tight x
          // clusters don't keep colliding.
          if (out[i].y <= out[j].y) {
            out[i].y = Math.max(Y_MIN, out[i].y - STEP_Y)
            out[j].y = Math.min(Y_MAX, out[j].y + STEP_Y)
          } else {
            out[i].y = Math.min(Y_MAX, out[i].y + STEP_Y)
            out[j].y = Math.max(Y_MIN, out[j].y - STEP_Y)
          }
          if (out[i].x <= out[j].x) {
            out[i].x = Math.max(-1, out[i].x - STEP_X)
            out[j].x = Math.min(1, out[j].x + STEP_X)
          } else {
            out[i].x = Math.min(1, out[i].x + STEP_X)
            out[j].x = Math.max(-1, out[j].x - STEP_X)
          }
          moved = true
        }
      }
    }
    if (!moved) break
  }
  return out
}

const SPECTRUM_GRADIENT =
  'linear-gradient(to right, #1d3a8a 0%, #2563eb 18%, #93c5fd 38%, #e7e2d2 50%, #fca5a5 62%, #dc2626 82%, #7f1d1d 100%)'

function aggregate(arts: ArticleMarker[]) {
  if (arts.length === 0) return { avg: 0, spread: 0, outlets: 0 }
  const xs = arts.map((a) => a.x)
  const avg = xs.reduce((s, x) => s + x, 0) / xs.length
  const spread = Math.max(...xs) - Math.min(...xs)
  const outlets = new Set(arts.map((a) => a.src)).size
  return { avg, spread, outlets }
}

function fmtSigned(n: number) {
  const sign = n < 0 ? '−' : n > 0 ? '+' : ''
  return `${sign}${Math.abs(n).toFixed(2)}`
}

export default function SpectrumGraph({
  query = 'student loans',
  articles = SAMPLE_ARTICLES,
  height = 400,
  compact = false,
  showAxis = true,
}: {
  query?: string
  articles?: ArticleMarker[]
  height?: number
  compact?: boolean
  showAxis?: boolean
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const innerH = height - 120
  const stats = aggregate(articles)
  const dot = compact ? 8 : 10
  const laidOut = useMemo(() => dejitter(articles), [articles])

  return (
    <div className="relative w-full select-none" style={{ height }}>
      {/* Top-left: count + query + window */}
      <div
        className="absolute left-0 top-0 flex items-baseline gap-3 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55"
      >
        <span className="tabular-nums">{articles.length} articles</span>
        <span className="text-ink/25" aria-hidden>
          ·
        </span>
        <span className="normal-case tracking-normal font-serif italic text-[12px] text-ink/75">
          &ldquo;{query}&rdquo;
        </span>
        <span className="text-ink/25" aria-hidden>
          ·
        </span>
        <span>past 24 hours</span>
      </div>

      {/* Top-right aggregate stats */}
      <div className="absolute right-0 top-0 flex items-baseline gap-5 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        <span className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-ink tabular-nums text-[16px]">
            {fmtSigned(stats.avg)}
          </span>
          <span>avg</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-ink tabular-nums text-[16px]">
            {stats.spread.toFixed(2)}
          </span>
          <span>spread</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-ink tabular-nums text-[16px]">
            {stats.outlets}
          </span>
          <span>outlets</span>
        </span>
      </div>

      {/* Plot area */}
      <div className="absolute left-0 right-0" style={{ top: 24, height: innerH }}>
        {[0.25, 0.5, 0.75].map((t) => (
          <div
            key={t}
            className="absolute left-0 right-0 border-t border-dashed border-ink/10"
            style={{ top: `${t * 100}%` }}
          />
        ))}
        <div className="absolute top-0 bottom-0 w-px bg-ink/20" style={{ left: '50%' }} />

        {laidOut.map((a, i) => {
          const left = `${((a.x + 1) / 2) * 100}%`
          const top = `${a.y * 100}%`
          const isHover = hoverIdx === i
          const Inner = (
            <div className="flex flex-col items-center gap-1">
              <div
                className="rounded-full border border-ink/70 bg-paper-cream shadow-[0_1px_0_rgba(0,0,0,0.08)] cursor-pointer transition-transform"
                style={{
                  width: dot,
                  height: dot,
                  transform: isHover ? 'scale(1.6)' : 'scale(1)',
                }}
              />
              <div className="font-sans text-[9px] tabular-nums uppercase tracking-[0.14em] text-ink/55 whitespace-nowrap">
                {a.short}
              </div>
            </div>
          )
          return (
            <motion.div
              key={`${a.src}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left, top }}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                ease: [0.2, 0.65, 0.3, 1],
                delay: 0.5 + i * 0.04,
              }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((h) => (h === i ? null : h))}
            >
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Open original article: ${a.title}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {Inner}
                </a>
              ) : (
                Inner
              )}

              {isHover && (
                <div
                  className="absolute z-20 left-1/2 -translate-x-1/2 border border-ink/30 bg-paper p-3 max-w-xs shadow-[0_2px_0_rgba(0,0,0,0.06)] pointer-events-none"
                  style={{ bottom: 'calc(100% + 10px)', minWidth: 240 }}
                  role="tooltip"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/55">
                      {a.src}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-ink/65">
                      {fmtSigned(a.x)}
                    </span>
                  </div>
                  <div className="font-serif text-[13px] leading-snug text-ink">
                    {a.title}
                  </div>
                  {a.why ? (
                    <div className="mt-2 font-serif italic text-[12px] leading-snug text-ink/60">
                      {a.why}
                    </div>
                  ) : null}
                  {a.url ? (
                    <div className="mt-2 font-sans text-[9px] uppercase tracking-[0.22em] text-accent">
                      Click to read &rarr;
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Spectrum gradient bar */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ bottom: 60 }}
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 1] }}
      >
        <div className="relative h-[14px]">
          <div
            className="absolute inset-0"
            style={{ background: SPECTRUM_GRADIENT }}
          />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div
              key={t}
              className="absolute top-full w-px bg-ink/40"
              style={{ left: `${t * 100}%`, height: 6 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Axis labels */}
      {showAxis && (
        <div
          className="absolute left-0 right-0 flex items-center justify-between font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55"
          style={{ bottom: 22 }}
        >
          <span>{'←'} Far left</span>
          <span>Lean left</span>
          <span className="text-ink/75">Center</span>
          <span>Lean right</span>
          <span>Far right {'→'}</span>
        </div>
      )}
    </div>
  )
}
