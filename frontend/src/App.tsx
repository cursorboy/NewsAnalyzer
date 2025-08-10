import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import './index.css'
import { useSearch } from './hooks/useSearch'
import { Spectrum } from './components/Spectrum'
import { LoadingSpectrum } from './components/LoadingSpectrum'
import Columns from './components/Columns'
import Game from './components/Game'

function Landing() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    
    setIsLoading(true)
    try {
      // Use the search API directly
      const response = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(q.trim())}`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const viewSpectrum = () => {
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const playGame = () => {
    navigate(`/game?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16 text-center">
        <span className="inline-flex items-center rounded-full border bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-gray-700">Political Spectrum News Analyzer</span>
        <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 text-center">TheBiasGraph</h1>
        <p className="mt-4 text-lg text-gray-600 text-center">Search any topic and choose how to explore the coverage across the political spectrum.</p>

        <form onSubmit={handleSearch} className="mt-10">
          <div className="mx-auto flex max-w-3xl items-center rounded-full border border-gray-300/70 bg-white/90 shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-blue-400">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter any news event or topic, such as &quot;student loan forgiveness&quot;"
              className="flex-1 rounded-full bg-transparent px-6 py-4 text-lg outline-none"
            />
            <button type="submit" disabled={isLoading} className="m-1 rounded-full bg-blue-600 px-6 py-2 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {searchResults && (
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Found {searchResults.articles.length} articles about "{searchResults.query}"
            </h2>
            <p className="text-gray-600 mb-8">How would you like to explore this coverage?</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-red-500 p-6 rounded-lg text-white">
                <h3 className="text-xl font-semibold mb-2">View Spectrum</h3>
                <p className="text-blue-100 mb-4">See all articles positioned across the political spectrum</p>
                <button 
                  onClick={viewSpectrum}
                  className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Explore Coverage
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
                <h3 className="text-xl font-semibold mb-2">Play Bias Detective</h3>
                <p className="text-purple-100 mb-4">Test your bias detection skills with these articles</p>
                <button 
                  onClick={playGame}
                  className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        )}
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
          <a href={`/game?q=${encodeURIComponent(query)}`} className="px-3 py-1 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">Play Game</a>
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
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}
