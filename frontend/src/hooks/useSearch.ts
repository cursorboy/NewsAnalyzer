import { useQuery } from '@tanstack/react-query'
import { searchArticles } from '../lib/api'

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: ({ signal }) => searchArticles(query, signal),
    enabled: query.trim().length > 1,
    staleTime: 60_000,
  })
} 