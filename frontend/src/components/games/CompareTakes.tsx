import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getComparePair, fallbackComparePair, type ComparePair } from '../../lib'
import Masthead from '../Masthead'
import BeatTheNetworkScorecard from '../BeatTheNetworkScorecard'
import PlayHud from '../PlayHud'
import RoundFeedback from '../RoundFeedback'
import Countdown from '../Countdown'
import PointBurst from '../PointBurst'
import NeuralLoader from '../NeuralLoader'
import TopicChooser from '../TopicChooser'
import { useGameScore } from '../../hooks/useGameScore'
import { sfx } from '../../lib/gameSound'
import { copy } from '../../lib/microcopy'

const TOTAL_ROUNDS = 10
const STORAGE_KEY = 'compare_takes_best'

const TOPICS = [
  'climate change',
  'student loans',
  'immigration',
  'gun policy',
  'healthcare',
  'taxes',
  'foreign policy',
  'education',
  'crime',
  'inflation',
]

type Phase = 'menu' | 'topic' | 'countdown' | 'loading-round' | 'playing' | 'revealed' | 'gameOver'
type BiasedPick = 'A' | 'B' | 'Equal'
type DirectionPick = 'Liberal' | 'Conservative' | 'Center'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function actualMoreBiased(left: number, right: number): BiasedPick {
  const dl = Math.abs(left)
  const dr = Math.abs(right)
  if (Math.abs(dl - dr) < 0.05) return 'Equal'
  return dl > dr ? 'A' : 'B'
}

function actualDirection(score: number): DirectionPick {
  if (score <= -0.2) return 'Liberal'
  if (score >= 0.2) return 'Conservative'
  return 'Center'
}

function dominantDirection(left: number, right: number): DirectionPick {
  const lScore = Math.abs(left) > Math.abs(right) ? left : right
  return actualDirection(lScore)
}

async function tryGetPair(topic: string): Promise<ComparePair> {
  try {
    return await getComparePair(topic)
  } catch {
    return fallbackComparePair(topic)
  }
}

export default function CompareTakes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const topicQuery = searchParams.get('q')?.trim() || ''
  const score = useGameScore({ totalRounds: TOTAL_ROUNDS, storageKey: STORAGE_KEY })

  const [phase, setPhase] = useState<Phase>('menu')
  const [topicQueue, setTopicQueue] = useState<string[]>([])
  const [pair, setPair] = useState<ComparePair | null>(null)
  const [pickedBiased, setPickedBiased] = useState<BiasedPick | null>(null)
  const [pickedDirection, setPickedDirection] = useState<DirectionPick | null>(null)
  const [roundDelta, setRoundDelta] = useState({ user: 0, model: 0 })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [burst, setBurst] = useState<{ show: boolean; pts: number; variant: 'correct' | 'wrong' | 'partial' }>({ show: false, pts: 0, variant: 'correct' })
  const [chosenTopic, setChosenTopic] = useState<string>(topicQuery)

  const loadNextPair = async (queue: string[]): Promise<{ pair: ComparePair; remaining: string[] }> => {
    let q = queue.slice()
    if (q.length === 0) q = shuffle(TOPICS)
    const topic = q.shift()!
    const p = await tryGetPair(topic)
    return { pair: p, remaining: q }
  }

  const startGame = async (topic: string) => {
    sfx.unlock()
    setChosenTopic(topic)
    setLoading(true)
    setLoadError(null)
    try {
      // Lead with chosen topic, then shuffle the broader TOPICS list for variety.
      const queue = topic
        ? [topic, ...shuffle(TOPICS.filter((t) => t !== topic))]
        : shuffle(TOPICS)
      const result = await loadNextPair(queue)
      setLoading(false)
      setPair(result.pair)
      setTopicQueue(result.remaining)
      score.reset()
      setPickedBiased(null)
      setPickedDirection(null)
      setPhase('countdown')
    } catch {
      setLoading(false)
      setLoadError('Failed to load contrasting pairs.')
    }
  }

  const submit = () => {
    if (!pair || !pickedBiased || !pickedDirection) return
    const left = pair.article_a.article.spectrum_score
    const right = pair.article_b.article.spectrum_score
    const actBiased = actualMoreBiased(left, right)
    const actDir = dominantDirection(left, right)

    let pts = 0
    if (pickedBiased === actBiased) pts += 1
    if (pickedDirection === actDir) pts += 1

    const modelPts = Math.random() < 0.9 ? 2 : 1
    setRoundDelta({ user: pts, model: modelPts })
    score.recordResult(pts, modelPts, pts >= 1)
    if (pts === 2) {
      sfx.correct()
      setBurst({ show: true, pts: 2, variant: 'correct' })
      if ((score.streak + 1) === 3 || (score.streak + 1) === 5 || (score.streak + 1) === 10) {
        setTimeout(() => sfx.streak(), 200)
      }
    } else if (pts === 1) {
      sfx.reveal()
      setBurst({ show: true, pts: 1, variant: 'partial' })
    } else {
      sfx.wrong()
      setBurst({ show: true, pts: 0, variant: 'wrong' })
    }
    setPhase('revealed')
  }

  const advance = async () => {
    if (score.currentRound >= TOTAL_ROUNDS) {
      score.nextRound()
      setPhase('gameOver')
      return
    }
    setPhase('loading-round')
    try {
      const result = await loadNextPair(topicQueue)
      setPair(result.pair)
      setTopicQueue(result.remaining)
      setPickedBiased(null)
      setPickedDirection(null)
      setRoundDelta({ user: 0, model: 0 })
      score.nextRound()
      setPhase('playing')
    } catch {
      score.nextRound()
      setPhase('gameOver')
    }
  }

  useEffect(() => {
    if (phase !== 'playing') return
    setPickedBiased(null)
    setPickedDirection(null)
  }, [phase, score.currentRound])

  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
            Game 03 · Compare Two Takes
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight">
            Same story.
            <br />
            Two desks.
          </h1>
          <p className="mt-6 max-w-xl font-serif text-lg md:text-xl italic text-ink/70">
            Two articles per round on the same topic. Decide which is more biased, and which way it leans.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 border-t border-l border-ink/15">
            {[
              { k: 'Read', v: 'Two takes side by side.' },
              { k: 'Pick', v: 'More biased: A, B, or Even.' },
              { k: 'Score', v: '+1 magnitude · +1 direction.' },
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

          {loadError && <p className="mt-6 font-serif text-sm italic text-accent">{loadError}</p>}
        </main>
      </div>
    )
  }

  if (phase === 'topic') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <TopicChooser
          gameNumber="Game 03"
          gameName="Compare Two Takes"
          initial={chosenTopic}
          prompt="Pick a topic. We'll pull two articles on the same story from opposing-leaning outlets and you call which is more biased."
          onPick={startGame}
          loading={loading}
        />
        {loading && (
          <div className="mt-4 flex justify-center pb-16">
            <NeuralLoader label="Pairing contrasting takes" />
          </div>
        )}
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
            rounds={TOTAL_ROUNDS * 2}
            gameName="Compare Two Takes"
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

  if (phase === 'loading-round') {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <main className="mx-auto w-full max-w-4xl px-6 py-24 flex justify-center">
          <NeuralLoader label="Pulling next pair from the wire" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Masthead />

      <PlayHud
        gameNumber="Game 03"
        gameName="Compare Two Takes"
        topic={pair?.query || undefined}
        userScore={score.userScore}
        modelScore={score.modelScore}
        streak={score.streak}
        currentRound={score.currentRound}
        totalRounds={TOTAL_ROUNDS}
      />

      <PointBurst show={burst.show} points={burst.pts} variant={burst.variant} onDone={() => setBurst((b) => ({ ...b, show: false }))} />

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <AnimatePresence mode="wait">
          {phase === 'playing' && pair && (
            <motion.div
              key={`play-${score.currentRound}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-10"
            >
              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {([['A', pair.article_a], ['B', pair.article_b]] as const).map(([letter, det]) => {
                  const selected = pickedBiased === letter
                  return (
                    <motion.article
                      key={letter}
                      animate={selected ? { scale: 1.03 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      className={`border-2 p-6 md:p-8 transition-colors cursor-pointer ${
                        selected
                          ? 'border-accent bg-accent/5 shadow-[0_18px_50px_-20px_rgba(185,28,28,0.45)]'
                          : 'border-ink/15 hover:border-ink/40'
                      }`}
                      onClick={() => {
                        setPickedBiased(letter)
                        sfx.click()
                      }}
                    >
                      <div className="flex items-baseline justify-between">
                        <p className={`font-sans text-[10px] uppercase tracking-[0.24em] ${selected ? 'text-accent' : 'text-ink/55'}`}>
                          Take {letter} {selected && '· more biased'}
                        </p>
                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/40">
                          {det.article.source}
                        </p>
                      </div>
                      <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">
                        {det.article.title}
                      </h3>
                      <p className="mt-3 font-serif text-base text-ink/75 leading-relaxed">
                        {det.article.snippet}
                      </p>
                    </motion.article>
                  )
                })}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3">
                    More biased
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['A', 'B', 'Equal'] as BiasedPick[]).map((opt) => {
                      const active = pickedBiased === opt
                      return (
                        <motion.button
                          key={opt}
                          onClick={() => {
                            setPickedBiased(opt)
                            sfx.click()
                          }}
                          whileHover={!active ? { scale: 1.04 } : {}}
                          whileTap={{ scale: 0.94 }}
                          className={[
                            'border-2 px-3 py-4 font-serif text-xl transition-all',
                            active ? 'bg-ink text-paper border-ink' : 'text-ink border-ink/20 hover:border-ink/50',
                          ].join(' ')}
                        >
                          {opt}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3">
                    Direction of dominant bias
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Liberal', 'Center', 'Conservative'] as DirectionPick[]).map((opt) => {
                      const active = pickedDirection === opt
                      const tone =
                        opt === 'Liberal'
                          ? active ? 'bg-blue-700 text-paper border-blue-700' : 'text-blue-700 border-blue-700/30 hover:border-blue-700/70'
                          : opt === 'Conservative'
                            ? active ? 'bg-accent text-paper border-accent' : 'text-accent border-accent/30 hover:border-accent/70'
                            : active ? 'bg-ink text-paper border-ink' : 'text-ink border-ink/20 hover:border-ink/50'
                      return (
                        <motion.button
                          key={opt}
                          onClick={() => {
                            setPickedDirection(opt)
                            sfx.click()
                          }}
                          whileHover={!active ? { scale: 1.04 } : {}}
                          whileTap={{ scale: 0.94 }}
                          className={`border-2 px-3 py-4 font-serif text-xl transition-all ${tone}`}
                        >
                          {opt}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between border-t border-ink/15 pt-6">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                  Round {score.currentRound} of {TOTAL_ROUNDS}
                </span>
                <motion.button
                  onClick={submit}
                  disabled={!pickedBiased || !pickedDirection}
                  whileHover={pickedBiased && pickedDirection ? { scale: 1.04 } : {}}
                  whileTap={pickedBiased && pickedDirection ? { scale: 0.96 } : {}}
                  className="bg-accent text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-6 py-3.5 hover:bg-ink transition-colors inline-flex items-center gap-2 disabled:opacity-25 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(185,28,28,0.6)]"
                >
                  File your call <span aria-hidden>→</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === 'revealed' && pair && (
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
                  roundDelta.user === 2 ? 'correct' : roundDelta.user === 1 ? 'partial' : 'wrong'
                }
                headline={
                  roundDelta.user === 2 ? copy.right() : roundDelta.user === 1 ? copy.partial() : copy.wrong()
                }
                detail={
                  roundDelta.user === 2
                    ? 'Both calls right.'
                    : roundDelta.user === 1
                      ? 'Got one out of two.'
                      : 'Both calls were off.'
                }
              />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {([['A', pair.article_a], ['B', pair.article_b]] as const).map(([letter, det]) => (
                  <article key={letter} className="border-2 border-ink/15 p-6 md:p-8">
                    <div className="flex items-baseline justify-between">
                      <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">Take {letter}</p>
                      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-accent tabular-nums">
                        score {det.article.spectrum_score.toFixed(2)}
                      </p>
                    </div>
                    <h3 className="mt-3 font-serif text-xl font-semibold leading-tight text-ink">
                      {det.article.title}
                    </h3>
                    <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink/55">
                      {det.article.source} · {actualDirection(det.article.spectrum_score)}
                    </p>
                  </article>
                ))}
              </section>

              <section className="grid grid-cols-3 border-t border-l border-ink/15">
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">More biased</p>
                  <p className="mt-2 font-serif text-xl text-ink">
                    Actual {actualMoreBiased(pair.article_a.article.spectrum_score, pair.article_b.article.spectrum_score)}
                  </p>
                  <p className={`mt-1 font-sans text-[11px] tracking-[0.14em] ${pickedBiased === actualMoreBiased(pair.article_a.article.spectrum_score, pair.article_b.article.spectrum_score) ? 'text-emerald-700' : 'text-accent'}`}>
                    Your call {pickedBiased}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Direction</p>
                  <p className="mt-2 font-serif text-xl text-ink">
                    Actual {dominantDirection(pair.article_a.article.spectrum_score, pair.article_b.article.spectrum_score)}
                  </p>
                  <p className={`mt-1 font-sans text-[11px] tracking-[0.14em] ${pickedDirection === dominantDirection(pair.article_a.article.spectrum_score, pair.article_b.article.spectrum_score) ? 'text-emerald-700' : 'text-accent'}`}>
                    Your call {pickedDirection}
                  </p>
                </div>
                <div className="border-r border-b border-ink/15 p-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">Round</p>
                  <p className="mt-2 font-serif text-xl text-ink tabular-nums">
                    You {roundDelta.user} · Net {roundDelta.model}
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
