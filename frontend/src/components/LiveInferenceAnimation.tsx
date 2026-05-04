import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NeuralLoader from './NeuralLoader'

type Props = {
  onComplete?: () => void
}

const STAGES = [
  { label: 'Tokenizing input', duration: 700 },
  { label: 'Embedding article in comparison-bias space', duration: 950 },
  { label: 'Cross-referencing 10,000-hour training corpus', duration: 1200 },
  { label: 'Computing bias vector across 8 dimensions', duration: 950 },
  { label: 'Surfacing loaded phrases & linguistic signals', duration: 800 },
] as const

export default function LiveInferenceAnimation({ onComplete }: Props) {
  const [stageIdx, setStageIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    let elapsed = 0
    const timeouts: number[] = []

    STAGES.forEach((stage, i) => {
      elapsed += stage.duration
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return
          if (i < STAGES.length - 1) {
            setStageIdx(i + 1)
          } else {
            setDone(true)
            onComplete?.()
          }
        }, elapsed),
      )
    })

    return () => {
      cancelled = true
      timeouts.forEach((t) => window.clearTimeout(t))
    }
  }, [onComplete])

  return (
    <section className="border border-ink/20 bg-paper">
      <header className="flex items-baseline justify-between border-b border-ink/15 px-6 py-3">
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-sans">
          Live inference
        </span>
        <span className="font-mono text-[11px] tabular-nums text-ink/55">
          {String(Math.min(stageIdx + 1, STAGES.length)).padStart(2, '0')} / {STAGES.length}
        </span>
      </header>
      <div className="grid gap-8 px-6 py-8 md:grid-cols-[280px_1fr] md:items-center">
        <div className="flex justify-center md:justify-start">
          <NeuralLoader />
        </div>
        <ol className="space-y-3 font-sans">
          {STAGES.map((stage, i) => {
            const state: 'pending' | 'active' | 'done' =
              done || i < stageIdx ? 'done' : i === stageIdx ? 'active' : 'pending'
            return (
              <li key={stage.label} className="grid grid-cols-[auto_1fr] items-baseline gap-3">
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    state === 'pending' ? 'text-ink/30' : 'text-ink/60'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span
                    className={`font-serif text-[15px] leading-snug transition-colors ${
                      state === 'pending'
                        ? 'text-ink/35'
                        : state === 'active'
                        ? 'text-ink'
                        : 'text-ink/70'
                    }`}
                  >
                    {stage.label}
                    <AnimatePresence>
                      {state === 'active' && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="ml-1 text-accent"
                        >
                          …
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <div className="relative h-px w-full bg-ink/10 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-accent"
                      initial={{ width: '0%' }}
                      animate={{
                        width:
                          state === 'done' ? '100%' : state === 'active' ? '100%' : '0%',
                      }}
                      transition={{
                        duration: state === 'active' ? stage.duration / 1000 : 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
