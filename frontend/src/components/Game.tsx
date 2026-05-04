import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import type { Article } from '../lib'
import { searchArticles, fallbackSearch } from '../lib'
import { useArticles } from '../context/ArticlesContext'
import Masthead from './Masthead'
import BeatTheNetworkScorecard from './BeatTheNetworkScorecard'
import PlayHud from './PlayHud'
import RoundFeedback from './RoundFeedback'
import Countdown from './Countdown'
import PointBurst from './PointBurst'
import TopicChooser from './TopicChooser'
import { useGameScore } from '../hooks/useGameScore'
import { sfx } from '../lib/gameSound'
import { copy } from '../lib/microcopy'

const TOTAL_ROUNDS = 10
const STORAGE_KEY = 'biasDetectiveHighScore'

const FALLBACK_TOPICS = [
  'climate change',
  'immigration policy',
  'healthcare reform',
  'tax policy',
  'education funding',
  'gun control',
  'trade policy',
  'social security',
  'minimum wage',
]

type Phase = 'menu' | 'topic' | 'countdown' | 'playing' | 'revealed' | 'gameOver'

function biasLabel(score: number): string {
  if (score <= -0.7) return 'Far Left'
  if (score <= -0.3) return 'Left'
  if (score < 0.3) return 'Center'
  if (score < 0.7) return 'Right'
  return 'Far Right'
}

export default function Game() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getCachedArticles, cacheArticles, cachedArticles } = useArticles()
  const searchQuery = searchParams.get('q') || ''

  const score = useGameScore({ totalRounds: TOTAL_ROUNDS, storageKey: STORAGE_KEY })
  const [phase, setPhase] = useState<Phase>('menu')
  const [articles, setArticles] = useState<Article[]>([])
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [chosenTopic, setChosenTopic] = useState<string>(searchQuery)

  const [dragPosition, setDragPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [userGuess, setUserGuess] = useState<number | null>(null)
  const [roundUserPoints, setRoundUserPoints] = useState(0)
  const [roundModelPoints, setRoundModelPoints] = useState(0)
  const [outcome, setOutcome] = useState<'correct' | 'wrong'>('wrong')
  const [burst, setBurst] = useState<{ show: boolean; pts: number; variant: 'correct' | 'wrong' }>({ show: false, pts: 0, variant: 'correct' })
  const [markerLanded, setMarkerLanded] = useState(false)
  const spectrumRef = useRef<HTMLDivElement>(null)

  const processArticlesForGame = (incoming: Article[]): Article[] => {
    const known = incoming.filter(
      (a) => (a.method === 'outlet' || a.method === 'ai') && a.confidence > 0.5,
    )
    if (known.length >= 8) {
      const left = known.filter((a) => a.spectrum_score <= -0.3)
      const center = known.filter((a) => a.spectrum_score > -0.3 && a.spectrum_score < 0.3)
      const right = known.filter((a) => a.spectrum_score >= 0.3)
      const mixed = [...left.slice(0, 4), ...center.slice(0, 3), ...right.slice(0, 4)]
      return mixed.sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS)
    }
    if (known.length >= 3) {
      return known.sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS)
    }
    return []
  }

  const fetchGameArticles = async (topic: string): Promise<Article[]> => {
    if (topic) {
      const cached = getCachedArticles(topic)
      if (cached && cached.length > 0) {
        const processed = processArticlesForGame(cached)
        if (processed.length >= 3) return processed
      }
      try {
        const data = await searchArticles(topic)
        cacheArticles(topic, data.articles)
        const processed = processArticlesForGame(data.articles)
        if (processed.length >= 3) return processed
      } catch {
        /* fall through */
      }
      return fallbackSearch(topic).slice(0, TOTAL_ROUNDS)
    }
    const fallback = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)]
    try {
      const data = await searchArticles(fallback)
      cacheArticles(fallback, data.articles)
      const processed = processArticlesForGame(data.articles)
      if (processed.length >= 3) return processed
    } catch {
      /* fall through */
    }
    return fallbackSearch(fallback).slice(0, TOTAL_ROUNDS)
  }

  const startGame = async (topic: string) => {
    sfx.unlock()
    setChosenTopic(topic)
    setLoading(true)
    setLoadError(null)
    try {
      const list = await fetchGameArticles(topic)
      if (list.length === 0) {
        setLoadError('Could not find enough scored articles. Try again.')
        setLoading(false)
        return
      }
      setArticles(list)
      setCurrentArticle(list[0])
      score.reset()
      setUserGuess(null)
      setDragPosition(0)
      setMarkerLanded(false)
      setPhase('countdown')
    } catch {
      setLoadError('Failed to load articles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitGuess = () => {
    if (!currentArticle || userGuess === null) return
    const actual = currentArticle.spectrum_score
    const userDistance = Math.abs(userGuess - actual)
    const userAccurate = userDistance < 0.3
    const userPts = userAccurate ? 1 : 0

    const modelDistance = 0.05 + Math.random() * 0.18
    const modelAccurate = modelDistance < 0.3
    const modelPts = modelAccurate ? 1 : 0

    setRoundUserPoints(userPts)
    setRoundModelPoints(modelPts)
    setOutcome(userAccurate ? 'correct' : 'wrong')
    score.recordResult(userPts, modelPts, userAccurate)
    if (userAccurate) {
      sfx.correct()
      setBurst({ show: true, pts: 1, variant: 'correct' })
      // streak milestone sound
      if ((score.streak + 1) === 3 || (score.streak + 1) === 5 || (score.streak + 1) === 10) {
        setTimeout(() => sfx.streak(), 200)
      }
    } else {
      sfx.wrong()
      setBurst({ show: true, pts: 0, variant: 'wrong' })
    }
    setPhase('revealed')
  }

  const advance = () => {
    if (score.currentRound >= TOTAL_ROUNDS) {
      score.nextRound()
      setPhase('gameOver')
      return
    }
    const nextIdx = score.currentRound
    const next = articles[nextIdx] ?? articles[Math.floor(Math.random() * articles.length)]
    setCurrentArticle(next)
    setUserGuess(null)
    setDragPosition(0)
    setMarkerLanded(false)
    setRoundUserPoints(0)
    setRoundModelPoints(0)
    score.nextRound()
    setPhase('playing')
  }

  const updatePosition = (clientX: number) => {
    if (!spectrumRef.current) return
    const rect = spectrumRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pos = Math.max(-1, Math.min(1, (x / rect.width) * 2 - 1))
    setDragPosition(pos)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (phase !== 'playing') return
    setIsDragging(true)
    setMarkerLanded(false)
    updatePosition(e.clientX)
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging && phase === 'playing') updatePosition(e.clientX)
  }
  const onMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    setUserGuess(dragPosition)
    setMarkerLanded(true)
    sfx.click()
  }
  const onTouchStart = (e: React.TouchEvent) => {
    if (phase !== 'playing') return
    setIsDragging(true)
    setMarkerLanded(false)
    updatePosition(e.touches[0].clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging && phase === 'playing') updatePosition(e.touches[0].clientX)
  }
  const onTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    setUserGuess(dragPosition)
    setMarkerLanded(true)
    sfx.click()
  }

  useEffect(() => {
    function up() {
      if (isDragging) {
        setIsDragging(false)
        setUserGuess(dragPosition)
        setMarkerLanded(true)
        sfx.click()
      }
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [isDragging, dragPosition])

  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
            Game 01 · Bias Detective
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
            Calibrate
            <br />
            your eye.
          </h1>
          <p className="mt-6 max-w-xl font-serif text-lg md:text-xl italic text-ink/70">
            {searchQuery
              ? <>Ten clippings on <span className="not-italic">"{searchQuery}".</span> Place each one on the spectrum.</>
              : 'Ten clippings. Place each one on the spectrum where you think it lives.'}
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 border-t border-l border-ink/15">
            {[
              { k: 'Read', v: 'Headline & snippet only.' },
              { k: 'Drag', v: 'Liberal ↔ Conservative.' },
              { k: 'Score', v: 'Within ±0.3 counts.' },
            ].map((row) => (
              <div key={row.k} className="border-r border-b border-ink/15 p-5">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">{row.k}</p>
                <p className="mt-2 font-serif text-base text-ink">{row.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-ink/15 pt-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Best ever <span className="ml-1 tabular-nums text-ink">{score.bestEver}</span>
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/play"
                className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-ink transition-colors"
              >
                ← Other games
              </Link>
              <motion.button
                onClick={() => setPhase('topic')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="bg-accent text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-6 py-3.5 hover:bg-ink transition-colors inline-flex items-center gap-2 shadow-[0_8px_24px_-10px_rgba(185,28,28,0.6)]"
              >
                Choose topic <span aria-hidden>→</span>
              </motion.button>
            </div>
          </div>

          {loadError && (
            <p className="mt-6 font-serif text-sm italic text-accent">{loadError}</p>
          )}
        </main>
      </div>
    )
  }

  if (phase === 'topic') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <TopicChooser
          gameNumber="Game 01"
          gameName="Bias Detective"
          initial={chosenTopic}
          prompt="Pick a topic. We'll pull ten clippings about it and you place each one on the spectrum."
          onPick={startGame}
        />
        {loadError && <p className="mx-auto max-w-3xl px-6 mt-4 font-serif italic text-accent">{loadError}</p>}
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <Countdown onDone={() => setPhase('playing')} />
      </div>
    )
  }

  if (phase === 'gameOver') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <main className="mx-auto w-full max-w-5xl px-6 py-16">
          <BeatTheNetworkScorecard
            userScore={score.userScore}
            modelScore={score.modelScore}
            rounds={TOTAL_ROUNDS}
            gameName="Bias Detective"
            onReplay={() => {
              setPhase('menu')
              score.reset()
            }}
            onHome={() => navigate('/play')}
          />
        </main>
      </div>
    )
  }

  // Compute lit segment between guess and actual on reveal
  const guessPct = userGuess !== null ? ((userGuess + 1) / 2) * 100 : 0
  const actualPct = currentArticle ? ((currentArticle.spectrum_score + 1) / 2) * 100 : 0
  const segLeft = Math.min(guessPct, actualPct)
  const segWidth = Math.abs(guessPct - actualPct)

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Masthead />

      <PlayHud
        gameNumber="Game 01"
        gameName="Bias Detective"
        topic={searchQuery || undefined}
        userScore={score.userScore}
        modelScore={score.modelScore}
        streak={score.streak}
        currentRound={score.currentRound}
        totalRounds={TOTAL_ROUNDS}
      />

      <PointBurst show={burst.show} points={burst.pts} variant={burst.variant} onDone={() => setBurst((b) => ({ ...b, show: false }))} />

      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <AnimatePresence mode="wait">
          {phase === 'playing' && currentArticle && (
            <motion.div
              key={`playing-${score.currentRound}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-10"
            >
              <article className="relative">
                <div aria-hidden>
                  <div className="h-[3px] bg-ink" />
                  <div className="mt-[3px] border-t border-ink/30" />
                </div>
                <div className="flex items-baseline justify-between gap-3 pt-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink/65">
                    Clipping &mdash; Source Withheld
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/45">
                    Round {score.currentRound} / {TOTAL_ROUNDS}
                  </p>
                </div>
                <h2 className="mt-2 font-display text-[32px] md:text-[44px] font-black leading-[1.04] tracking-mega-tight text-ink">
                  {currentArticle.title}
                </h2>
                <p className="mt-3 font-serif text-lg italic leading-snug text-ink/65 md:text-xl">
                  Place this clipping on the comparison spectrum.
                </p>
                <div className="mt-4 border-t border-ink/30" aria-hidden />
                <p className="mt-5 max-w-prose font-serif text-[16px] leading-[1.7] text-ink/85 md:text-[17px] md:leading-[1.75] line-clamp-4">
                  {currentArticle.snippet}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  <a
                    href={currentArticle.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="border-b border-ink/50 pb-0.5 text-ink/85 hover:border-ink hover:text-ink transition-colors"
                  >
                    Read the full article &rarr;
                  </a>
                  <span aria-hidden className="text-ink/30">&middot;</span>
                  <span>Outlet revealed after guess</span>
                </div>
              </article>

              <section>
                <p className="text-center font-serif italic text-ink/65 mb-6">
                  Drag the marker to where you think this clipping lives.
                </p>

                <motion.div
                  ref={spectrumRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className="relative h-24 cursor-crosshair select-none"
                >
                  <motion.div
                    className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'linear-gradient(to right, #1d4ed8 0%, #3b82f6 25%, #d1d5db 50%, #ef4444 75%, #b91c1c 100%)',
                    }}
                    animate={isDragging ? { boxShadow: '0 0 24px rgba(59,130,246,0.5)' } : { boxShadow: '0 0 0px rgba(0,0,0,0)' }}
                  />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-px bg-ink/40" />

                  {(userGuess !== null || isDragging) && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2"
                      initial={false}
                      animate={{
                        left: `${(((isDragging ? dragPosition : userGuess!) + 1) / 2) * 100}%`,
                        scale: markerLanded && !isDragging ? [1.4, 0.85, 1.1, 1] : 1,
                      }}
                      transition={
                        markerLanded && !isDragging
                          ? { duration: 0.55, times: [0, 0.4, 0.7, 1], ease: [0.34, 1.56, 0.64, 1] }
                          : { duration: 0 }
                      }
                    >
                      <div className="-translate-x-1/2 flex flex-col items-center">
                        <div className="h-7 w-[3px] bg-ink" />
                        <div className="h-4 w-4 bg-ink rotate-45 -mt-[3px] shadow-[0_3px_10px_rgba(0,0,0,0.4)]" />
                        <span className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ink/70 tabular-nums whitespace-nowrap">
                          {(isDragging ? dragPosition : userGuess!).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] font-sans mt-2">
                  <span className="text-blue-700 font-semibold">Liberal</span>
                  <span className="text-ink/40">Center</span>
                  <span className="text-accent font-semibold">Conservative</span>
                </div>
              </section>

              <div className="flex items-center justify-between border-t border-ink/15 pt-6">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Round {score.currentRound} of {TOTAL_ROUNDS}
                </span>
                <motion.button
                  onClick={submitGuess}
                  disabled={userGuess === null}
                  whileHover={userGuess !== null ? { scale: 1.04 } : {}}
                  whileTap={userGuess !== null ? { scale: 0.96 } : {}}
                  className="bg-accent text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-6 py-3.5 hover:bg-ink transition-colors inline-flex items-center gap-2 disabled:opacity-25 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(185,28,28,0.6)]"
                >
                  File your guess <span aria-hidden>→</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === 'revealed' && currentArticle && userGuess !== null && (
            <motion.div
              key={`revealed-${score.currentRound}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-8"
            >
              <RoundFeedback
                outcome={outcome}
                headline={outcome === 'correct' ? copy.right() : copy.wrong()}
                detail={
                  outcome === 'correct'
                    ? `Within ±0.3 of the network reading (${currentArticle.spectrum_score.toFixed(2)}).`
                    : `Network had this at ${currentArticle.spectrum_score.toFixed(2)} — you were ${Math.abs(userGuess - currentArticle.spectrum_score).toFixed(2)} off.`
                }
              />

              <article className="border-t-2 border-ink pt-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  {currentArticle.source}
                </p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight text-ink">
                  {currentArticle.title}
                </h2>
              </article>

              <section className="grid grid-cols-3 border-t border-l border-ink/15">
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-blue-700">Your call</p>
                  <p className="mt-2 font-serif text-2xl text-ink">{biasLabel(userGuess)}</p>
                  <p className="font-sans text-[11px] tracking-[0.14em] text-ink/55 tabular-nums mt-1">
                    {userGuess.toFixed(2)}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">Network reading</p>
                  <p className="mt-2 font-serif text-2xl text-ink">{biasLabel(currentArticle.spectrum_score)}</p>
                  <p className="font-sans text-[11px] tracking-[0.14em] text-ink/55 tabular-nums mt-1">
                    {currentArticle.spectrum_score.toFixed(2)}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Round</p>
                  <p className="mt-2 font-serif text-2xl text-ink tabular-nums">
                    You {roundUserPoints} · Net {roundModelPoints}
                  </p>
                </div>
              </section>

              <section>
                <div className="relative h-24">
                  <div
                    className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'linear-gradient(to right, #1d4ed8 0%, #3b82f6 25%, #d1d5db 50%, #ef4444 75%, #b91c1c 100%)',
                    }}
                  />
                  {/* Lit segment between guess & actual */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.2 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.45, ease: 'easeOut' }}
                    style={{
                      left: `${segLeft}%`,
                      width: `${segWidth}%`,
                      transformOrigin: 'left',
                    }}
                    className={`absolute top-1/2 h-3 -translate-y-1/2 rounded-full ${outcome === 'correct' ? 'bg-emerald-500' : 'bg-amber-400'} mix-blend-multiply`}
                  />

                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${guessPct}%` }}
                  >
                    <div className="-translate-x-1/2 flex flex-col items-center">
                      <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-blue-700 font-semibold">You</span>
                      <div className="h-4 w-4 bg-blue-700 rotate-45 mt-1 shadow-[0_3px_10px_rgba(29,78,216,0.5)]" />
                    </div>
                  </div>

                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2"
                    initial={{ left: `${guessPct}%`, opacity: 0 }}
                    animate={{ left: `${actualPct}%`, opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <div className="-translate-x-1/2 flex flex-col items-center mt-7">
                      <div className="h-4 w-4 bg-emerald-600 rotate-45 shadow-[0_3px_10px_rgba(16,185,129,0.5)]" />
                      <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-emerald-700 font-semibold mt-1">Actual</span>
                    </div>
                  </motion.div>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] font-sans mt-2">
                  <span className="text-blue-700 font-semibold">Liberal</span>
                  <span className="text-ink/40">Center</span>
                  <span className="text-accent font-semibold">Conservative</span>
                </div>
              </section>

              {currentArticle.reasoning && (
                <section className="border-l-4 border-ink pl-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                    Network reasoning
                  </p>
                  <p className="mt-2 font-serif text-base italic text-ink/75 leading-relaxed">
                    {currentArticle.reasoning}
                  </p>
                </section>
              )}

              <div className="flex items-center justify-end border-t border-ink/15 pt-6">
                <motion.button
                  onClick={advance}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="bg-ink text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-6 py-3.5 hover:bg-accent transition-colors inline-flex items-center gap-2"
                >
                  {score.currentRound >= TOTAL_ROUNDS ? 'See scorecard' : 'Next round'} <span aria-hidden>→</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
