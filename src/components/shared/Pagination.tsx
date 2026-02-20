interface PaginationProps {
  hasMore: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
}

/**
 * Pagination component for navigating through paginated data
 * Supports cursor-based pagination with next/previous navigation
 */
export function Pagination({
  hasMore,
  hasPrevious,
  isLoading,
  onNextPage,
  onPrevPage,
  currentPage,
  totalItems,
  pageSize,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        {/* Mobile pagination */}
        <button
          onClick={onPrevPage}
          disabled={!hasPrevious || isLoading}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={onNextPage}
          disabled={!hasMore || isLoading}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {/* Desktop pagination info */}
        <div>
          <p className="text-sm text-gray-700">
            {totalItems !== undefined && pageSize !== undefined && currentPage !== undefined ? (
              <>
                Showing{' '}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
                </span>{' '}
                to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span>{' '}
                of <span className="font-medium">{totalItems}</span> results
              </>
            ) : (
              <>
                {hasPrevious && 'Page '}
                {currentPage && <span className="font-medium">{currentPage}</span>}
                {hasMore && ' • More results available'}
              </>
            )}
          </p>
        </div>

        {/* Desktop pagination controls */}
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={onPrevPage}
              disabled={!hasPrevious || isLoading}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isLoading && (
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                Loading...
              </span>
            )}

            <button
              onClick={onNextPage}
              disabled={!hasMore || isLoading}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
