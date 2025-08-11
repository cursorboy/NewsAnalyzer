import { useEffect, useState } from 'react'
import { listArticles } from '../lib'
import type { Article } from '../lib'
import { getNarratives } from '../lib'
import type { Narrative } from '../lib'
export default function Narratives() {
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [articles, setArticles] = useState<Record<string, Article>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getNarratives(), listArticles()])
      .then(([ns, as]) => {
        setNarratives(ns)
        setArticles(Object.fromEntries(as.filter(a => a.id).map(a => [a.id as string, a])))
      })
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  if (!narratives.length) return <div className="p-6 text-center text-gray-600">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Trending Narratives</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {narratives.map((n) => (
          <div key={n.id} className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold">{n.title}</h2>
            <p className="text-sm text-gray-600 mb-3">{n.description}</p>
            <div className="flex flex-wrap gap-2">
              {n.article_ids.map((id) => (
                <a key={id} href={`/articles/${id}`} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200">
                  {articles[id]?.source || id}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


