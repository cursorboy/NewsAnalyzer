import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'
import StreakBadge from './StreakBadge'
import SfxToggle from './SfxToggle'

type Props = {
  gameNumber: string
  gameName: string
  topic?: string
  userScore: number
  modelScore: number
  streak: number
  currentRound: number
  totalRounds: number
}

function fmt(n: number): string {
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1)
}

function ScoreNumber({
  value,
  color,
}: {
  value: number
  color: 'blue' | 'red' | 'ink'
}) {
  const animated = useCountUp(value, 700)
  const [flash, setFlash] = useState(false)
  const [prev, setPrev] = useState(value)
  useEffect(() => {
    if (value !== prev) {
      setFlash(true)
      setPrev(value)
      const t = setTimeout(() => setFlash(false), 520)
      return () => clearTimeout(t)
    }
  }, [value, prev])
  const colorClass =
    color === 'blue'
      ? 'text-blue-700'
      : color === 'red'
        ? 'text-accent'
        : 'text-ink'
  return (
    <motion.span
      animate={flash ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className={`font-serif font-semibold tabular-nums leading-none ${colorClass} ${flash ? 'drop-shadow-[0_2px_12px_rgba(16,185,129,0.5)]' : ''}`}
      style={{ display: 'inline-block' }}
    >
      {fmt(animated)}
    </motion.span>
  )
}

export default function PlayHud({
  gameNumber,
  gameName,
  topic,
  userScore,
  modelScore,
  streak,
  currentRound,
  totalRounds,
}: Props) {
  const display = Math.min(currentRound, totalRounds)
  return (
    <div className="sticky top-0 z-20 border-b border-ink/15 bg-paper/95 backdrop-blur-[2px]">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-3 flex items-center gap-3 md:gap-6 flex-wrap">
        <Link
          to="/play"
          className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink transition-colors whitespace-nowrap"
        >
          ← Quit
        </Link>
        <div className="hidden md:block h-6 w-px bg-ink/20" />
        <div className="hidden md:flex flex-col">
          <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/45">
            {gameNumber}
          </span>
          <span className="font-serif text-sm leading-none text-ink">{gameName}</span>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center gap-3 md:gap-6">
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-blue-700">You</span>
            <span className="text-2xl md:text-3xl">
              <ScoreNumber value={userScore} color="blue" />
            </span>
          </div>
          <span className="font-serif text-lg md:text-xl text-ink/30">-</span>
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">
              <ScoreNumber value={modelScore} color="red" />
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">Network</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StreakBadge streak={streak} />
          <span className="font-serif text-base md:text-lg font-semibold text-ink tabular-nums">
            {display}
            <span className="text-ink/35"> / {totalRounds}</span>
          </span>
          <RoundDots current={display} total={totalRounds} />
          <SfxToggle />
        </div>
      </div>
      {topic && (
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 pb-2 -mt-1 font-sans text-[10px] uppercase tracking-[0.2em] text-ink/45">
          Topic · "{topic}"
        </div>
      )}
    </div>
  )
}

function RoundDots({ current, total }: { current: number; total: number }) {
  const completed = current - 1
  const dots = Array.from({ length: total }, (_, i) => i)
  return (
    <div className="hidden md:flex items-center gap-[3px]" aria-hidden>
      {dots.map((i) => {
        const done = i < completed
        const cur = i === completed
        return (
          <motion.span
            key={i}
            initial={false}
            animate={cur ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
            transition={cur ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}
            className={`block h-2.5 w-3 border ${
              done ? 'bg-ink border-ink' : cur ? 'bg-accent border-accent' : 'bg-transparent border-ink/20'
            }`}
          />
        )
      })}
    </div>
  )
}
