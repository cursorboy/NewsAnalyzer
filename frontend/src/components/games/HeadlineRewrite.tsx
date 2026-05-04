import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Article, HeadlineRewriteScore } from '../../lib'
import { searchArticles, scoreHeadlineRewrite, fallbackSearch, fallbackHeadlineScore } from '../../lib'
import Masthead from '../Masthead'
import BeatTheNetworkScorecard from '../BeatTheNetworkScorecard'
import PlayHud from '../PlayHud'
import RoundFeedback from '../RoundFeedback'
import Countdown from '../Countdown'
import PointBurst from '../PointBurst'
import NeuralLoader from '../NeuralLoader'
import { useGameScore } from '../../hooks/useGameScore'
import { useCountUp } from '../../hooks/useCountUp'
import { sfx } from '../../lib/gameSound'
import { copy } from '../../lib/microcopy'

const TOTAL_ROUNDS = 10
const STORAGE_KEY = 'headline_rewrite_best'
const MIN_BIAS = 0.3
const SEED_QUERIES = ['us politics', 'climate change', 'immigration', 'economy', 'foreign policy']

const FAUX_PROGRESS = [
  'Comparing against 1.2M paired headlines…',
  'Computing tone delta…',
  'Cross-referencing 10,000h corpus…',
  'Scanning for loaded language…',
  'Measuring entailment to original…',
  'Weighting hedging signals…',
  'Aggregating multi-signal grade…',
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

async function tryScore(original: string, rewrite: string): Promise<{ result: HeadlineRewriteScore; mock: boolean }> {
  try {
    const result = await scoreHeadlineRewrite(original, rewrite)
    return { result, mock: false }
  } catch {
    await new Promise((r) => setTimeout(r, 1200))
    return { result: fallbackHeadlineScore(original, rewrite), mock: true }
  }
}

function SignalRow({ name, value, delay }: { name: string; value: number; delay: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  const animated = useCountUp(shown ? value : 0, 600)
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : -8 }}
      className="flex items-baseline justify-between border-b-2 border-ink/10 py-2"
    >
      <dt className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink/65">
        {name.replace(/_/g, ' ')}
      </dt>
      <dd className="font-serif text-2xl font-semibold text-ink tabular-nums">
        {Math.round(animated)}
      </dd>
    </motion.div>
  )
}

function FauxProgress() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(FAUX_PROGRESS.length - 1, i + 1)), 220)
    return () => clearInterval(t)
  }, [])
  return (
    <ol className="space-y-2">
      {FAUX_PROGRESS.slice(0, idx + 1).map((line, i) => (
        <motion.li
          key={line}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className={`font-serif italic ${i === idx ? 'text-ink' : 'text-ink/40'}`}
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] mr-3 text-accent">
            ›
          </span>
          {line}
        </motion.li>
      ))}
    </ol>
  )
}

export default function HeadlineRewrite() {
  const navigate = useNavigate()
  const score = useGameScore({ totalRounds: TOTAL_ROUNDS, storageKey: STORAGE_KEY })

  const [phase, setPhase] = useState<Phase>('menu')
  const [pool, setPool] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [scoreResult, setScoreResult] = useState<HeadlineRewriteScore | null>(null)
  const [usedMock, setUsedMock] = useState(false)
  const [roundDelta, setRoundDelta] = useState({ user: 0, model: 0 })
  const [burst, setBurst] = useState<{ show: boolean; pts: number; variant: 'correct' | 'wrong' | 'partial' }>({ show: false, pts: 0, variant: 'correct' })

  const currentArticle = pool[score.currentRound - 1] ?? null

  const fetchPool = async (): Promise<Article[]> => {
    const collected: Article[] = []
    const seen = new Set<string>()
    for (const q of shuffle(SEED_QUERIES)) {
      try {
        const data = await searchArticles(q)
        for (const a of data.articles) {
          if (seen.has(a.id)) continue
          if (Math.abs(a.spectrum_score) >= MIN_BIAS) {
            seen.add(a.id)
            collected.push(a)
          }
        }
        if (collected.length >= TOTAL_ROUNDS) break
      } catch {
        continue
      }
    }
    if (collected.length >= TOTAL_ROUNDS) {
      return shuffle(collected).slice(0, TOTAL_ROUNDS)
    }
    for (const q of SEED_QUERIES) {
      for (const a of fallbackSearch(q)) {
        if (seen.has(a.id)) continue
        if (Math.abs(a.spectrum_score) >= MIN_BIAS) {
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
        setLoadError(`Only found ${list.length} biased headlines. Try again later.`)
        setLoading(false)
        return
      }
      setPool(list)
      score.reset()
      setDraft('')
      setScoreResult(null)
      setUsedMock(false)
      setPhase('countdown')
    } catch {
      setLoadError('Failed to load clippings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!currentArticle || !draft.trim()) return
    setSubmitting(true)
    const { result, mock } = await tryScore(currentArticle.title, draft.trim())
    setScoreResult(result)
    setUsedMock(mock)
    const userPts = Math.max(0, Math.min(10, Math.round(result.total / 10)))
    const modelPts = 8
    setRoundDelta({ user: userPts, model: modelPts })
    score.recordResult(userPts, modelPts, userPts >= 7)
    if (userPts >= 7) {
      sfx.correct()
      setBurst({ show: true, pts: userPts, variant: 'correct' })
      if ((score.streak + 1) === 3 || (score.streak + 1) === 5 || (score.streak + 1) === 10) {
        setTimeout(() => sfx.streak(), 220)
      }
    } else if (userPts >= 4) {
      sfx.reveal()
      setBurst({ show: true, pts: userPts, variant: 'partial' })
    } else {
      sfx.wrong()
      setBurst({ show: true, pts: userPts, variant: 'wrong' })
    }
    setSubmitting(false)
    setPhase('revealed')
  }

  const advance = () => {
    if (score.currentRound >= TOTAL_ROUNDS) {
      score.nextRound()
      setPhase('gameOver')
      return
    }
    setDraft('')
    setScoreResult(null)
    setUsedMock(false)
    setRoundDelta({ user: 0, model: 0 })
    score.nextRound()
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    setDraft('')
    setScoreResult(null)
    setUsedMock(false)
  }, [phase, score.currentRound])

  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
            Game 04 · Headline Rewrite
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
            File it
            <br />
            neutral.
          </h1>
          <p className="mt-6 max-w-xl font-serif text-lg md:text-xl italic text-ink/70">
            Take a loaded headline and rewrite it down the middle. The network grades tone, distance, and signal.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 border-t border-l border-ink/15">
            {[
              { k: 'Read', v: 'Original headline + snippet.' },
              { k: 'Rewrite', v: 'Same facts, neutral tone.' },
              { k: 'Score', v: 'Multi-signal grade per round.' },
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
              <NeuralLoader label="Pulling biased headlines off the wire" />
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
            rounds={TOTAL_ROUNDS * 10}
            gameName="Headline Rewrite"
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
        gameNumber="Game 04"
        gameName="Headline Rewrite"
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
                  Original headline · bias {currentArticle.spectrum_score.toFixed(2)} · {currentArticle.source}
                </p>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight text-ink">
                  {currentArticle.title}
                </h2>
                <p className="mt-4 font-serif text-base md:text-lg text-ink/70 leading-relaxed italic">
                  {currentArticle.snippet}
                </p>
              </article>

              {submitting ? (
                <section className="border-2 border-ink px-6 py-10 md:px-10 md:py-12 min-h-[320px] flex flex-col items-center justify-center gap-7">
                  <NeuralLoader label="Scoring your rewrite" />
                  <FauxProgress />
                </section>
              ) : (
                <>
                  <section>
                    <label className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3 block">
                      Your neutral rewrite
                    </label>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      placeholder="Same facts, no loaded language…"
                      className="w-full bg-paper border-2 border-ink/20 px-4 py-3 font-serif text-xl text-ink placeholder:text-ink/35 focus:outline-none focus:border-accent resize-none transition-colors"
                    />
                    <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.18em] text-ink/45 tabular-nums">
                      {draft.trim().length} chars · {draft.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                  </section>

                  <div className="flex items-center justify-between border-t border-ink/15 pt-6">
                    <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                      Round {score.currentRound} of {TOTAL_ROUNDS}
                    </span>
                    <motion.button
                      onClick={submit}
                      disabled={!draft.trim()}
                      whileHover={draft.trim() ? { scale: 1.04 } : {}}
                      whileTap={draft.trim() ? { scale: 0.96 } : {}}
                      className="bg-accent text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-6 py-3.5 hover:bg-ink transition-colors inline-flex items-center gap-2 disabled:opacity-25 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(185,28,28,0.6)]"
                    >
                      File rewrite <span aria-hidden>→</span>
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {phase === 'revealed' && currentArticle && (
            <motion.div
              key={`rev-${score.currentRound}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-8"
            >
              <RoundFeedback
                outcome={
                  roundDelta.user >= 7 ? 'correct' : roundDelta.user >= 4 ? 'partial' : 'wrong'
                }
                headline={
                  roundDelta.user >= 7 ? copy.right() : roundDelta.user >= 4 ? copy.partial() : copy.wrong()
                }
                detail={
                  roundDelta.user >= 7
                    ? `Strong neutral rewrite — ${scoreResult?.total ?? 0}/100.`
                    : roundDelta.user >= 4
                      ? `Decent — ${scoreResult?.total ?? 0}/100. Watch for loaded words.`
                      : `Try stripping out loaded language and stay closer to the facts.`
                }
              />

              <article className="border-t-2 border-ink pt-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Original
                </p>
                <h3 className="mt-2 font-serif text-2xl text-ink/70 line-through decoration-ink/30">
                  {currentArticle.title}
                </h3>
                <p className="mt-5 font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                  Your rewrite
                </p>
                <h3 className="mt-2 font-serif text-2xl md:text-3xl font-semibold text-ink">
                  {draft.trim()}
                </h3>
              </article>

              {usedMock && (
                <p className="font-serif italic text-ink/55 border-l-2 border-ink/20 pl-4 text-sm">
                  Offline mode · scored locally on tone, length, signal preservation, and distance.
                </p>
              )}

              {scoreResult && (
                <section>
                  <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
                    <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                      Network grade
                    </p>
                    <p className="font-serif font-semibold text-ink tabular-nums leading-none text-7xl md:text-8xl">
                      <AnimatedTotal value={scoreResult.total} />
                      <span className="text-base text-ink/45 ml-2">/ 100</span>
                    </p>
                  </div>

                  {Object.keys(scoreResult.breakdown).length > 0 && (
                    <dl className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      {Object.entries(scoreResult.breakdown).map(([k, v], i) => (
                        <SignalRow
                          key={k}
                          name={k}
                          value={typeof v === 'number' ? v : 0}
                          delay={300 + i * 110}
                        />
                      ))}
                    </dl>
                  )}
                </section>
              )}

              <section className="grid grid-cols-3 border-t border-l border-ink/15">
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Round</p>
                  <p className="mt-2 font-serif text-xl text-ink tabular-nums">
                    You {roundDelta.user} · Net {roundDelta.model}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Cumulative</p>
                  <p className="mt-2 font-serif text-xl text-ink tabular-nums">
                    {score.userScore} vs {score.modelScore}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Streak</p>
                  <p className="mt-2 font-serif text-xl text-ink tabular-nums">{score.streak}</p>
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

function AnimatedTotal({ value }: { value: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 100)
    return () => clearTimeout(t)
  }, [])
  const animated = useCountUp(shown ? value : 0, 1100)
  return <span>{Math.round(animated)}</span>
}
