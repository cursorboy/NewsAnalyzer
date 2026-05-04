import type { Article } from '../lib'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SpectrumGraph from './SpectrumGraph'
import type { ArticleMarker } from '../lib/sampleArticles'

function outletCode(source: string): string {
  const cleaned = source.replace(/[^a-zA-Z ]/g, '').trim()
  if (!cleaned) return 'OUT'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0] + (parts[2]?.[0] ?? parts[1][1] ?? '')).toUpperCase().slice(0, 3)
  }
  return cleaned.slice(0, 3).toUpperCase()
}

function fallbackWhy(a: Article, idx: number): string {
  if (a.reasoning && a.reasoning.trim()) {
    return a.reasoning.split('\n')[0].slice(0, 180)
  }
  const dist = Math.abs(a.spectrum_score)
  const dir = a.spectrum_score < 0 ? 'left' : a.spectrum_score > 0 ? 'right' : 'center'
  return `Loaded language density and economic framing place this clipping ${idx} steps from center, leaning ${dir} (${dist.toFixed(2)}).`
}

// Pick at most one article per source. When multiple articles come from the
// same outlet, keep the one with the strongest signal (largest |score|) so the
// graph shows the outlet's most distinctive take rather than a tepid one.
function dedupeBySource(arts: Article[]): Article[] {
  const seen = new Map<string, Article>()
  for (const a of arts) {
    const key = (a.source || 'unknown').toLowerCase()
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, a)
      continue
    }
    if (Math.abs(a.spectrum_score) > Math.abs(existing.spectrum_score)) {
      seen.set(key, a)
    }
  }
  return Array.from(seen.values())
}

function articlesToMarkers(arts: Article[]): ArticleMarker[] {
  return arts.map((a, i) => ({
    src: a.source,
    short: outletCode(a.source),
    x: Math.max(-1, Math.min(1, a.spectrum_score)),
    y: 0.18 + ((i * 0.137) % 0.7),
    title: a.title,
    why: fallbackWhy(a, i + 1),
    score: a.spectrum_score,
    url: a.url,
  }))
}

export function Spectrum({ articles }: { articles: Article[] }) {
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('q') || ''
  const [selected, setSelected] = useState<string | null>(null)
  const hasSelection = selected !== null

  // Deduplicate to one article per source for both the graph and the
  // clippings list below. Multiple articles from the same outlet land on the
  // same x-position and clutter the spectrum without adding signal.
  const dedupedArticles = useMemo(() => dedupeBySource(articles), [articles])

  const stats = useMemo(() => {
    if (dedupedArticles.length === 0) {
      return { avg: 0, sources: 0, count: 0, spread: 0 }
    }
    const xs = dedupedArticles.map((a) => a.spectrum_score)
    const sources = new Set(dedupedArticles.map((a) => a.source)).size
    return {
      avg: xs.reduce((s, x) => s + x, 0) / xs.length,
      sources,
      count: dedupedArticles.length,
      spread: Math.max(...xs) - Math.min(...xs),
    }
  }, [dedupedArticles])

  const markers = useMemo(() => articlesToMarkers(dedupedArticles), [dedupedArticles])

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center font-serif text-ink/60">
        <p className="text-lg italic">No clippings filed for this topic.</p>
        <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/40">
          Try a different search term
        </p>
      </div>
    )
  }

  return (
    <div className="bg-paper-cream">
      <div className="mx-auto w-full max-w-[1280px] px-12 pt-10 pb-4">
        <StatStrip stats={stats} />
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-12">
        <div className="border-t-2 border-b border-ink py-10">
          <SpectrumGraph
            key={topic || 'all'}
            query={topic || 'this topic'}
            articles={markers}
            height={420}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-12 pt-12 pb-20">
        <div className="flex items-baseline justify-between border-b border-ink/30 pb-3">
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65">
            On the Spectrum &mdash; {stats.count} clippings
          </span>
          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
            {stats.sources} unique outlets
          </span>
        </div>

        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {dedupedArticles.map((a, idx) => (
            <Clipping
              key={a.url || idx}
              article={a}
              index={idx + 1}
              isSelected={selected === a.url}
              dim={hasSelection && selected !== a.url}
              onSelect={() => setSelected(selected === a.url ? null : a.url)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatStrip({
  stats,
}: {
  stats: { avg: number; sources: number; count: number; spread: number }
}) {
  function fmtSigned(n: number) {
    const sign = n < 0 ? '−' : n > 0 ? '+' : ''
    return `${sign}${Math.abs(n).toFixed(2)}`
  }
  const items = [
    { label: 'Avg bias', value: fmtSigned(stats.avg) },
    { label: 'Spread', value: stats.spread.toFixed(2) },
    { label: 'Outlets', value: String(stats.sources) },
  ]
  return (
    <dl className="flex items-baseline gap-10 border-t border-b border-ink/30 py-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-2">
          <dd className="font-display text-3xl font-black tabular-nums leading-none text-ink">
            {it.value}
          </dd>
          <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            {it.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}

function Clipping({
  article,
  index,
  isSelected,
  dim,
  onSelect,
}: {
  article: Article
  index: number
  isSelected: boolean
  dim: boolean
  onSelect: () => void
}) {
  const score = article.spectrum_score
  const sign = score > 0 ? '+' : score < 0 ? '−' : ''
  const num = String(index).padStart(2, '0')
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dim ? 0.4 : 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group relative"
    >
      {/* Whole-card click target → opens the original article. Sits behind the
          inline footer links so the hover/click for the card is unmissable
          but Analyze/Original links still take precedence on click. */}
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`Read original article: ${article.title}`}
        className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

      <div
        className={`relative z-[1] pointer-events-none transition-colors ${
          isSelected ? '' : 'group-hover:[&_.rule]:bg-accent'
        }`}
      >
        <div
          className={`rule ${isSelected ? 'h-[3px] bg-ink' : 'h-px bg-ink/35'} transition-colors`}
          aria-hidden
        />

        <header className="flex items-baseline justify-between gap-3 pt-3">
          <div className="flex items-baseline gap-3 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65">
            <span className="font-mono tabular-nums text-ink/40">N° {num}</span>
            <span>{article.source}</span>
          </div>
          <span className="inline-flex items-center border border-ink px-1.5 py-[1px] font-display font-black text-[12px] tabular-nums leading-none text-ink">
            {sign}
            {Math.abs(score).toFixed(2)}
          </span>
        </header>

        <h3 className="mt-3 font-serif text-[20px] leading-[1.2] text-ink group-hover:text-accent transition-colors md:text-[22px]">
          {article.title}
        </h3>

        <p className="mt-2 font-serif italic text-[14px] leading-snug text-ink/70 line-clamp-3 md:text-[15px]">
          {article.snippet}
        </p>
      </div>

      <footer className="relative z-[2] mt-3 flex items-center justify-between font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        <span>{article.method}</span>
        <div className="flex items-center gap-4">
          <Link
            to={`/article/${article.id}`}
            state={{ article }}
            onClick={(e) => e.stopPropagation()}
            className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink hover:text-ink"
          >
            Analyze &rarr;
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink hover:text-ink"
          >
            {isSelected ? 'Hide reasoning' : 'Why?'}
          </button>
        </div>
      </footer>

      {isSelected && article.reasoning && (
        <div className="relative z-[2] mt-3 border-l-[3px] border-ink pl-4 font-serif text-[13px] leading-relaxed text-ink/85">
          <span className="block font-sans text-[9px] uppercase tracking-[0.22em] text-ink/55 mb-1">
            Network reasoning
          </span>
          <p className="italic">{article.reasoning.split('\n')[0]}</p>
        </div>
      )}
    </motion.article>
  )
}

export default Spectrum
