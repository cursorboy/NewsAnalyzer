import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { Article } from '../lib/api'

interface ArticlesContextType {
  cachedArticles: Article[]
  cachedQuery: string
  cacheArticles: (query: string, articles: Article[]) => void
  getCachedArticles: (query: string) => Article[] | null
  clearCache: () => void
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(undefined)

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [cachedArticles, setCachedArticles] = useState<Article[]>([])
  const [cachedQuery, setCachedQuery] = useState<string>('')

  const cacheArticles = (query: string, articles: Article[]) => {
    console.log(`Caching ${articles.length} articles for query: "${query}"`)
    setCachedQuery(query.toLowerCase().trim())
    setCachedArticles(articles)
  }

  const getCachedArticles = (query: string): Article[] | null => {
    const normalizedQuery = query.toLowerCase().trim()
    if (normalizedQuery === cachedQuery && cachedArticles.length > 0) {
      console.log(`Using cached ${cachedArticles.length} articles for query: "${query}"`)
      return cachedArticles
    }
    return null
  }

  const clearCache = () => {
    console.log('Clearing article cache')
    setCachedArticles([])
    setCachedQuery('')
  }

  return (
    <ArticlesContext.Provider value={{
      cachedArticles,
      cachedQuery,
      cacheArticles,
      getCachedArticles,
      clearCache
    }}>
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
