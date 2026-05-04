import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Outcome = 'correct' | 'wrong' | 'partial'

type Props = {
  outcome: Outcome
  headline: string
  detail?: string
  children?: ReactNode
}

const TONE: Record<
  Outcome,
  { wash: string; accent: string; tag: string; border: string }
> = {
  correct: {
    wash: 'bg-emerald-500',
    accent: 'text-emerald-700',
    tag: 'Right',
    border: 'border-emerald-600',
  },
  wrong: {
    wash: 'bg-accent',
    accent: 'text-accent',
    tag: 'Wrong',
    border: 'border-accent',
  },
  partial: {
    wash: 'bg-amber-400',
    accent: 'text-amber-600',
    tag: 'Close',
    border: 'border-amber-500',
  },
}

export default function RoundFeedback({ outcome, headline, detail, children }: Props) {
  const t = TONE[outcome]
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden border-2 ${t.border} bg-paper`}
    >
      <motion.span
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.18, 0.18] }}
        transition={{ duration: 0.9, times: [0, 0.18, 0.6, 1] }}
        className={`absolute inset-0 ${t.wash}`}
      />
      <div className="relative px-6 md:px-8 py-7 md:py-9">
        <div className="flex items-baseline gap-5 flex-wrap">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className={`font-sans uppercase tracking-[0.22em] text-xs md:text-sm font-semibold ${t.accent}`}
          >
            {t.tag}
          </motion.span>
          <motion.span
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.32 }}
            className={`font-serif text-4xl md:text-5xl font-semibold leading-tight ${t.accent}`}
          >
            {headline}
          </motion.span>
        </div>
        {detail && (
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.3 }}
            className="mt-3 font-serif text-lg md:text-xl italic text-ink/75 max-w-2xl leading-snug"
          >
            {detail}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.3 }}
            className="mt-5"
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}
