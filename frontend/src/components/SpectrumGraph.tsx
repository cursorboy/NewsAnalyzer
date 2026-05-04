import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SAMPLE_ARTICLES, type ArticleMarker } from '../lib/sampleArticles'

// Redistribute vertical positions so markers that share roughly the same
// x-position don't visually stack on top of each other. Strategy:
// 1) Sort markers by x.
// 2) Walk left-to-right, placing each marker at the lowest y that doesn't
//    collide (within MIN_DY) with any previously placed marker whose x is
//    within MIN_DX. Wrap to next y track when current track is taken.
// This guarantees no two visible markers share both an x-band and a y-band.
function dejitter(input: ArticleMarker[]): ArticleMarker[] {
  const MIN_DX = 0.10 // x-distance below which markers are considered "close"
  const TRACKS = [0.14, 0.30, 0.46, 0.62, 0.78] // vertical y-tracks
  const out = input.map((m) => ({ ...m }))
  const sorted = out
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.x - b.m.x)
  const placed: { x: number; y: number }[] = []
  for (const { i } of sorted) {
    const x = out[i].x
    // Find the first track that doesn't have a placed marker within MIN_DX of x
    let chosen = TRACKS[0]
    for (const ty of TRACKS) {
      const collides = placed.some(
        (p) => Math.abs(p.x - x) < MIN_DX && Math.abs(p.y - ty) < 0.001,
      )
      if (!collides) {
        chosen = ty
        break
      }
      chosen = ty // fallback: keep last track if all collide
    }
    out[i].y = chosen
    placed.push({ x, y: chosen })
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
