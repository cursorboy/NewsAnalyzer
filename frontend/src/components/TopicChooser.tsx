import { useState, type FormEvent } from 'react'
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
}

export default function TopicChooser({
  onPick,
  initial,
  gameNumber,
  gameName,
  prompt = 'Pick a topic before we begin.',
}: Props) {
  const [custom, setCustom] = useState(initial ?? '')

  function submit(e: FormEvent) {
    e.preventDefault()
    const t = custom.trim()
    if (t.length < 2) return
    onPick(t)
  }

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
          {SUGGESTED_TOPICS.map((t) => (
            <motion.button
              key={t}
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPick(t)}
              className="border border-ink/30 bg-paper px-4 py-2 font-serif italic text-[15px] text-ink/85 hover:border-ink hover:bg-ink hover:text-paper-cream transition-colors"
            >
              {t}
            </motion.button>
          ))}
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
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. federal interest rate decision"
            className="flex-1 bg-transparent font-serif text-2xl text-ink placeholder:text-ink/30 focus:outline-none md:text-3xl"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={custom.trim().length < 2}
            className="bg-ink px-5 py-2.5 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors disabled:opacity-40 disabled:hover:bg-ink"
          >
            Begin →
          </motion.button>
        </div>
      </form>
    </main>
  )
}
