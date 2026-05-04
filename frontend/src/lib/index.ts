// Re-export everything from api.ts to help with module resolution
export * from './api'
export type {
  Article,
  SearchResponse,
  APIStatus,
  BiasDimensions,
  ArticleDetail,
  Narrative,
  LoadedPhrase,
  SourceDiversityDetail,
  HeadlineBodySkewDetail,
  AnalyzeRequest,
  ComparePair,
  HeadlineRewriteScore,
} from './api'
export {
  fallbackSearch,
  fallbackComparePair,
  fallbackHeadlineScore,
  FALLBACK_ARTICLES,
} from './gameFallbacks'
