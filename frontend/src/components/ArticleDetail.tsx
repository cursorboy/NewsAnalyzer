import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getArticleDetail } from '../lib/api.ts'
import type { ArticleDetail as Detail } from '../lib/api.ts'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

export default function ArticleDetail() {
  const { id } = useParams()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getArticleDetail(id).then(setDetail).catch((e) => setError(String(e)))
  }, [id])

  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  if (!detail) return <div className="p-6 text-center text-gray-600">Loading...</div>

  const d = detail.bias_dimensions
  const data = [
    { key: 'Factuality', value: d.factuality },
    { key: 'Economic', value: d.economic },
    { key: 'Social', value: d.social },
    { key: 'Establishment', value: d.establishment },
    { key: 'Sensationalism', value: d.sensationalism },
  ]

  return (
    <div className="max-w-5xl mx-auto p-6">
      <a href="/articles" className="text-sm text-blue-600">← Back to Articles</a>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{detail.article.title}</h1>
      <div className="text-sm text-gray-500 mb-4">{detail.article.source}</div>
      <a className="inline-block mb-6 text-blue-700 underline" href={detail.article.url} target="_blank" rel="noreferrer">Open original</a>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-80 bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="key" />
              <PolarRadiusAxis angle={30} domain={[-1, 1]} />
              <Radar dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Highlighted Phrases</h2>
          <ul className="space-y-2">
            {detail.highlighted_phrases.map((p, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-gray-900">{p.text}</span>
                <span className="ml-2 text-gray-500">[{p.dimension}]</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}


