import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useSearchParams,
  useLocation,
  type Location,
} from 'react-router-dom'
import { useEffect, useState, lazy, Suspense, type ReactElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'
import { useSearch } from './hooks/useSearch'
import { Spectrum } from './components/Spectrum'
import { LoadingSpectrum } from './components/LoadingSpectrum'
import Columns from './components/Columns'
import Game from './components/Game'
import APIStatusDashboard from './components/APIStatus'
import ArticleDetail from './components/ArticleDetail'
import Masthead from './components/Masthead'
import { ArticlesProvider, useArticles } from './context/ArticlesContext'
import Landing from './pages/Landing'
import Analyze from './pages/Analyze'
import PlayHub from './pages/PlayHub'
const InferenceLab = lazy(() => import('./pages/InferenceLab'))
const HowIBuiltThis = lazy(() => import('./pages/HowIBuiltThis'))
import GuessSource from './components/games/GuessSource'
import CompareTakes from './components/games/CompareTakes'
import HeadlineRewrite from './components/games/HeadlineRewrite'

function Results() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const { cacheArticles, getCachedArticles } = useArticles()
  const [view, setView] = useState<'spectrum' | 'columns'>('spectrum')
  const [draft, setDraft] = useState(query)

  useEffect(() => {
    setDraft(query)
  }, [query])

  const cachedArticles = getCachedArticles(query)
  const shouldUseCached = cachedArticles && cachedArticles.length > 0

  const { data, isLoading, isError } = useSearch(query)

  const articles = shouldUseCached ? cachedArticles : (data?.articles || [])
  const loading = shouldUseCached ? false : isLoading
  const error = shouldUseCached ? false : isError

  useEffect(() => {
    if (!shouldUseCached && data && data.articles) {
      cacheArticles(query, data.articles)
    }
  }, [shouldUseCached, data, query, cacheArticles])

  return (
    <div className="min-h-screen flex flex-col bg-paper-cream text-ink">
      <Masthead />

      <div className="border-b border-ink/15">
        <div className="mx-auto w-full max-w-[1280px] px-12 py-6">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <form action="/search" method="get" className="flex-1 min-w-[280px]">
              <label className="block font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
                Topic
              </label>
              <div className="mt-2 flex items-center border-b-2 border-ink pb-2">
                <input
                  name="q"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 bg-transparent font-serif italic text-[24px] leading-tight text-ink placeholder:text-ink/30 focus:outline-none"
                  placeholder="Search the news"
                />
                <button
                  type="submit"
                  className="ml-3 bg-ink px-3 py-1 font-sans text-[10px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors"
                >
                  Search &rarr;
                </button>
              </div>
            </form>

            <div className="flex items-center gap-7">
              <ViewToggle view={view} onChange={setView} />
              <Link
                to={`/play?q=${encodeURIComponent(query)}`}
                className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/65 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink"
              >
                Play with this query &rarr;
              </Link>
            </div>
          </div>

          {query && (
            <div className="mt-4 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Showing analysis for{' '}
              <span className="font-serif normal-case tracking-normal text-ink italic">
                &ldquo;{query}&rdquo;
              </span>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1">
        {loading && <LoadingSpectrum />}
        {!loading && !error && articles.length > 0 && (
          view === 'spectrum'
            ? <Spectrum articles={articles} />
            : <Columns articles={articles} />
        )}
        {!loading && !error && articles.length === 0 && query && (
          <div className="mx-auto max-w-3xl px-6 py-24 text-center font-serif italic text-ink/60">
            No clippings filed for this query.
          </div>
        )}
        {error && (
          <div className="mx-auto max-w-3xl px-6 py-16 text-center font-serif text-accent">
            Failed to load results.
          </div>
        )}
      </main>
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: 'spectrum' | 'columns'
  onChange: (v: 'spectrum' | 'columns') => void
}) {
  const opts: { id: 'spectrum' | 'columns'; label: string }[] = [
    { id: 'spectrum', label: 'Spectrum' },
    { id: 'columns', label: 'Columns' },
  ]
  return (
    <div className="flex items-center gap-5 font-sans text-[11px] uppercase tracking-[0.22em]">
      <span className="text-ink/45">View</span>
      {opts.map((o) => {
        const active = view === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`pb-0.5 -mb-px border-b-2 transition-colors ${
              active
                ? 'text-ink border-accent'
                : 'text-ink/55 border-transparent hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const PAGE_TRANSITION = {
  duration: 0.22,
  ease: [0.2, 0.65, 0.3, 1] as [number, number, number, number],
}

function PageTransition({
  children,
  pathKey,
}: {
  children: ReactElement
  pathKey: string
}) {
  return (
    <motion.div
      key={pathKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={PAGE_TRANSITION}
    >
      {children}
    </motion.div>
  )
}

function transitionKey(loc: Location): string {
  // Group game sub-routes so they don't cross-fade between rounds, and so the
  // game's internal animations are not interrupted.
  if (loc.pathname.startsWith('/play/')) return loc.pathname.split('/').slice(0, 3).join('/')
  return loc.pathname
}

function AnimatedRoutes() {
  const location = useLocation()
  const key = transitionKey(location)
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={key} pathKey={key}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<Results />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/play" element={<PlayHub />} />
          <Route path="/play/detective" element={<Game />} />
          <Route path="/play/source" element={<GuessSource />} />
          <Route path="/play/compare" element={<CompareTakes />} />
          <Route path="/play/rewrite" element={<HeadlineRewrite />} />
          <Route
            path="/inference-lab"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen bg-paper-cream flex items-center justify-center font-mono text-[12px] text-ink/55">
                    {'> bootstrapping inference runtime …'}
                  </div>
                }
              >
                <InferenceLab />
              </Suspense>
            }
          />
          <Route
            path="/how-i-built-this"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen bg-paper-cream flex items-center justify-center font-mono text-[12px] text-ink/55">
                    {'> loading methodology …'}
                  </div>
                }
              >
                <HowIBuiltThis />
              </Suspense>
            }
          />
          <Route path="/api-status" element={<APIStatusDashboard />} />
          <Route path="/game" element={<Navigate to="/play/detective" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ArticlesProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ArticlesProvider>
  )
}
