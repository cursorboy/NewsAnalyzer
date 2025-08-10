import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import './index.css'
import { useSearch } from './hooks/useSearch'
import { Spectrum } from './components/Spectrum'
import { LoadingSpectrum } from './components/LoadingSpectrum'

function Landing() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-200 via-white to-blue-200">
      <h1 className="text-3xl md:text-5xl font-semibold mb-6 text-gray-800 text-center">Every story, every angle</h1>
      <form onSubmit={onSubmit} className="w-full max-w-2xl px-4">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enter any news topic... (e.g., 'education policy')"
            className="w-full rounded-full border border-gray-300/60 bg-white/80 backdrop-blur px-6 py-4 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-300/40 transition-all text-lg"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-medium hover:bg-blue-700">Search</button>
        </div>
      </form>
    </div>
  )
}

function Results() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const { data, isLoading, isError } = useSearch(query)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center gap-3">
          <a href="/" className="font-semibold text-gray-800">News Analyzer</a>
          <form action="/search" method="get" className="ml-auto flex-1 max-w-xl">
            <input name="q" defaultValue={query} className="w-full rounded-full border border-gray-300 px-5 py-2" />
          </form>
        </div>
      </header>
      <main className="flex-1">
        {isLoading && <LoadingSpectrum />}
        {!isLoading && !isError && data && <Spectrum articles={data.articles} />}
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
