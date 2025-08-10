import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import './index.css'
import { useSearch } from './hooks/useSearch'
import { Spectrum } from './components/Spectrum'
import { LoadingSpectrum } from './components/LoadingSpectrum'
import Columns from './components/Columns'

function Landing() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16 text-center">
        <span className="inline-flex items-center rounded-full border bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-gray-700">Political Spectrum News Analyzer</span>
        <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">Every story, every angle</h1>
        <p className="mt-4 text-lg text-gray-600">Search any topic and see coverage arranged across the political spectrum.</p>

        <form onSubmit={onSubmit} className="mt-10">
          <div className="mx-auto flex max-w-3xl items-center rounded-full border border-gray-300/70 bg-white/90 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-blue-400">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter any news topic... (e.g., 'education policy')"
              className="flex-1 rounded-full bg-transparent px-6 py-4 text-lg outline-none"
            />
            <button type="submit" className="m-1 rounded-full bg-blue-600 px-6 py-2 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Search</button>
          </div>
          <p className="mt-3 text-xs text-gray-500">Tip: Try queries like “immigration reform”, “student loans”, or “border policy”.</p>
        </form>
      </div>
    </div>
  )
}

function Results() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const { data, isLoading, isError } = useSearch(query)
  const [view, setView] = useState<'spectrum' | 'columns'>('spectrum')
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center gap-3">
          <a href="/" className="font-semibold text-gray-800">News Analyzer</a>
          <form action="/search" method="get" className="ml-auto flex-1 max-w-xl">
            <input name="q" defaultValue={query} className="w-full rounded-full border border-gray-300 px-5 py-2" />
          </form>
          <div className="flex gap-2">
            <button onClick={() => setView('spectrum')} className={`px-3 py-1 rounded border text-sm ${view==='spectrum' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>Spectrum</button>
            <button onClick={() => setView('columns')} className={`px-3 py-1 rounded border text-sm ${view==='columns' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>Columns</button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {isLoading && <LoadingSpectrum />}
        {!isLoading && !isError && data && (
          view === 'spectrum' ? <Spectrum articles={data.articles} /> : <Columns articles={data.articles} />
        )}
        {isError && (
          <div className="p-4 text-center text-red-600">Failed to load results.</div>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}
