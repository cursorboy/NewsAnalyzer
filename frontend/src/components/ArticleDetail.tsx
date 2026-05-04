import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { analyzeArticle, getArticleDetail } from '../lib'
import type { ArticleDetail as Detail, LoadedPhrase } from '../lib'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import Masthead from './Masthead'
import InferenceTrace from './InferenceTrace'
import InferenceReceipt from './InferenceReceipt'
import LoadedLanguageHighlight from './LoadedLanguageHighlight'
import NeuralLoader from './NeuralLoader'
import PullQuote from './editorial/PullQuote'

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (!id) return
    setDetail(null)
    setError(null)
    getArticleDetail(id)
      .then(setDetail)
      .catch((e) => setError(String(e)))
  }, [id])

  async function runAnalysis() {
    if (!detail) return
    setAnalyzing(true)
    setError(null)
    try {
      const a = detail.article
      const fresh = await analyzeArticle({
        url: a.url,
        title: a.title,
        text: a.snippet,
      })
      setDetail(fresh)
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  if (error && !detail) {
    return (
      <div className="min-h-screen bg-paper-cream text-ink">
        <Masthead />
        <div className="mx-auto max-w-3xl px-12 py-20 text-center font-serif italic text-ink/70">
          {error}
        </div>
      </div>
    )
  }
  if (!detail) {
    return (
      <div className="min-h-screen bg-paper-cream text-ink">
        <Masthead />
        <div className="flex min-h-[60vh] items-center justify-center">
          <NeuralLoader label="Loading article" />
        </div>
      </div>
    )
  }

  const a = detail.article
  const d = detail.bias_dimensions
  const dateline = formatDate(a.published_at)
  const loadedPhrases = detail.loaded_phrases ?? []
  const rawBody = (a as { body?: string }).body
  const hasBody = typeof rawBody === 'string' && rawBody.trim().length > 0
  const bodyText = hasBody ? rawBody! : a.snippet
  const tokens = Math.max(120, Math.round(bodyText.split(/\s+/).length * 1.3))
  const placeholder = isPlaceholderDetail(detail)

  const radarData = buildRadarData(d)

  return (
    <div className="min-h-screen bg-paper-cream text-ink">
      <Masthead />

      <div className="mx-auto w-full max-w-[1280px] px-12 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55 hover:text-ink"
        >
          &larr; Back
        </button>
      </div>

      <main className="mx-auto w-full max-w-[1280px] px-12 pb-20 pt-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="min-w-0">
            {/* Source/dateline kicker */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65">
              <span>{a.source}</span>
              {dateline && (
                <>
                  <span aria-hidden className="text-ink/30">·</span>
                  <span>{dateline}</span>
                </>
              )}
              <span aria-hidden className="text-ink/30">·</span>
              <span className="text-accent">Comparison Analysis</span>
            </div>

            {/* Headline */}
            <h1 className="mt-4 font-display text-[40px] font-black leading-[0.96] tracking-mega-tight text-ink md:text-[64px]">
              {a.title}
            </h1>

            {/* Italic lede */}
            <p className="mt-5 max-w-3xl font-serif italic text-[20px] leading-[1.45] text-ink/75 md:text-[24px]">
              {a.snippet}
            </p>

            <div className="mt-6 border-t border-ink/30" aria-hidden />

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              <span>By NeuralBias</span>
              <span aria-hidden className="text-ink/30">·</span>
              <span>Analysis Desk</span>
              {dateline && (
                <>
                  <span aria-hidden className="text-ink/30">·</span>
                  <span>{dateline.toUpperCase()}</span>
                </>
              )}
              <span aria-hidden className="text-ink/30">·</span>
              <span>
                bias {a.spectrum_score > 0 ? '+' : a.spectrum_score < 0 ? '−' : ''}
                {Math.abs(a.spectrum_score).toFixed(2)}
              </span>
              <span aria-hidden className="text-ink/30">·</span>
              <span>{Math.round(a.confidence * 100)}% confidence</span>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto underline decoration-ink/40 underline-offset-4 hover:decoration-ink hover:text-ink"
              >
                Read original &rarr;
              </a>
            </div>

            {placeholder && (
              <PlaceholderCTA
                analyzing={analyzing}
                error={error}
                onRun={runAnalysis}
              />
            )}

            {hasBody ? (
              <ArticleBody
                text={bodyText}
                phrases={loadedPhrases}
                pullQuote={extractPullQuote(bodyText, loadedPhrases)}
              />
            ) : (
              <p className="mt-10 font-serif italic text-[15px] leading-relaxed text-ink/55">
                Full article body not available in this view. Open the original to read in
                full, or run analysis to extract linguistic signals.
              </p>
            )}

            {a.reasoning && (
              <section className="mt-12 border-t border-ink/30 pt-6">
                <h2 className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
                  Model commentary
                </h2>
                <p className="mt-3 font-serif italic text-[15px] leading-relaxed text-ink/80">
                  {a.reasoning}
                </p>
              </section>
            )}

            {detail.highlighted_phrases.length > 0 && (
              <section className="mt-10 border-t border-ink/30 pt-6">
                <h2 className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
                  Highlighted phrases
                </h2>
                <ul className="mt-3 divide-y divide-ink/15">
                  {detail.highlighted_phrases.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-4 py-2"
                    >
                      <span className="font-serif text-[15px] text-ink">
                        &ldquo;{p.text}&rdquo;
                      </span>
                      <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                        {p.dimension}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-14">
              <InferenceReceipt
                tokens={tokens}
                inferenceMs={843}
                confidence={a.confidence}
              />
            </div>
          </article>

          <aside className="lg:sticky lg:top-6 lg:self-start space-y-6">
            <div aria-hidden>
              <div className="h-[3px] bg-ink" />
              <div className="mt-[3px] border-t border-ink/30" />
            </div>
            <p className="-mt-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/65">
              Sidebar &mdash; Network reading
            </p>

            <InferenceTrace
              tokens={tokens}
              loadedCount={loadedPhrases.length}
              confidence={a.confidence}
            />

            <BiasRadarPanel data={radarData} placeholder={placeholder} />

            <LinguisticSignals detail={detail} placeholder={placeholder} />
          </aside>
        </div>
      </main>
    </div>
  )
}

function PlaceholderCTA({
  analyzing,
  error,
  onRun,
}: {
  analyzing: boolean
  error: string | null
  onRun: () => void
}) {
  return (
    <section className="mt-8 border-2 border-ink bg-paper px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <span className="block font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            No analysis on file
          </span>
          <p className="mt-1 font-serif italic text-[15px] leading-snug text-ink/80">
            This article hasn&apos;t been scored yet. Run TheBiasGraph v2 to extract bias
            dimensions and linguistic signals.
          </p>
        </div>
        <button
          type="button"
          disabled={analyzing}
          onClick={onRun}
          className="shrink-0 bg-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? 'Analyzing…' : 'Run analysis →'}
        </button>
      </div>
      {error && (
        <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.22em] text-accent">
          {error}
        </p>
      )}
    </section>
  )
}

type RadarRow = { key: string; value: number; raw: number; placeholder: boolean }

function buildRadarData(d: Detail['bias_dimensions']): RadarRow[] {
  const rows: RadarRow[] = [
    { key: 'Factuality', value: clamp01(d.factuality), raw: d.factuality, placeholder: false },
    { key: 'Economic', value: Math.abs(clampUnit(d.economic)), raw: d.economic, placeholder: false },
    { key: 'Social', value: Math.abs(clampUnit(d.social)), raw: d.social, placeholder: false },
    { key: 'Establishment', value: Math.abs(clampUnit(d.establishment)), raw: d.establishment, placeholder: false },
    { key: 'Sensationalism', value: clamp01(d.sensationalism), raw: d.sensationalism, placeholder: false },
  ]
  if (d.loaded_language !== undefined) {
    rows.push({ key: 'Loaded Lang', value: clamp01(d.loaded_language), raw: d.loaded_language, placeholder: false })
  }
  if (d.source_diversity !== undefined) {
    rows.push({ key: 'Sources', value: clamp01(d.source_diversity), raw: d.source_diversity, placeholder: false })
  }
  if (d.headline_body_skew !== undefined) {
    rows.push({
      key: 'H↔B Skew',
      value: Math.abs(clampUnit(d.headline_body_skew)),
      raw: d.headline_body_skew,
      placeholder: false,
    })
  }
  return rows
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function clampUnit(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(-1, Math.min(1, v))
}

function isPlaceholderDetail(detail: Detail): boolean {
  const d = detail.bias_dimensions
  const flatBias =
    d.economic === 0 &&
    d.social === 0 &&
    d.establishment === 0 &&
    d.sensationalism === 0 &&
    (d.loaded_language ?? 0) === 0 &&
    (d.source_diversity ?? 0) === 0 &&
    (d.headline_body_skew ?? 0) === 0
  const noPhrases =
    detail.highlighted_phrases.length === 0 && (detail.loaded_phrases?.length ?? 0) === 0
  const noBody =
    typeof (detail.article as { body?: string }).body !== 'string' ||
    !(detail.article as { body?: string }).body!.trim()
  return flatBias && noPhrases && noBody
}

function BiasRadarPanel({
  data,
  placeholder,
}: {
  data: RadarRow[]
  placeholder: boolean
}) {
  return (
    <section className="border border-ink/30 bg-paper">
      <header className="flex items-baseline justify-between border-b border-ink/15 px-4 py-2.5">
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Bias dimensions
        </span>
        <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/45">
          radar · |magnitude|
        </span>
      </header>
      {placeholder ? (
        <div className="px-4 py-10 text-center font-serif italic text-sm text-ink/50">
          Awaiting analysis
        </div>
      ) : (
        <div className="h-72 px-2 py-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="#11111122" />
              <PolarAngleAxis
                dataKey="key"
                tick={{ fill: '#111111', fontSize: 9, fontFamily: 'Inter, sans-serif' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 1]}
                tick={{ fill: '#11111166', fontSize: 8 }}
                stroke="#11111122"
              />
              <Radar
                dataKey="value"
                stroke="#111111"
                strokeWidth={1.2}
                fill="#111111"
                fillOpacity={0.08}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function LinguisticSignals({
  detail,
  placeholder,
}: {
  detail: Detail
  placeholder: boolean
}) {
  const d = detail.bias_dimensions
  const loadedCount = detail.loaded_phrases?.length ?? 0
  const sources = detail.source_diversity_detail
  const skew = detail.headline_body_skew_detail

  const items: { label: string; value: string; sub: string }[] = [
    {
      label: 'Loaded language',
      value: placeholder ? '—' : String(loadedCount),
      sub: 'charged phrases flagged in body',
    },
    {
      label: 'Source diversity',
      value: placeholder
        ? '—'
        : sources
          ? sources.score.toFixed(2)
          : d.source_diversity !== undefined
            ? d.source_diversity.toFixed(2)
            : '—',
      sub:
        !placeholder && sources
          ? `${sources.quoted_entities.length} named · ${sources.anonymous_count} anonymous`
          : 'breadth of cited voices',
    },
    {
      label: 'Headline ↔ body skew',
      value: placeholder
        ? '—'
        : skew
          ? `${skew.delta > 0 ? '+' : ''}${skew.delta.toFixed(2)}`
          : d.headline_body_skew !== undefined
            ? d.headline_body_skew.toFixed(2)
            : '—',
      sub:
        !placeholder && skew
          ? `headline ${skew.headline_tone.toFixed(2)} · body ${skew.body_tone.toFixed(2)}`
          : 'tone gap between headline and body',
    },
  ]

  return (
    <section className="border border-ink/30 bg-paper">
      <header className="flex items-baseline justify-between border-b border-ink/15 px-4 py-2.5">
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Linguistic signals
        </span>
        <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/45">
          new dims
        </span>
      </header>
      <dl className="divide-y divide-ink/15">
        {items.map((it) => (
          <div key={it.label} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
                {it.label}
              </dt>
              <dd className="font-display font-black text-[20px] tabular-nums leading-none text-ink">
                {it.value}
              </dd>
            </div>
            <div className="mt-1 font-serif italic text-[12px] leading-snug text-ink/60">
              {it.sub}
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

function BodyWithHighlights({
  text,
  phrases,
}: {
  text: string
  phrases: LoadedPhrase[]
}) {
  const segments = useMemo(() => splitWithHighlights(text, phrases), [text, phrases])
  return (
    <div className="font-serif">
      {segments.map((seg, i) =>
        seg.kind === 'mark' ? (
          <LoadedLanguageHighlight key={i} text={seg.text} reason={seg.reason} />
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </div>
  )
}

function ArticleBody({
  text,
  phrases,
  pullQuote,
}: {
  text: string
  phrases: LoadedPhrase[]
  pullQuote: string | null
}) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  let firstHalf = text
  let secondHalf = ''
  if (paragraphs.length >= 2) {
    const mid = Math.max(1, Math.floor(paragraphs.length / 2))
    firstHalf = paragraphs.slice(0, mid).join('\n\n')
    secondHalf = paragraphs.slice(mid).join('\n\n')
  }

  const trimmed = firstHalf.replace(/^\s+/, '')
  const firstLetter = trimmed.charAt(0) || ''
  const restOfFirst = trimmed.slice(1)

  const firstHalfPhrases = phrases.filter((p) => (p.offset ?? 0) < firstHalf.length)
  const secondHalfPhrases = phrases
    .filter((p) => (p.offset ?? 0) >= firstHalf.length)
    .map((p) => ({ ...p, offset: (p.offset ?? 0) - (text.length - secondHalf.length) }))

  return (
    <div className="mt-12">
      <div className="font-serif text-[16px] leading-[1.78] text-ink/90 [column-rule:1px_solid_rgba(17,17,17,0.18)] md:columns-2 md:gap-10 md:text-[17px]">
        {firstLetter && (
          <span
            aria-hidden
            className="float-left mr-3 mt-2 font-display font-black text-[88px] leading-[0.78] text-ink"
          >
            {firstLetter}
          </span>
        )}
        <BodyWithHighlights
          text={restOfFirst}
          phrases={firstHalfPhrases.map((p) => ({ ...p, offset: (p.offset ?? 0) - 1 }))}
        />
      </div>

      {pullQuote && (
        <PullQuote attribution="From the body copy" size="md">
          {pullQuote}
        </PullQuote>
      )}

      {secondHalf && (
        <div className="mt-2 font-serif text-[16px] leading-[1.78] text-ink/90 [column-rule:1px_solid_rgba(17,17,17,0.18)] md:columns-2 md:gap-10 md:text-[17px]">
          <BodyWithHighlights text={secondHalf} phrases={secondHalfPhrases} />
        </div>
      )}
    </div>
  )
}

function extractPullQuote(text: string, phrases: LoadedPhrase[]): string | null {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 220)

  if (sentences.length === 0) return null

  if (phrases.length > 0) {
    const loaded = phrases.map((p) => p.text.toLowerCase())
    const hit = sentences.find((s) => loaded.some((p) => s.toLowerCase().includes(p)))
    if (hit) return hit.replace(/^["“”]+|["“”]+$/g, '')
  }

  const mid = Math.floor(sentences.length / 2)
  const candidates = [
    sentences[mid],
    sentences[Math.max(0, mid - 1)],
    sentences[Math.min(sentences.length - 1, mid + 1)],
  ]
  const best = candidates.find((c) => c && c.length > 60 && c.length < 180) || sentences[mid]
  return best ? best.replace(/^["“”]+|["“”]+$/g, '') : null
}

type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'mark'; text: string; reason: string }

function splitWithHighlights(text: string, phrases: LoadedPhrase[]): Segment[] {
  if (!phrases || phrases.length === 0) return [{ kind: 'text', text }]

  const ordered = [...phrases]
    .map((p) => {
      const offset =
        typeof p.offset === 'number' && p.offset >= 0 && p.offset < text.length
          ? p.offset
          : text.toLowerCase().indexOf(p.text.toLowerCase())
      return { ...p, offset }
    })
    .filter((p) => p.offset >= 0 && p.text)
    .sort((a, b) => a.offset - b.offset)

  const out: Segment[] = []
  let cursor = 0
  for (const p of ordered) {
    if (p.offset < cursor) continue
    if (p.offset > cursor) {
      out.push({ kind: 'text', text: text.slice(cursor, p.offset) })
    }
    const end = p.offset + p.text.length
    out.push({ kind: 'mark', text: text.slice(p.offset, end), reason: p.reason })
    cursor = end
  }
  if (cursor < text.length) {
    out.push({ kind: 'text', text: text.slice(cursor) })
  }
  return out
}

function formatDate(input?: string | null): string | null {
  if (!input) return null
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
