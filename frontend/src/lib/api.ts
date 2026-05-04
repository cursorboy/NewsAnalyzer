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

// Debug logging
console.log('🔍 API Configuration:', {
  VITE_API_BASE: import.meta.env.VITE_API_BASE,
  PROD: import.meta.env.PROD,
  API_BASE,
  NODE_ENV: import.meta.env.NODE_ENV
})

export async function searchArticles(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  const url = new URL('/api/search', API_BASE)
  url.searchParams.set('q', query)
  
  console.log('🌐 Making API request to:', url.toString())
  
  try {
    const res = await fetch(url.toString(), { signal })
    console.log('📡 API Response:', { status: res.status, statusText: res.statusText, url: url.toString() })
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
  loaded_language?: number
  source_diversity?: number
  headline_body_skew?: number
}

export type LoadedPhrase = { text: string; offset: number; reason: string }

export type SourceDiversityDetail = {
  quoted_entities: string[]
  anonymous_count: number
  score: number
}

export type HeadlineBodySkewDetail = {
  headline_tone: number
  body_tone: number
  delta: number
}

export type ArticleDetail = {
  id: string
  article: Article
  bias_dimensions: BiasDimensions
  highlighted_phrases: { text: string; dimension: string }[]
  loaded_phrases?: LoadedPhrase[]
  source_diversity_detail?: SourceDiversityDetail
  headline_body_skew_detail?: HeadlineBodySkewDetail
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

export type AnalyzeRequest = { url?: string; text?: string; title?: string }

export async function analyzeArticle(req: AnalyzeRequest): Promise<ArticleDetail> {
  const res = await fetch(new URL('/api/analyze', API_BASE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Failed to analyze article')
  return res.json()
}

export type ComparePair = {
  query: string
  article_a: ArticleDetail
  article_b: ArticleDetail
}

export async function getComparePair(query: string): Promise<ComparePair> {
  const url = new URL('/api/games/compare-pair', API_BASE)
  url.searchParams.set('q', query)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to load compare pair')
  return res.json()
}

export type HeadlineRewriteScore = {
  total: number
  breakdown: Record<string, number>
  weights?: Record<string, number>
}

export async function scoreHeadlineRewrite(
  original: string,
  rewrite: string,
): Promise<HeadlineRewriteScore> {
  const res = await fetch(new URL('/api/games/headline-rewrite/score', API_BASE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original, rewrite }),
  })
  if (!res.ok) throw new Error('Failed to score rewrite')
  return res.json()
}
