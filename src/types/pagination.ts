/**
 * Pagination types and utilities for cursor-based pagination
 */

/**
 * Pagination parameters for cursor-based pagination
 */
export interface PaginationParams {
  /** Number of items per page (default: 20, max: 100) */
  limit?: number
  /** Cursor for the next page (opaque string) */
  cursor?: string
}

/**
 * Pagination metadata returned with paginated responses
 */
export interface PaginationMeta {
  /** Total number of items (if available) */
  total?: number
  /** Number of items in current page */
  count: number
  /** Cursor for the next page (null if no more pages) */
  nextCursor: string | null
  /** Cursor for the previous page (null if first page) */
  prevCursor: string | null
  /** Whether there are more pages */
  hasMore: boolean
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  data: T[]
  /** Pagination metadata */
  meta: PaginationMeta
}

/**
 * Cursor data structure (internal representation)
 */
interface CursorData {
  /** Timestamp or ID for cursor position */
  value: string
  /** Direction of pagination */
  direction: 'next' | 'prev'
}

/**
 * Encode cursor data to opaque string
 * Uses base64 encoding for URL safety
 */
export function encodeCursor(value: string, direction: 'next' | 'prev' = 'next'): string {
  const cursorData: CursorData = { value, direction }
  const jsonString = JSON.stringify(cursorData)
  return btoa(jsonString)
}

/**
 * Decode cursor string to cursor data
 * Returns null if cursor is invalid
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const jsonString = atob(cursor)
    const cursorData = JSON.parse(jsonString) as CursorData
    
    // Validate cursor structure
    if (!cursorData.value || !cursorData.direction) {
      return null
    }
    
    if (cursorData.direction !== 'next' && cursorData.direction !== 'prev') {
      return null
    }
    
    return cursorData
  } catch {
    // Invalid cursor format
    return null
  }
}

/**
 * Create pagination metadata from query results
 */
export function createPaginationMeta<T>(
  items: T[],
  limit: number,
  getCursorValue: (item: T) => string,
  total?: number
): PaginationMeta {
  const count = items.length
  const hasMore = count === limit
  
  // Generate next cursor from last item
  const nextCursor = hasMore && items.length > 0
    ? encodeCursor(getCursorValue(items[items.length - 1]), 'next')
    : null
  
  // Previous cursor is not typically used in infinite scroll
  // but can be implemented if needed
  const prevCursor = null
  
  return {
    total,
    count,
    nextCursor,
    prevCursor,
    hasMore,
  }
}

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_LIMIT = 20

/**
 * Maximum pagination limit
 */
export const MAX_PAGE_LIMIT = 100

/**
 * Validate and normalize pagination parameters
 */
export function normalizePaginationParams(params?: PaginationParams): Required<PaginationParams> {
  const limit = params?.limit 
    ? Math.min(Math.max(1, params.limit), MAX_PAGE_LIMIT)
    : DEFAULT_PAGE_LIMIT
  
  const cursor = params?.cursor || ''
  
  return { limit, cursor }
}
