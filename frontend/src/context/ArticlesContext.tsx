import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import type { Article } from '../lib'

// localStorage-backed search-result cache with a TTL. Lets a /search refresh
// hydrate immediately from disk for queries that were searched recently,
// instead of waiting for a fresh backend round-trip.
//
// TTL is intentionally short (5 minutes) so:
//   - the user doesn't get stuck on yesterday's news after long absences
//   - the OUTLET_BIAS prior + LLM scoring don't drift between sessions
//   - storage stays small (we don't ever clean up; localStorage caps at ~5MB
//     which is plenty for ~50 cached queries × 12 articles each)

const STORAGE_KEY = 'tbg:search-cache:v1'
const DEFAULT_TTL_MS = 5 * 60_000

type CacheEntry = {
  articles: Article[]
  cachedAt: number
}

type CacheMap = Record<string, CacheEntry>

interface ArticlesContextType {
  cachedArticles: CacheMap
  cacheArticles: (query: string, articles: Article[]) => void
  getCachedArticles: (query: string, maxAgeMs?: number) => Article[] | undefined
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(undefined)

function loadFromStorage(): CacheMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as CacheMap
    }
  } catch {
    /* ignore corrupt storage */
  }
  return {}
}

function saveToStorage(cache: CacheMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* storage full or disabled, skip silently */
  }
}

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [cachedArticles, setCachedArticles] = useState<CacheMap>(() => loadFromStorage())

  const cacheArticles = useCallback((query: string, articles: Article[]) => {
    setCachedArticles((prev) => {
      const next: CacheMap = { ...prev, [query]: { articles, cachedAt: Date.now() } }
      saveToStorage(next)
      return next
    })
  }, [])

  const getCachedArticles = useCallback(
    (query: string, maxAgeMs: number = DEFAULT_TTL_MS) => {
      const entry = cachedArticles[query]
      if (!entry) return undefined
      if (Date.now() - entry.cachedAt > maxAgeMs) return undefined
      // Defensive copy: callers occasionally mutate (sort/shuffle/splice) the
      // returned list while shaping it for a game round. Mutating the cache
      // entry in place would corrupt the React state map and cause stale
      // reads on the next read of the same query.
      return [...entry.articles]
    },
    [cachedArticles],
  )

  return (
    <ArticlesContext.Provider value={{ cachedArticles, cacheArticles, getCachedArticles }}>
      {children}
    </ArticlesContext.Provider>
  )
}

export function useArticles() {
  const context = useContext(ArticlesContext)
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticlesProvider')
  }
  return context
}
