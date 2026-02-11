import { useState } from 'react'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { PAGINATION } from '../constants'

/**
 * Pagination response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  prevCursor?: string
  hasMore: boolean
  total?: number
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  pageSize?: number
  enabled?: boolean
  initialCursor?: string
}

/**
 * Fetch function signature for paginated queries
 */
export type PaginatedFetchFn<T> = (
  cursor?: string,
  limit?: number
) => Promise<PaginatedResponse<T>>

/**
 * Custom hook for paginated queries with cursor-based pagination
 * 
 * @template T - The type of data being fetched
 * @param queryKey - React Query key for caching
 * @param fetchFn - Function that fetches paginated data
 * @param options - Pagination configuration options
 * 
 * @example
 * ```typescript
 * const { data, isLoading, nextPage, prevPage, hasMore } = usePaginatedQuery(
 *   ['swap-requests'],
 *   (cursor, limit) => swapRequestsService.getSwapRequests(cursor, limit),
 *   { pageSize: 20 }
 * )
 * ```
 */
export function usePaginatedQuery<T>(
  queryKey: string[],
  fetchFn: PaginatedFetchFn<T>,
  options?: PaginationOptions
) {
  const pageSize = options?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE
  const [cursor, setCursor] = useState<string | undefined>(options?.initialCursor)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])

  // Validate page size
  const validatedPageSize = Math.min(
    Math.max(1, pageSize),
    PAGINATION.MAX_PAGE_SIZE
  )

  const query = useQuery({
    queryKey: [...queryKey, 'paginated', cursor, validatedPageSize],
    queryFn: () => fetchFn(cursor, validatedPageSize),
    enabled: options?.enabled !== false,
    staleTime: 60000, // 1 minute default
  } as UseQueryOptions<PaginatedResponse<T>>)

  /**
   * Navigate to the next page
   */
  const nextPage = () => {
    if (query.data?.nextCursor) {
      setCursorHistory((prev) => [...prev, cursor || ''])
      setCursor(query.data.nextCursor)
    }
  }

  /**
   * Navigate to the previous page
   */
  const prevPage = () => {
    if (cursorHistory.length > 0) {
      const previousCursor = cursorHistory[cursorHistory.length - 1]
      setCursorHistory((prev) => prev.slice(0, -1))
      setCursor(previousCursor || undefined)
    }
  }

  /**
   * Reset pagination to the first page
   */
  const resetPagination = () => {
    setCursor(undefined)
    setCursorHistory([])
  }

  /**
   * Jump to a specific cursor
   */
  const goToCursor = (newCursor?: string) => {
    setCursor(newCursor)
    setCursorHistory([])
  }

  return {
    // Query data
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    
    // Pagination state
    hasMore: query.data?.hasMore ?? false,
    hasPrevious: cursorHistory.length > 0,
    currentCursor: cursor,
    total: query.data?.total,
    
    // Pagination controls
    nextPage,
    prevPage,
    resetPagination,
    goToCursor,
    
    // Configuration
    pageSize: validatedPageSize,
    
    // Raw query for advanced use cases
    query,
  }
}
