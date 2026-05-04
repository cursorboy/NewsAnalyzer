import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'

const SUGGESTED_TOPICS = [
  'us politics',
  'immigration',
  'climate change',
  'economy',
  'foreign policy',
  'student loans',
  'gun policy',
  'healthcare',
  'tariffs',
  'tech policy',
] as const

type Props = {
  onPick: (topic: string) => void
  initial?: string
  gameNumber: string
  gameName: string
  prompt?: string
  loading?: boolean
}

export default function TopicChooser({
  onPick,
  initial,
  gameNumber,
  gameName,
  prompt = 'Pick a topic before we begin.',
  loading = false,
}: Props) {
  const [selected, setSelected] = useState(initial ?? '')
  const [pickedSuggestion, setPickedSuggestion] = useState<string | null>(null)
  const beginRef = useRef<HTMLButtonElement | null>(null)

  const trimmed = selected.trim()
  const ready = trimmed.length >= 2 && !loading
  const justSubmitted = useRef(false)

  function pickSuggestion(t: string) {
    setSelected(t)
    setPickedSuggestion(t)
  }

  function onTypeChange(v: string) {
    setSelected(v)
    setPickedSuggestion(null)
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!ready) return
    justSubmitted.current = true
    onPick(trimmed)
  }

  // Auto-scroll the Begin row into view once a topic is selected, so the
  // user always sees the active button after picking a chip.
  useEffect(() => {
    if (!ready || loading) return
    if (beginRef.current) {
      beginRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [ready, loading])

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
      <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
        {gameNumber} · {gameName}
      </p>
      <h1 className="mt-4 font-display font-black text-[44px] md:text-[64px] leading-[1.0] tracking-mega-tight text-ink">
        Choose a topic.
      </h1>
      <p className="mt-5 max-w-xl font-serif italic text-lg text-ink/70 md:text-xl">
        {prompt}
      </p>

      {/* Suggested topic chips */}
      <div className="mt-10 border-t border-ink/15 pt-6">
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Suggested
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {SUGGESTED_TOPICS.map((t) => {
            const active = pickedSuggestion === t
            return (
              <motion.button
                key={t}
                type="button"
                whileHover={loading ? undefined : { scale: 1.04, y: -2 }}
                whileTap={loading ? undefined : { scale: 0.96 }}
                disabled={loading}
                onClick={() => pickSuggestion(t)}
                className={[
                  'border px-4 py-2 font-serif italic text-[15px] transition-colors',
                  active
                    ? 'border-ink bg-ink text-paper-cream'
                    : 'border-ink/30 bg-paper text-ink/85 hover:border-ink hover:bg-ink hover:text-paper-cream',
                  loading ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {t}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Custom topic input */}
      <form onSubmit={submit} className="mt-10 border-t border-ink/15 pt-6">
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Or type your own
        </p>
        <div className="mt-4 flex items-end gap-4 border-b-2 border-ink pb-2 transition-colors focus-within:border-accent">
          <input
            type="text"
            value={selected}
            onChange={(e) => onTypeChange(e.target.value)}
            placeholder="e.g. federal interest rate decision"
            disabled={loading}
            className="flex-1 bg-transparent font-serif text-2xl text-ink placeholder:text-ink/30 focus:outline-none md:text-3xl disabled:opacity-50"
          />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
            {loading
              ? 'loading · please wait'
              : ready
                ? `topic · ${trimmed}`
                : 'select a suggestion or type one'}
          </p>
          <motion.button
            ref={beginRef}
            type="submit"
            whileHover={ready ? { scale: 1.03 } : undefined}
            whileTap={ready ? { scale: 0.97 } : undefined}
            disabled={!ready}
            aria-disabled={!ready}
            className={[
              'px-6 py-3 font-sans text-[12px] uppercase tracking-[0.22em] transition-all',
              ready
                ? 'bg-ink text-paper-cream hover:bg-accent cursor-pointer'
                : 'bg-ink/10 text-ink/35 cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? 'Loading…' : 'Begin →'}
          </motion.button>
        </div>
      </form>
    </main>
  )
}
