import { useEffect, useState } from 'react'
import { listArticles } from '../lib'
import type { Article } from '../lib'
export default function Articles() {
  const [items, setItems] = useState<Article[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listArticles().then(setItems).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  if (!items.length) return <div className="p-6 text-center text-gray-600">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.url} className="bg-white rounded-lg shadow p-4">
            <a href={`/articles/${(a as any).id || ''}`} className="text-lg font-semibold text-blue-700">
              {a.title}
            </a>
            <div className="text-sm text-gray-500">{a.source}</div>
            <p className="text-sm text-gray-700 mt-2">{a.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}


