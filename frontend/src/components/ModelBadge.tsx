import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MODEL } from '../lib/modelInfo'

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export default function ModelBadge() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="group inline-flex items-center gap-2 border border-ink/15 bg-paper px-3 py-1.5 text-[11px] font-sans uppercase tracking-[0.14em] text-ink hover:border-ink/40 transition-colors"
      >
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
        </span>
        <span className="font-semibold">{MODEL.name} v2</span>
        <span className="text-ink/40">·</span>
        <span className="tabular-nums">{(MODEL.stats.hours / 1000).toFixed(0)},000hr</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-80 border border-ink/15 bg-paper p-5 font-sans text-ink"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-lg font-semibold">{MODEL.name}</span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-ink/50">
                {MODEL.version}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-snug text-ink/70">{MODEL.tagline}</p>
            <div className="my-4 h-px bg-ink/15" />
            <dl className="grid grid-cols-2 gap-y-3 text-[11px]">
              <div>
                <dt className="uppercase tracking-[0.14em] text-ink/50">Hours</dt>
                <dd className="mt-0.5 font-serif text-base tabular-nums">
                  {formatNumber(MODEL.stats.hours)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-ink/50">Articles</dt>
                <dd className="mt-0.5 font-serif text-base tabular-nums">
                  {formatNumber(MODEL.stats.articlesCompared)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-ink/50">Dimensions</dt>
                <dd className="mt-0.5 font-serif text-base tabular-nums">
                  {MODEL.stats.dimensions}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-ink/50">Human agree</dt>
                <dd className="mt-0.5 font-serif text-base tabular-nums">
                  {Math.round(MODEL.stats.humanAgreement * 100)}%
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="uppercase tracking-[0.14em] text-ink/50">Outlets covered</dt>
                <dd className="mt-0.5 font-serif text-base tabular-nums">
                  {formatNumber(MODEL.stats.outletsCovered)}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-ink/15 pt-3 text-[10px] uppercase tracking-[0.14em] text-ink/50">
              <span>Trained {MODEL.trainedOn}</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Live
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
