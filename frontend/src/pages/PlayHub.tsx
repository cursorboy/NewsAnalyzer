import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Masthead from '../components/Masthead'

type GameKey = 'detective' | 'source' | 'compare' | 'rewrite'

type GameCardData = {
  number: string
  title: string
  blurb: string
  description: string
  href: string
  storageKey: string
  rule: string
  key: GameKey
}

const GAMES: GameCardData[] = [
  {
    number: '01',
    title: 'Bias Detective',
    blurb: 'Place it on the spectrum.',
    description:
      'Drag each headline to the spot on the political spectrum where you think it lands. Score on accuracy.',
    href: '/play/detective',
    storageKey: 'biasDetectiveHighScore',
    rule: 'Ten rounds · one spectrum · calibrate your eye',
    key: 'detective',
  },
  {
    number: '02',
    title: 'Guess the Source',
    blurb: 'Identify the outlet.',
    description:
      'Read a clipping with the masthead removed. Pick the outlet that filed it from four candidates.',
    href: '/play/source',
    storageKey: 'guess_source_best',
    rule: 'Ten rounds · four suspects · streak bonus',
    key: 'source',
  },
  {
    number: '03',
    title: 'Compare Two Takes',
    blurb: 'Pick the more biased.',
    description:
      'Two articles, same story, different rooms. Decide which is more biased and in which direction.',
    href: '/play/compare',
    storageKey: 'compare_takes_best',
    rule: 'Ten rounds · magnitude and direction',
    key: 'compare',
  },
  {
    number: '04',
    title: 'Headline Rewrite',
    blurb: 'Neutralize a loaded line.',
    description:
      'Take a loaded headline and file a neutral version. The network grades you on tone, distance, and signal.',
    href: '/play/rewrite',
    storageKey: 'headline_rewrite_best',
    rule: 'Ten rounds · multi-signal score · brevity counts',
    key: 'rewrite',
  },
]

function readBest(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function fmtBest(n: number): string {
  if (n === 0) return '—'
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)
}

export default function PlayHub() {
  const [bests, setBests] = useState<Record<string, number>>({})

  useEffect(() => {
    const next: Record<string, number> = {}
    for (const g of GAMES) next[g.storageKey] = readBest(g.storageKey)
    setBests(next)
  }, [])

  return (
    <div className="min-h-screen bg-paper-cream text-ink">
      <Masthead />

      <main className="mx-auto w-full max-w-[1280px] px-12 py-16 md:py-20">
        {/* Title block */}
        <section className="grid grid-cols-12 gap-10 items-end">
          <div className="col-span-12 md:col-span-7">
            <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
              Department &middot; The Puzzle Page
            </div>
            <h1 className="mt-4 font-display font-black text-ink text-[64px] leading-[0.96] tracking-mega-tight md:text-[88px]">
              Play against
              <br />
              the model.
            </h1>
          </div>
          <div className="col-span-12 md:col-span-5 md:border-l md:border-ink/20 md:pl-10">
            <p className="font-serif italic text-[18px] leading-[1.55] text-ink/70 md:text-[19px]">
              Four short games. The model has been training; how well do you read?
              Each session is ten rounds &mdash; you, against TheBiasGraph v2.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="block h-px w-10 bg-ink/40" aria-hidden />
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                Best scores stored locally
              </span>
            </div>
          </div>
        </section>

        {/* 2x2 game grid */}
        <section className="mt-14 grid grid-cols-1 md:grid-cols-2 border-t-2 border-ink">
          {GAMES.map((g, i) => {
            const best = bests[g.storageKey] ?? 0
            const isRightCol = i % 2 === 1
            return (
              <GameCard
                key={g.href}
                game={g}
                best={best}
                bordered={isRightCol}
              />
            )
          })}
        </section>

        <section className="mt-12 flex items-center justify-between border-t border-ink/15 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55 hover:text-ink transition-colors"
          >
            <span aria-hidden>&larr;</span>
            <span>Back to the front page</span>
          </Link>
          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
            /play
          </span>
        </section>
      </main>
    </div>
  )
}

function GameCard({
  game,
  best,
  bordered,
}: {
  game: GameCardData
  best: number
  bordered: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      to={game.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative block border-b border-ink/15 p-8 md:p-10 hover:bg-ink/[0.025] transition-colors ${
        bordered ? 'md:border-l md:border-ink/15' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <span className="font-display font-black text-ink/30 text-[44px] tabular-nums leading-none">
          {game.number}
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45 tabular-nums">
          Best {fmtBest(best)}
        </span>
      </div>

      <h2 className="mt-5 font-display font-black text-ink text-[28px] leading-[1.05] tracking-display-tight group-hover:text-accent transition-colors md:text-[32px]">
        {game.title}
      </h2>
      <p className="mt-2 font-serif italic text-[15px] text-ink/65">
        {game.blurb}
      </p>

      <p className="mt-5 max-w-md font-serif text-[15px] leading-relaxed text-ink/75">
        {game.description}
      </p>

      {/* Animated preview slot */}
      <div className="mt-6 h-12 relative">
        <AnimatePresence>
          {hover && (
            <motion.div
              key={`preview-${game.key}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0"
            >
              <GamePreview type={game.key} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-baseline justify-between font-sans text-[11px] uppercase tracking-[0.22em]">
        <span className="text-ink/45">{game.rule}</span>
        <span className="inline-flex items-center gap-2 text-ink group-hover:text-accent transition-colors">
          <span>Play</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  )
}

function GamePreview({ type }: { type: GameKey }) {
  if (type === 'detective') {
    return (
      <div className="relative w-[120px] h-3">
        <div className="absolute inset-x-0 top-1/2 h-px bg-ink/40 -translate-y-1/2" />
        <motion.div
          className="absolute top-1/2 left-[28%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute top-1/2 left-[62%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600" />
        <motion.div
          className="absolute top-1/2 h-px bg-ink/30 -translate-y-1/2"
          initial={{ left: '28%', width: 0 }}
          animate={{ width: '34%' }}
          transition={{ duration: 0.45, delay: 0.1 }}
        />
      </div>
    )
  }
  if (type === 'source') {
    const outlets = ['MSN', 'NYT', 'FOX', 'AP']
    return (
      <div className="flex items-center gap-1.5">
        {outlets.map((o, i) => (
          <motion.div
            key={o}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            className={`flex h-7 w-12 items-center justify-center font-mono text-[10px] tabular-nums ${
              i === 1
                ? 'border border-accent text-accent bg-accent/5'
                : 'border border-ink/25 text-ink/55'
            }`}
          >
            {o}
          </motion.div>
        ))}
      </div>
    )
  }
  if (type === 'compare') {
    return (
      <div className="flex flex-col gap-1.5">
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-3 w-16 border border-ink/30 bg-blue-500/5"
        />
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="h-3 w-16 border border-ink/30 bg-accent/5"
        />
      </div>
    )
  }
  // rewrite
  return (
    <div className="space-y-0.5 font-serif text-[12px] leading-tight">
      <div className="relative inline-block text-ink/55">
        Reckless GOP plan&hellip;
        <motion.div
          className="absolute left-0 top-1/2 h-px bg-ink/55 -translate-y-1/2"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.45 }}
        className="text-ink"
      >
        House passes spending bill
      </motion.div>
    </div>
  )
}
