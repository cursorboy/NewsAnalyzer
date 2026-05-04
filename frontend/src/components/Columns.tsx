import type { Article } from '../lib'
import { Link } from 'react-router-dom'

type Groups = {
  left: Article[]
  center: Article[]
  right: Article[]
}

function groupArticles(articles: Article[]): Groups {
  const groups: Groups = { left: [], center: [], right: [] }
  for (const a of articles) {
    if (a.spectrum_score <= -0.2) groups.left.push(a)
    else if (a.spectrum_score >= 0.2) groups.right.push(a)
    else groups.center.push(a)
  }
  return groups
}

export default function Columns({ articles }: { articles: Article[] }) {
  const { left, center, right } = groupArticles(articles)

  return (
    <div className="bg-paper-cream">
      <div className="mx-auto w-full max-w-[1280px] px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <Column
            kicker="The Liberal Read"
            items={left}
            perspective="left of center"
          />
          <Column
            kicker="The Centrist Read"
            items={center}
            perspective="balanced framing"
            bordered
          />
          <Column
            kicker="The Conservative Read"
            items={right}
            perspective="right of center"
            bordered
          />
        </div>
      </div>
    </div>
  )
}

function Column({
  kicker,
  perspective,
  items,
  bordered = false,
}: {
  kicker: string
  perspective: string
  items: Article[]
  bordered?: boolean
}) {
  return (
    <section
      className={`px-5 first:pl-0 last:pr-0 md:px-7 ${
        bordered ? 'md:border-l md:border-ink/15' : ''
      }`}
    >
      <header>
        <div className="border-t-2 border-ink" aria-hidden />
        <div className="mt-4 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65">
          {kicker}
        </div>
        <div className="mt-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
          {perspective} &middot; {items.length}{' '}
          {items.length === 1 ? 'clipping' : 'clippings'}
        </div>
        <div className="mt-3 border-t border-ink/30" aria-hidden />
      </header>

      {items.length === 0 ? (
        <p className="mt-6 font-serif text-[14px] italic text-ink/55">
          No clippings filed in this band.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-ink/15">
          {items.map((a, i) => (
            <li key={a.url || i}>
              <ColumnItem article={a} index={i + 1} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ColumnItem({ article, index }: { article: Article; index: number }) {
  const score = article.spectrum_score
  const sign = score > 0 ? '+' : score < 0 ? '−' : ''
  const num = String(index).padStart(2, '0')
  return (
    <Link to={`/article/${article.id}`} className="block py-5 group">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/65">
          <span className="font-mono tabular-nums text-ink/40">N° {num}</span>
          <span>{article.source}</span>
        </div>
        <span className="inline-flex items-center border border-ink px-1.5 py-[1px] font-display font-black text-[11px] tabular-nums leading-none text-ink">
          {sign}
          {Math.abs(score).toFixed(2)}
        </span>
      </header>

      <h3 className="mt-2 font-serif text-[18px] leading-[1.2] text-ink group-hover:text-accent transition-colors">
        {article.title}
      </h3>

      <p className="mt-2 font-serif italic text-[13px] leading-snug text-ink/70 line-clamp-3">
        {article.snippet}
      </p>

      <div className="mt-3 flex items-baseline justify-between font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        <span>{article.method}</span>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink hover:text-ink"
        >
          Original ↗
        </a>
      </div>
    </Link>
  )
}
