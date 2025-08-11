export type Article = {
  id: string
  url: string
  title: string
  snippet: string
  source: string
  published_at?: string | null
  spectrum_score: number
  confidence: number
  method: 'outlet' | 'ai' | 'unknown'
  reasoning?: string | null
}

export type SearchResponse = {
  query: string
  articles: Article[]
  api_status?: {
    error?: string
    message?: string
    details?: any
    requests_made?: number
    success_rate?: number
    rate_limited?: boolean
    quota_exceeded?: boolean
  }
}

export type APIStatus = {
  total_requests: number
  failed_requests: number
  success_rate: number
  rate_limited: boolean
  quota_exceeded: boolean
  last_error: any
  last_request_time: string | null
  api_configured: boolean
}

// Resolve API base: Use relative path in production, localhost in dev
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '' : 'http://localhost:8000')

export async function searchArticles(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  const url = new URL('/api/search', API_BASE)
  url.searchParams.set('q', query)
  
  try {
    const res = await fetch(url.toString(), { signal })
    if (!res.ok) {
      throw new Error(`Search failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    console.error('Search API error:', error)
    throw new Error('Failed to search articles. Please try again.')
  }
}

export async function getAPIStatus(): Promise<APIStatus> {
  const url = new URL('/api/api-status', API_BASE)
  
  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error(`API status check failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  } catch (error) {
    console.error('API status check error:', error)
    throw new Error('Failed to check API status.')
  }
} 

// 72-hour prototype types and clients
export type BiasDimensions = {
  factuality: number
  economic: number
  social: number
  establishment: number
  sensationalism: number
}

export type ArticleDetail = {
  id: string
  article: Article
  bias_dimensions: BiasDimensions
  highlighted_phrases: { text: string; dimension: string }[]
}

export type Narrative = {
  id: string
  title: string
  description: string
  article_ids: string[]
  centroid_bias: BiasDimensions
}

export async function listArticles(): Promise<Article[]> {
  const res = await fetch(new URL('/api/articles', API_BASE))
  if (!res.ok) throw new Error('Failed to load articles')
  return res.json()
}

export async function getArticleDetail(id: string): Promise<ArticleDetail> {
  const res = await fetch(new URL(`/api/articles/${id}`, API_BASE))
  if (!res.ok) throw new Error('Failed to load article detail')
  return res.json()
}

export async function getNarratives(): Promise<Narrative[]> {
  const res = await fetch(new URL('/api/narratives', API_BASE))
  if (!res.ok) throw new Error('Failed to load narratives')
  return res.json()
}
