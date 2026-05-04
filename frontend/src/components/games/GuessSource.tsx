import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Article } from '../../lib'
import { searchArticles, fallbackSearch } from '../../lib'
import Masthead from '../Masthead'
import BeatTheNetworkScorecard from '../BeatTheNetworkScorecard'
import PlayHud from '../PlayHud'
import RoundFeedback from '../RoundFeedback'
import Countdown from '../Countdown'
import PointBurst from '../PointBurst'
import NeuralLoader from '../NeuralLoader'
import { useGameScore } from '../../hooks/useGameScore'
import { sfx } from '../../lib/gameSound'
import { copy } from '../../lib/microcopy'

const TOTAL_ROUNDS = 10
const STORAGE_KEY = 'guess_source_best'

const SEED_QUERIES = ['us politics', 'climate change', 'economy', 'foreign policy']

const PLAUSIBLE_OUTLETS = [
  'The New York Times',
  'The Washington Post',
  'CNN',
  'NPR',
  'The Wall Street Journal',
  'Fox News',
  'Reuters',
  'Associated Press',
  'BBC',
  'The Guardian',
  'Bloomberg',
  'Politico',
  'The Atlantic',
  'Breitbart',
  'MSNBC',
  'New York Post',
  'The Nation',
]

type Phase = 'menu' | 'countdown' | 'playing' | 'revealed' | 'gameOver'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(real: string, n: number): string[] {
  const pool = PLAUSIBLE_OUTLETS.filter((o) => o.toLowerCase() !== real.toLowerCase())
  return shuffle(pool).slice(0, n)
}

export default function GuessSource() {
  const navigate = useNavigate()
  const score = useGameScore({ totalRounds: TOTAL_ROUNDS, storageKey: STORAGE_KEY })

  const [phase, setPhase] = useState<Phase>('menu')
  const [pool, setPool] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [roundDelta, setRoundDelta] = useState({ user: 0, model: 0 })
  const [burst, setBurst] = useState<{ show: boolean; pts: number; variant: 'correct' | 'wrong' }>({ show: false, pts: 0, variant: 'correct' })

  const currentArticle = pool[score.currentRound - 1] ?? null
  const isCorrect = !!chosen && !!currentArticle && chosen.toLowerCase() === currentArticle.source.toLowerCase()
  const choices = useMemo(() => {
    if (!currentArticle) return []
    const distractors = pickDistractors(currentArticle.source, 3)
    return shuffle([currentArticle.source, ...distractors])
  }, [currentArticle])

  const fetchPool = async (): Promise<Article[]> => {
    const collected: Article[] = []
    const seen = new Set<string>()
    for (const q of shuffle(SEED_QUERIES)) {
      try {
        const data = await searchArticles(q)
        for (const a of data.articles) {
          if (!a.source) continue
          if (seen.has(a.id)) continue
          if (PLAUSIBLE_OUTLETS.some((o) => o.toLowerCase() === a.source.toLowerCase())) {
            seen.add(a.id)
            collected.push(a)
          }
        }
        if (collected.length >= TOTAL_ROUNDS) break
      } catch {
        /* try next */
      }
    }
    if (collected.length >= TOTAL_ROUNDS) {
      return shuffle(collected).slice(0, TOTAL_ROUNDS)
    }
    for (const q of SEED_QUERIES) {
      for (const a of fallbackSearch(q)) {
        if (seen.has(a.id)) continue
        if (PLAUSIBLE_OUTLETS.some((o) => o.toLowerCase() === a.source.toLowerCase())) {
          seen.add(a.id)
          collected.push(a)
        }
        if (collected.length >= TOTAL_ROUNDS) break
      }
      if (collected.length >= TOTAL_ROUNDS) break
    }
    return shuffle(collected).slice(0, TOTAL_ROUNDS)
  }

  const startGame = async () => {
    sfx.unlock()
    setLoading(true)
    setLoadError(null)
    try {
      const list = await fetchPool()
      if (list.length < TOTAL_ROUNDS) {
        setLoadError(`Only found ${list.length} clippings with known outlets. Try again later.`)
        setLoading(false)
        return
      }
      setPool(list)
      score.reset()
      setChosen(null)
      setPhase('countdown')
    } catch {
      setLoadError('Failed to load clippings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submit = (outlet: string) => {
    if (!currentArticle || chosen) return
    setChosen(outlet)
    const correct = outlet.toLowerCase() === currentArticle.source.toLowerCase()
    const userBase = correct ? 1 : 0
    const userBonus = correct ? Math.min(score.streak * 0.5, 2) : 0
    const userPts = userBase + userBonus
    const modelPts = Math.random() < 0.9 ? 1 : 0
    setRoundDelta({ user: userPts, model: modelPts })
    score.recordResult(userPts, modelPts, correct)
    if (correct) {
      sfx.correct()
      setBurst({ show: true, pts: Math.round(userPts), variant: 'correct' })
      if ((score.streak + 1) === 3 || (score.streak + 1) === 5 || (score.streak + 1) === 10) {
        setTimeout(() => sfx.streak(), 200)
      }
    } else {
      sfx.wrong()
      setBurst({ show: true, pts: 0, variant: 'wrong' })
    }
    setTimeout(() => setPhase('revealed'), 700)
  }

  const advance = () => {
    if (score.currentRound >= TOTAL_ROUNDS) {
      score.nextRound()
      setPhase('gameOver')
      return
    }
    setChosen(null)
    setRoundDelta({ user: 0, model: 0 })
    score.nextRound()
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    setChosen(null)
  }, [phase, score.currentRound])

  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
            Game 02 · Guess the Source
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
            The masthead
            <br />
            is missing.
          </h1>
          <p className="mt-6 max-w-xl font-serif text-lg md:text-xl italic text-ink/70">
            Read the clipping. Pick the outlet that filed it from four candidates. Streaks pay.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 border-t border-l border-ink/15">
            {[
              { k: 'Read', v: 'Title and snippet, source hidden.' },
              { k: 'Pick', v: 'Four outlets per round.' },
              { k: 'Score', v: '+1 right · streak bonus.' },
            ].map((row) => (
              <div key={row.k} className="border-r border-b border-ink/15 p-5">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">{row.k}</p>
                <p className="mt-2 font-serif text-base text-ink">{row.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-ink/15 pt-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Best ever <span className="ml-1 tabular-nums text-ink">{score.bestEver % 1 === 0 ? score.bestEver : score.bestEver.toFixed(1)}</span>
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/play"
                className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-ink transition-colors"
              >
                ← Other games
              </Link>
              <motion.button
                onClick={startGame}
                disabled={loading}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="bg-accent text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-6 py-3.5 hover:bg-ink transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(185,28,28,0.6)]"
              >
                {loading ? 'Loading…' : 'Begin session'} <span aria-hidden>→</span>
              </motion.button>
            </div>
          </div>

          {loading && (
            <div className="mt-10 flex justify-center">
              <NeuralLoader label="Pulling clippings off the wire" />
            </div>
          )}
          {loadError && <p className="mt-6 font-serif text-sm italic text-accent">{loadError}</p>}
        </main>
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
            gameName="Guess the Source"
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

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Masthead />

      <PlayHud
        gameNumber="Game 02"
        gameName="Guess the Source"
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
              key={`play-${score.currentRound}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-10"
            >
              <article className="border-t-2 border-ink pt-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Clipping · masthead removed
                </p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight text-ink">
                  {currentArticle.title}
                </h2>
                <p className="mt-4 font-serif text-base md:text-lg text-ink/75 leading-relaxed">
                  {currentArticle.snippet}
                </p>
              </article>

              <section>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3">
                  Whose desk did this come from?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {choices.map((opt) => {
                    const isPicked = chosen === opt
                    const isRight = !!chosen && opt.toLowerCase() === currentArticle.source.toLowerCase()
                    const isWrongPick = !!chosen && isPicked && !isRight
                    const dim = !!chosen && !isPicked && !isRight
                    return (
                      <motion.button
                        key={opt}
                        onClick={() => submit(opt)}
                        disabled={!!chosen}
                        whileHover={!chosen ? { scale: 1.02, y: -2 } : {}}
                        whileTap={!chosen ? { scale: 0.97 } : {}}
                        animate={
                          isRight && chosen
                            ? { boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 32px rgba(245,158,11,0.8)', '0 0 0px rgba(245,158,11,0)'] }
                            : {}
                        }
                        transition={isRight && chosen ? { duration: 0.7, repeat: 1 } : {}}
                        className={`relative border-2 p-6 text-left transition-all duration-300 ${
                          isRight
                            ? 'border-amber-500 bg-amber-100'
                            : isWrongPick
                              ? 'border-accent bg-accent/5'
                              : dim
                                ? 'border-ink/10 bg-paper opacity-40 grayscale'
                                : 'border-ink/20 hover:border-ink hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]'
                        }`}
                      >
                        <p className={`font-serif text-2xl font-semibold ${isRight ? 'text-amber-700' : isWrongPick ? 'text-accent' : 'text-ink'}`}>
                          {opt}
                        </p>
                        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ink/40">
                          {isRight ? 'Filed by →' : isWrongPick ? 'Your pick' : chosen ? '' : 'Pick →'}
                        </p>
                      </motion.button>
                    )
                  })}
                </div>
              </section>

              <div className="flex items-center justify-between border-t border-ink/15 pt-6">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Round {score.currentRound} of {TOTAL_ROUNDS}
                </span>
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Streak <span className="text-ink tabular-nums">{score.streak}</span>
                </span>
              </div>
            </motion.div>
          )}

          {phase === 'revealed' && currentArticle && chosen && (
            <motion.div
              key={`rev-${score.currentRound}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-8"
            >
              <RoundFeedback
                outcome={isCorrect ? 'correct' : 'wrong'}
                headline={isCorrect ? copy.right() : copy.wrong()}
                detail={
                  isCorrect
                    ? `Filed by ${currentArticle.source}.`
                    : `You said ${chosen}. Filed by ${currentArticle.source}.`
                }
              />

              <article className="border-t-2 border-ink pt-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                  Filed by · {currentArticle.source}
                </p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight text-ink">
                  {currentArticle.title}
                </h2>
              </article>

              <section className="grid grid-cols-3 border-t border-l border-ink/15">
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-blue-700">Your pick</p>
                  <p className="mt-2 font-serif text-xl text-ink">{chosen}</p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Verdict</p>
                  <p className={`mt-2 font-serif text-xl ${isCorrect ? 'text-emerald-700' : 'text-accent'}`}>
                    {isCorrect ? 'Correct' : 'Miss'}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Round</p>
                  <p className="mt-2 font-serif text-xl text-ink tabular-nums">
                    You {roundDelta.user.toFixed(roundDelta.user % 1 === 0 ? 0 : 1)} · Net {roundDelta.model}
                  </p>
                </div>
              </section>

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
