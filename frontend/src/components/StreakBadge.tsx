import { motion, AnimatePresence } from 'framer-motion'
import { copy } from '../lib/microcopy'

type Props = {
  streak: number
  className?: string
}

function tierColors(streak: number): string {
  if (streak >= 10) return 'bg-accent text-paper border-accent'
  if (streak >= 5) return 'bg-amber-500 text-paper border-amber-500'
  if (streak >= 3) return 'bg-amber-100 text-amber-700 border-amber-500'
  return 'bg-transparent text-ink/50 border-transparent'
}

export default function StreakBadge({ streak, className }: Props) {
  const label = copy.streakTier(streak)
  return (
    <AnimatePresence>
      {label && (
        <motion.span
          key={Math.floor((streak - 3) / 2)}
          initial={{ scale: 0.6, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-sans text-[11px] uppercase tracking-[0.2em] ${tierColors(streak)} ${className ?? ''}`}
        >
          <FireIcon active={streak >= 3} />
          <span className="tabular-nums">{label}</span>
        </motion.span>
      )}
    </AnimatePresence>
  )
}

function FireIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      aria-hidden
      className={active ? '' : 'opacity-60'}
    >
      <path
        d="M12 3c2 3 4.5 4.5 4.5 8.5A4.5 4.5 0 0 1 12 16a4.5 4.5 0 0 1-4.5-4.5C7.5 8 9 7 12 3z"
        fill="currentColor"
      />
      <path
        d="M9.5 14.5c.6-2 1.4-2.8 2.5-3.5 1.1.7 1.9 1.5 2.5 3.5a2.5 2.5 0 1 1-5 0z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  )
}
