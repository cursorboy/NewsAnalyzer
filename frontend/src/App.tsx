import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import './index.css'
import { useSearch } from './hooks/useSearch'
import { searchArticles } from './lib/api.ts'
import { Spectrum } from './components/Spectrum'
import { LoadingSpectrum } from './components/LoadingSpectrum'
import Columns from './components/Columns'
import Game from './components/Game'
import APIStatusDashboard from './components/APIStatus'
import Articles from './components/Articles'
import ArticleDetail from './components/ArticleDetail'
import Narratives from './components/Narratives'
import { ArticlesProvider, useArticles } from './context/ArticlesContext'

function Landing() {
  const navigate = useNavigate()
  const { cacheArticles } = useArticles()
  const [q, setQ] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    
    setIsLoading(true)
    try {
      const data = await searchArticles(q.trim())
      setSearchResults(data)
      
      // Cache the articles for potential game use
      cacheArticles(q.trim(), data.articles)
      
      // Log API status for debugging
      if (data.api_status) {
        console.log('API Status:', data.api_status)
        if (data.api_status.error) {
          console.warn('API Issue:', data.api_status.message)
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults({
        query: q.trim(),
        articles: [],
        api_status: {
          error: 'network_error',
          message: 'Unable to connect to the search service. Please check if the backend is running.'
        }
      })
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
            {/* API Status Warning */}
            {searchResults.api_status?.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center text-red-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">
                    {searchResults.api_status.error === 'rate_limited' ? 'Rate Limited' :
                     searchResults.api_status.error === 'quota_exceeded' ? 'API Quota Exceeded' :
                     searchResults.api_status.error === 'network_error' ? 'Connection Error' :
                     'API Error'}
                  </span>
                </div>
                <p className="text-red-700 text-sm mt-2">{searchResults.api_status.message}</p>
                {searchResults.api_status.error === 'quota_exceeded' && (
                  <p className="text-red-600 text-xs mt-2">
                    Google Custom Search API daily quota reached. Please try again tomorrow or upgrade your API plan.
                  </p>
                )}
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Found {searchResults.articles.length} articles about "{searchResults.query}"
            </h2>
            
            {/* API Status Info for successful requests */}
            {searchResults.api_status && !searchResults.api_status.error && searchResults.api_status.requests_made && (
              <div className="mb-4 text-xs text-gray-500">
                API Status: {searchResults.api_status.requests_made} requests made • {searchResults.api_status.success_rate}% success rate
              </div>
            )}
            
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
  const { cacheArticles, getCachedArticles } = useArticles()
  const [view, setView] = useState<'spectrum' | 'columns'>('spectrum')
  
  // Check if we have cached articles first
  const cachedArticles = getCachedArticles(query)
  const shouldUseCached = cachedArticles && cachedArticles.length > 0
  
  // Only use the API hook if we don't have cached articles
  const { data, isLoading, isError } = useSearch(query)
  
  // Determine which articles to use
  const articles = shouldUseCached ? cachedArticles : (data?.articles || [])
  const loading = shouldUseCached ? false : isLoading
  const error = shouldUseCached ? false : isError
  
  // Cache articles when data is loaded from API
  if (!shouldUseCached && data && data.articles) {
    cacheArticles(query, data.articles)
  }
  
  console.log(`Results: Using ${shouldUseCached ? 'cached' : 'fresh'} articles (${articles.length} total)`)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center gap-3">
          <a href="/" className="font-semibold text-gray-800">News Analyzer</a>
          <form action="/search" method="get" className="ml-auto flex-1 max-w-xl">
            <input name="q" defaultValue={query} className="w-full rounded-full border border-gray-300 px-5 py-2" />
          </form>
          <a href={`/game?q=${encodeURIComponent(query)}`} className="px-3 py-1 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">Play Game</a>
          <a href="/api-status" className="px-3 py-1 rounded bg-gray-600 text-white text-sm font-medium hover:bg-gray-700">API Status</a>
          <div className="flex gap-2">
            <button onClick={() => setView('spectrum')} className={`px-3 py-1 rounded border text-sm ${view==='spectrum' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>Spectrum</button>
            <button onClick={() => setView('columns')} className={`px-3 py-1 rounded border text-sm ${view==='columns' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>Columns</button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {loading && <LoadingSpectrum />}
        {!loading && !error && articles.length > 0 && (
          view === 'spectrum' ? <Spectrum articles={articles} /> : <Columns articles={articles} />
        )}
        {error && (
          <div className="p-4 text-center text-red-600">Failed to load results.</div>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ArticlesProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<Results />} />
          <Route path="/game" element={<Game />} />
          <Route path="/api-status" element={<APIStatusDashboard />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/narratives" element={<Narratives />} />
        </Routes>
      </BrowserRouter>
    </ArticlesProvider>
  )
}
