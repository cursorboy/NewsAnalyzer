import { motion } from 'framer-motion'

type Props = {
  currentRound: number
  totalRounds: number
  className?: string
}

export default function RoundProgress({ currentRound, totalRounds, className }: Props) {
  const completed = Math.max(0, Math.min(totalRounds, currentRound - 1))
  const ticks = Array.from({ length: totalRounds }, (_, i) => i)
  const display = Math.min(currentRound, totalRounds)

  return (
    <div className={`font-sans flex items-center gap-4 ${className ?? ''}`}>
      <span className="font-serif text-2xl font-semibold text-ink tabular-nums leading-none">
        {display}
        <span className="text-ink/35"> / {totalRounds}</span>
      </span>
      <div className="flex items-center gap-[3px]" aria-hidden>
        {ticks.map((i) => {
          const isCompleted = i < completed
          const isCurrent = i === completed && currentRound <= totalRounds
          return (
            <motion.span
              key={i}
              initial={false}
              animate={
                isCurrent
                  ? { opacity: [0.55, 1, 0.55] }
                  : { opacity: 1 }
              }
              transition={
                isCurrent
                  ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
              className={[
                'block h-2.5 w-3.5 border border-ink/20 transition-colors',
                isCompleted
                  ? 'bg-ink border-ink'
                  : isCurrent
                    ? 'bg-accent border-accent'
                    : 'bg-transparent',
              ].join(' ')}
            />
          )
        })}
      </div>
    </div>
  )
}
