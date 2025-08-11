import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import type { Article } from '../lib'

interface ArticlesContextType {
  cachedArticles: { [query: string]: Article[] }
  cacheArticles: (query: string, articles: Article[]) => void
  getCachedArticles: (query: string) => Article[] | undefined
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(undefined)

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [cachedArticles, setCachedArticles] = useState<{ [query: string]: Article[] }>({})

  const cacheArticles = useCallback((query: string, articles: Article[]) => {
    setCachedArticles(prev => ({ ...prev, [query]: articles }))
    console.log(`Caching ${articles.length} articles for query: "${query}"`)
  }, [])

  const getCachedArticles = useCallback((query: string) => {
    return cachedArticles[query]
  }, [cachedArticles])

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
