import type { Article } from '../lib/api'

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
    <div className="min-h-screen w-full bg-gradient-to-r from-blue-50 via-gray-50 to-red-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Column title="Liberal" border="border-blue-600" items={left} colorClass="text-blue-700" />
          <Column title="Neutral" border="border-gray-400" items={center} colorClass="text-gray-700" />
          <Column title="Conservative" border="border-red-600" items={right} colorClass="text-red-700" />
        </div>
      </div>
    </div>
  )
}

function Column({ title, border, items, colorClass }: { title: string; border: string; items: Article[]; colorClass: string }) {
  return (
    <section className={`rounded-xl border-2 ${border} bg-white/90 backdrop-blur p-4 shadow-sm`}>
      <h2 className={`text-xl font-semibold mb-3 ${colorClass}`}>{title}</h2>
      {items.length === 0 && (
        <div className="text-sm text-gray-500">No results</div>
      )}
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.url}>
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-colors p-3"
            >
              <div className="text-xs text-gray-500 mb-1 flex justify-between items-center">
                <span>{a.source}</span>
                <span className="bg-gray-100 px-1 rounded text-xs">
                  {a.spectrum_score > 0 ? '+' : ''}{a.spectrum_score.toFixed(2)}
                </span>
              </div>
              <div className="text-sm font-medium mb-2 leading-snug">{a.title}</div>
              <div className="text-xs text-gray-600 line-clamp-3 mb-2">{a.snippet}</div>
              <div className="text-xs text-gray-400 mb-2">
                {a.method} • {Math.round(a.confidence * 100)}% confidence
              </div>
              {a.reasoning && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                  <div className="font-medium text-blue-700 mb-1">AI Analysis:</div>
                  <div className="line-clamp-3">{a.reasoning}</div>
                </div>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
} 