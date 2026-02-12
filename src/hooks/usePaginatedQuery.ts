/**
 * DEPRECATED: This file is deprecated in favor of offset-based pagination.
 * 
 * The application has standardized on offset-based pagination using:
 * - PaginationParams from src/types/pagination.ts
 * - PaginatedResult from src/types/pagination.ts
 * 
 * This file is kept for backward compatibility with service layer types.
 * For new code, use the offset-based pagination pattern shown in:
 * - src/hooks/useSwapRequests.ts
 * - src/hooks/useLeaveRequests.ts
 */

/**
 * @deprecated Use PaginatedResult from src/types/pagination.ts instead
 * 
 * Legacy cursor-based pagination response structure.
 * Kept for backward compatibility with existing service methods.
 */
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  prevCursor?: string
  hasMore: boolean
  total?: number
}
