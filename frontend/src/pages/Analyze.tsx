import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import Masthead from '../components/Masthead'
import LiveInferenceAnimation from '../components/LiveInferenceAnimation'
import InferenceReceipt from '../components/InferenceReceipt'
import { analyzeArticle } from '../lib/api'
import type { ArticleDetail } from '../lib/api'

type Mode = 'paste' | 'url'

type DimKey = keyof ArticleDetail['bias_dimensions']
type DimRange = 'unit' | 'bipolar'

const RADAR_KEYS: { key: DimKey; label: string; range: DimRange }[] = [
  { key: 'factuality', label: 'Factuality', range: 'unit' },
  { key: 'economic', label: 'Economic', range: 'unit' },
  { key: 'social', label: 'Social', range: 'unit' },
  { key: 'establishment', label: 'Establishment', range: 'unit' },
  { key: 'sensationalism', label: 'Sensation', range: 'unit' },
  { key: 'loaded_language', label: 'Loaded', range: 'unit' },
  { key: 'source_diversity', label: 'Sources', range: 'unit' },
  { key: 'headline_body_skew', label: 'H/B skew', range: 'bipolar' },
]

function toUnit(v: number | undefined, range: DimRange): number {
  if (v === undefined || Number.isNaN(v)) return 0
  if (range === 'bipolar') return Math.min(1, Math.abs(v))
  return Math.max(0, Math.min(1, v))
}

function pctLabel(v: number | undefined, range: DimRange): string {
  if (v === undefined || Number.isNaN(v)) return '—'
  if (range === 'bipolar') {
    const sign = v >= 0 ? '+' : '−'
    return `${sign}${Math.round(Math.abs(v) * 100)}`
  }
  return `${Math.round(Math.max(0, Math.min(1, v)) * 100)}`
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4))
}

export default function Analyze() {
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('paste')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [running, setRunning] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const [responseReady, setResponseReady] = useState<ArticleDetail | null>(null)
  const [pendingResponse, setPendingResponse] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState<number | null>(null)
  const [inferenceMs, setInferenceMs] = useState<number | null>(null)
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as { text?: string; url?: string } | null
    let prefilledText = state?.text
    let prefilledUrl = state?.url
    try {
      if (!prefilledText) {
        const t = sessionStorage.getItem('analyze:prefill:text')
        if (t) {
          prefilledText = t
          sessionStorage.removeItem('analyze:prefill:text')
        }
      }
      if (!prefilledUrl) {
        const u = sessionStorage.getItem('analyze:prefill:url')
        if (u) {
          prefilledUrl = u
          sessionStorage.removeItem('analyze:prefill:url')
        }
      }
    } catch {
      /* ignore */
    }
    if (prefilledUrl) {
      setMode('url')
      setUrl(prefilledUrl)
    } else if (prefilledText) {
      setMode('paste')
      setText(prefilledText)
    }
  }, [location.state])

  const result = responseReady
  const showAnimation = running && !result

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (mode === 'paste' && !text.trim()) {
      setError('Paste an article body to analyze.')
      return
    }
    if (mode === 'url' && !url.trim()) {
      setError('Enter a URL to fetch and analyze.')
      return
    }

    setRunning(true)
    setAnimationDone(false)
    setResponseReady(null)
    setPendingResponse(null)
    setTokenCount(null)
    setInferenceMs(null)
    setExtractionWarning(null)

    const started = performance.now()
    const tokens =
      mode === 'paste' ? estimateTokens(text) : Math.round((url.length + (title.length || 60)) / 3)
    setTokenCount(tokens)

    try {
      const detail = await analyzeArticle(
        mode === 'paste'
          ? { text, title: title || undefined }
          : { url, title: title || undefined },
      )
      const elapsed = Math.round(performance.now() - started)
      setInferenceMs(Math.max(elapsed, 480))
      if (mode === 'url' && (detail.article.snippet?.trim().length ?? 0) < 120) {
        setExtractionWarning(
          "We couldn't reliably extract the article body from that URL. The scoring below is based on whatever we got — try pasting the text directly for a stronger result.",
        )
      }
      setPendingResponse(detail)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed.'
      setError(message)
      setRunning(false)
    }
  }

  useEffect(() => {
    if (running && pendingResponse && animationDone && !responseReady) {
      setResponseReady(pendingResponse)
    }
  }, [running, pendingResponse, animationDone, responseReady])

  function reset() {
    setRunning(false)
    setAnimationDone(false)
    setResponseReady(null)
    setPendingResponse(null)
    setError(null)
    setExtractionWarning(null)
  }

  return (
    <div className="min-h-screen bg-paper-cream text-ink">
      <Masthead />

      <main className="mx-auto w-full max-w-[1280px] px-12 py-14 md:py-20">
        {/* Title block */}
        <section className="grid grid-cols-12 gap-10 items-end">
          <div className="col-span-7">
            <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
              Section B &middot; The Lab
            </div>
            <h1 className="mt-4 font-display font-black text-ink text-[64px] leading-[0.96] tracking-mega-tight md:text-[80px]">
              Analyze any
              <br />
              article.
            </h1>
          </div>
          <div className="col-span-5 border-l border-ink/20 pl-10">
            <p className="font-serif italic text-[18px] leading-[1.55] text-ink/70 md:text-[19px]">
              Paste a body of text or hand the network a URL. TheBiasGraph v2 returns
              eight bias dimensions, the loaded phrases, and a verifiable inference
              receipt.
            </p>
          </div>
        </section>

        {!running && !result && (
          <form onSubmit={onSubmit} className="mt-14 grid grid-cols-12 gap-10">
            <div className="col-span-2 hidden md:block">
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                Input
              </span>
            </div>

            <div className="col-span-12 md:col-span-10">
              <div className="border-2 border-ink bg-paper">
                {/* Tabs */}
                <div
                  role="tablist"
                  aria-label="Input mode"
                  className="flex items-center gap-6 border-b border-ink/15 px-6 pt-4"
                >
                  {(
                    [
                      { id: 'paste', label: 'Paste text' },
                      { id: 'url', label: 'From URL' },
                    ] as { id: Mode; label: string }[]
                  ).map((t) => {
                    const active = mode === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setMode(t.id)}
                        className={`-mb-px border-b-2 pb-3 font-sans text-[11px] uppercase tracking-[0.22em] transition-colors ${
                          active
                            ? 'border-accent text-ink'
                            : 'border-transparent text-ink/45 hover:text-ink'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                  <span className="ml-auto pb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                    {mode === 'paste'
                      ? `${estimateTokens(text).toLocaleString()} tokens (est.)`
                      : 'Server-side extraction'}
                  </span>
                </div>

                <div className="px-6 py-6">
                  <AnimatePresence mode="wait">
                    {mode === 'paste' ? (
                      <motion.div
                        key="paste"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <label className="block">
                          <span className="block font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                            Headline (optional)
                          </span>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled draft"
                            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 font-serif text-[22px] text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="block font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                            Article body
                          </span>
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={10}
                            placeholder="Paste the full article body here. The network needs at least a paragraph to score reliably."
                            className="mt-2 w-full resize-y border border-ink/20 bg-paper-cream/60 p-4 font-serif italic text-[16px] leading-[1.65] text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none"
                          />
                        </label>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="url"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <label className="block">
                          <span className="block font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                            Article URL
                          </span>
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.example.com/news/story"
                            className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 font-mono text-[14px] text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
                          />
                        </label>
                        <p className="font-serif italic text-[14px] text-ink/65">
                          The server fetches the page, extracts the article body, and runs
                          the same inference pipeline as paste-text.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <div className="mt-6 border-l-2 border-accent pl-4 font-serif italic text-sm text-ink/75">
                      {error}
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
                      8 dimensions · live inference · receipt included
                    </span>
                    <button
                      type="submit"
                      className="bg-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors"
                    >
                      Run analysis &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {showAnimation && (
          <div className="mt-14">
            <LiveInferenceAnimation onComplete={() => setAnimationDone(true)} />
          </div>
        )}

        {result && (
          <ResultView
            detail={result}
            tokens={tokenCount ?? undefined}
            inferenceMs={inferenceMs ?? undefined}
            warning={extractionWarning}
            onAnalyzeAnother={reset}
          />
        )}
      </main>
    </div>
  )
}

function ResultView({
  detail,
  tokens,
  inferenceMs,
  warning,
  onAnalyzeAnother,
}: {
  detail: ArticleDetail
  tokens?: number
  inferenceMs?: number
  warning?: string | null
  onAnalyzeAnother: () => void
}) {
  const a = detail.article
  const d = detail.bias_dimensions
  const radar = useMemo(
    () =>
      RADAR_KEYS.map((k) => ({
        key: k.label,
        value: toUnit(d[k.key] as number | undefined, k.range),
      })),
    [d],
  )

  const loaded = detail.loaded_phrases ?? []
  const sd = detail.source_diversity_detail
  const skew = detail.headline_body_skew_detail

  return (
    <article className="mt-14">
      <header className="border-t-2 border-b border-ink py-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65">
          <span>{a.source || 'User submission'}</span>
          <span aria-hidden className="text-ink/30">·</span>
          <span className="text-accent">Comparison Analysis</span>
        </div>
        <h2 className="mt-3 font-display font-black text-ink text-[40px] leading-[0.98] tracking-mega-tight md:text-[60px]">
          {a.title || 'Untitled article'}
        </h2>
        {a.snippet && (
          <p className="mt-4 max-w-3xl font-serif italic text-[18px] leading-[1.45] text-ink/75 md:text-[20px]">
            {a.snippet}
          </p>
        )}
        {warning && (
          <aside className="mt-6 grid grid-cols-[auto_1fr] items-start gap-4 border border-ink/30 bg-paper px-5 py-4">
            <span className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
              Editor&apos;s note
            </span>
            <p className="font-serif italic text-[14px] leading-relaxed text-ink/75">
              {warning}
            </p>
          </aside>
        )}
      </header>

      <div className="mt-12 grid grid-cols-12 gap-10">
        {/* Radar + dimensions */}
        <section className="col-span-12 md:col-span-7">
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Bias dimensions
            </span>
            <span className="h-px flex-1 bg-ink/15" />
            <span className="font-mono text-[10px] tabular-nums text-ink/45">
              {RADAR_KEYS.length} axes
            </span>
          </div>
          <div className="mt-4 h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="#11111122" />
                <PolarAngleAxis
                  dataKey="key"
                  tick={{ fill: '#111111', fontSize: 11, fontFamily: 'Inter' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 1]}
                  tick={{ fill: '#11111155', fontSize: 9 }}
                  stroke="#11111122"
                />
                <Radar
                  dataKey="value"
                  stroke="#B91C1C"
                  fill="#B91C1C"
                  fillOpacity={0.18}
                  strokeWidth={1.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink/30 pt-5">
            {RADAR_KEYS.map((k) => {
              const v = d[k.key] as number | undefined
              return (
                <div
                  key={k.key}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-3"
                >
                  <dt className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
                    {k.label}
                  </dt>
                  <dd className="font-display font-black text-[14px] tabular-nums leading-none text-ink">
                    {pctLabel(v, k.range)}
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>

        {/* Loaded language + signals */}
        <section className="col-span-12 md:col-span-5 space-y-10">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                Loaded phrases
              </span>
              <span className="h-px flex-1 bg-ink/15" />
              <span className="font-mono text-[10px] tabular-nums text-ink/45">
                {loaded.length}
              </span>
            </div>
            {loaded.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {loaded.slice(0, 8).map((p, i) => (
                  <li key={i} className="border-l-2 border-accent/70 pl-3">
                    <p className="font-serif text-[15px] leading-snug text-ink">
                      &ldquo;{p.text}&rdquo;
                    </p>
                    <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                      {p.reason}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-serif italic text-sm text-ink/55">
                No phrases flagged at the loaded-language threshold.
              </p>
            )}
          </div>

          {sd && (
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Source diversity
                </span>
                <span className="h-px flex-1 bg-ink/15" />
                <span className="font-mono text-[10px] tabular-nums text-ink/45">
                  {Math.round(sd.score * 100)}
                </span>
              </div>
              <p className="mt-3 font-serif text-[14px] leading-relaxed text-ink/75">
                {sd.quoted_entities.length} named source
                {sd.quoted_entities.length === 1 ? '' : 's'} ·{' '}
                {sd.anonymous_count} anonymous attribution
                {sd.anonymous_count === 1 ? '' : 's'}.
              </p>
              {sd.quoted_entities.length > 0 && (
                <p className="mt-2 font-sans text-[11px] tracking-wide text-ink/60">
                  {sd.quoted_entities.slice(0, 6).join(' · ')}
                </p>
              )}
            </div>
          )}

          {skew && (
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Headline / body skew
                </span>
                <span className="h-px flex-1 bg-ink/15" />
                <span className="font-mono text-[10px] tabular-nums text-ink/45">
                  Δ {skew.delta.toFixed(2)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                    Headline tone
                  </span>
                  <span className="mt-1 block font-display font-black text-[24px] tabular-nums leading-none text-ink">
                    {skew.headline_tone.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                    Body tone
                  </span>
                  <span className="mt-1 block font-display font-black text-[24px] tabular-nums leading-none text-ink">
                    {skew.body_tone.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-14 grid grid-cols-12 gap-10">
        <div className="col-span-12 md:col-span-7 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onAnalyzeAnother}
            className="border border-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-ink hover:bg-ink hover:text-paper-cream transition-colors"
          >
            &larr; Analyze another
          </button>
          {a.url && (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              Open original ↗
            </a>
          )}
        </div>
        <div className="col-span-12 md:col-span-5">
          <InferenceReceipt
            tokens={tokens}
            inferenceMs={inferenceMs}
            confidence={a.confidence}
          />
        </div>
      </div>
    </article>
  )
}
