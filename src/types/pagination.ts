/**
 * Pagination types and interfaces for consistent pagination across the application
 */

/**
 * Parameters for paginated queries
 */
export interface PaginationParams {
  /** Number of items per page (default: 10) */
  pageSize?: number;
  /** Current page number (1-indexed, default: 1) */
  page?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGINATION_PARAMS: PaginationParams = {
  pageSize: 10,
  page: 1,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * State for pagination UI components
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Actions for pagination UI components
 */
export interface PaginationActions {
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Reset to first page */
  reset: () => void;
}

/**
 * Calculate pagination metadata from params and total count
 */
export function calculatePagination(
  params: PaginationParams,
  total: number
): Omit<PaginatedResult<unknown>, 'data'> {
  const page = params.page ?? DEFAULT_PAGINATION_PARAMS.page!;
  const pageSize = params.pageSize ?? DEFAULT_PAGINATION_PARAMS.pageSize!;
  const totalPages = Math.ceil(total / pageSize);

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Calculate offset for database queries
 */
export function calculateOffset(params: PaginationParams): number {
  const page = params.page ?? DEFAULT_PAGINATION_PARAMS.page!;
  const pageSize = params.pageSize ?? DEFAULT_PAGINATION_PARAMS.pageSize!;
  return (page - 1) * pageSize;
}
