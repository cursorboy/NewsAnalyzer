import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MODEL } from '../lib/modelInfo'
import { useCountUp } from '../hooks/useCountUp'
import { sfx } from '../lib/gameSound'
import { copy } from '../lib/microcopy'

type Props = {
  userScore: number
  modelScore: number
  rounds: number
  gameName: string
  onReplay: () => void
  onHome?: () => void
}

type VerdictTone = 'win' | 'loss' | 'tie'
type Verdict = { headline: string; flash: string; tone: VerdictTone }

function getVerdict(user: number, model: number): Verdict {
  if (user > model) return { headline: copy.finalWin(), flash: 'bg-emerald-500', tone: 'win' }
  if (user < model) return { headline: copy.finalLoss(), flash: 'bg-accent', tone: 'loss' }
  return { headline: copy.finalTie(), flash: 'bg-amber-400', tone: 'tie' }
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function BeatTheNetworkScorecard({
  userScore,
  modelScore,
  rounds,
  gameName,
  onReplay,
  onHome,
}: Props) {
  const v = getVerdict(userScore, modelScore)
  const userPct = rounds > 0 ? Math.max(0, Math.min(1, userScore / rounds)) : 0
  const modelPct = rounds > 0 ? Math.max(0, Math.min(1, modelScore / rounds)) : 0

  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [flashOn, setFlashOn] = useState(false)

  useEffect(() => {
    const timers: number[] = []
    timers.push(window.setTimeout(() => setStage(1), 80))
    timers.push(window.setTimeout(() => setStage(2), 750))
    timers.push(window.setTimeout(() => setStage(3), 2100))
    timers.push(window.setTimeout(() => {
      setStage(4)
      setFlashOn(true)
      sfx.fanfare()
    }, 3100))
    timers.push(window.setTimeout(() => setFlashOn(false), 3500))
    timers.push(window.setTimeout(() => setStage(5), 3900))
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const userLive = useCountUp(stage >= 2 ? userScore : 0, 1200)
  const modelLive = useCountUp(stage >= 2 ? modelScore : 0, 1200)

  const [copied, setCopied] = useState(false)
  const onShare = async () => {
    const txt = `I scored ${fmt(userScore)} vs the network's ${fmt(modelScore)} on ${gameName}, TheBiasGraph.`
    try {
      await navigator.clipboard.writeText(txt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <AnimatePresence>
        {flashOn && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: 0.5, times: [0, 0.3, 1] }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-30 pointer-events-none ${v.flash}`}
          />
        )}
      </AnimatePresence>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-paper border-2 border-ink mx-auto w-full max-w-3xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]"
      >
        <header className="border-b border-ink/15 px-6 md:px-10 pt-10 pb-7 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
            {gameName}
          </p>
          <AnimatePresence mode="wait">
            {stage >= 1 && (
              <motion.h2
                key="rc"
                initial={{ scale: 0.6, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="font-serif text-5xl md:text-6xl font-semibold text-ink mt-3 leading-none tracking-tight"
              >
                ROUND COMPLETE
              </motion.h2>
            )}
          </AnimatePresence>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink/15">
          <div className="px-6 md:px-10 py-10 text-center">
            <AnimatePresence>
              {stage >= 3 && (
                <motion.p
                  key="ulab"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-sans text-[11px] uppercase tracking-[0.24em] text-blue-700"
                >
                  You
                </motion.p>
              )}
            </AnimatePresence>
            <p className="font-serif text-7xl md:text-9xl font-semibold text-blue-700 mt-2 tabular-nums leading-none">
              {Number.isInteger(userScore) ? Math.round(userLive) : userLive.toFixed(1)}
            </p>
            <p className="font-sans text-[11px] tracking-[0.14em] text-ink/45 mt-3">of {rounds}</p>
            <div className="mt-6 h-[3px] bg-ink/10 relative overflow-hidden">
              <motion.span
                className="absolute left-0 top-0 h-full bg-blue-700"
                initial={{ width: 0 }}
                animate={{ width: stage >= 2 ? `${userPct * 100}%` : 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="px-6 md:px-10 py-10 text-center">
            <AnimatePresence>
              {stage >= 3 && (
                <motion.p
                  key="mlab"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-sans text-[11px] uppercase tracking-[0.24em] text-accent"
                >
                  {MODEL.name}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="font-serif text-7xl md:text-9xl font-semibold text-accent mt-2 tabular-nums leading-none">
              {Number.isInteger(modelScore) ? Math.round(modelLive) : modelLive.toFixed(1)}
            </p>
            <p className="font-sans text-[11px] tracking-[0.14em] text-ink/45 mt-3">of {rounds}</p>
            <div className="mt-6 h-[3px] bg-ink/10 relative overflow-hidden">
              <motion.span
                className="absolute left-0 top-0 h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: stage >= 2 ? `${modelPct * 100}%` : 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-ink/15 px-6 md:px-10 py-10 text-center min-h-[140px] flex items-center justify-center">
          <AnimatePresence>
            {stage >= 4 && (
              <motion.p
                key="verdict"
                initial={{ scale: 0.6, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className={`font-serif font-semibold leading-none tracking-tight text-5xl md:text-7xl ${
                  v.tone === 'win' ? 'text-emerald-700' : v.tone === 'loss' ? 'text-accent' : 'text-amber-600'
                }`}
              >
                {v.headline}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {stage >= 5 && (
            <motion.footer
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="border-t border-ink/15 px-6 md:px-10 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <motion.button
                  onClick={onReplay}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="bg-ink text-paper font-sans text-[11px] uppercase tracking-[0.22em] px-5 py-3 hover:bg-accent transition-colors inline-flex items-center gap-2"
                >
                  Play again <span aria-hidden>→</span>
                </motion.button>
                <motion.button
                  onClick={onShare}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`border font-sans text-[11px] uppercase tracking-[0.22em] px-5 py-3 transition-colors inline-flex items-center gap-2 ${
                    copied ? 'border-emerald-600 text-emerald-700' : 'border-ink/25 hover:border-ink text-ink/65 hover:text-ink'
                  }`}
                >
                  {copied ? 'Copied to clipboard' : 'Copy result'}
                </motion.button>
              </div>
              {onHome ? (
                <button
                  onClick={onHome}
                  className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/55 hover:text-ink transition-colors inline-flex items-center gap-2"
                >
                  <span aria-hidden>←</span> Back to games
                </button>
              ) : (
                <Link
                  to="/play"
                  className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/55 hover:text-ink transition-colors inline-flex items-center gap-2"
                >
                  <span aria-hidden>←</span> Back to games
                </Link>
              )}
            </motion.footer>
          )}
        </AnimatePresence>
      </motion.article>
    </>
  )
}
