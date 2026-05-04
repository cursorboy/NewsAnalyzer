import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'

type Props = {
  userScore: number
  modelScore: number
  streak?: number
}

function formatScore(n: number): string {
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1)
}

function ScoreCell({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis: 'ink' | 'accent'
}) {
  const animated = useCountUp(value, 700)
  const [flash, setFlash] = useState(false)
  const [prev, setPrev] = useState(value)
  useEffect(() => {
    if (value !== prev) {
      setFlash(true)
      setPrev(value)
      const t = setTimeout(() => setFlash(false), 650)
      return () => clearTimeout(t)
    }
  }, [value, prev])
  const color = emphasis === 'accent' ? 'text-accent' : 'text-ink'
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/55">
        {label}
      </span>
      <motion.span
        animate={flash ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`font-serif text-lg tabular-nums ${flash ? 'text-emerald-700' : color}`}
      >
        {formatScore(animated)}
      </motion.span>
    </span>
  )
}

export default function GameScoreHeader({ userScore, modelScore, streak }: Props) {
  return (
    <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-[0.18em] text-ink/55">
      <ScoreCell label="You" value={userScore} emphasis="ink" />
      <span className="text-ink/30">vs.</span>
      <ScoreCell label="TheBiasGraph v2" value={modelScore} emphasis="accent" />
      {typeof streak === 'number' && streak >= 3 && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="ml-3 inline-flex items-center gap-2 border border-amber-500 bg-amber-500/10 px-2 py-0.5 text-amber-600 tabular-nums"
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.18em]">Streak</span>
          <span className="font-serif text-base normal-case tracking-tight">{streak}</span>
        </motion.span>
      )}
    </div>
  )
}
