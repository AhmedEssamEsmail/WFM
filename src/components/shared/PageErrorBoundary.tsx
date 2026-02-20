/**
 * Page Error Boundary Wrapper
 *
 * A wrapper component that wraps page components in ErrorBoundary
 * to catch errors at the page level and display a user-friendly error message.
 */

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PageErrorBoundary component that wraps children in an ErrorBoundary
 * with a default fallback UI optimized for page-level errors.
 */
export function PageErrorBoundary({ children, fallback }: PageErrorBoundaryProps) {
  const defaultFallback = (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Page Error</h1>

        <p className="mb-6 text-gray-600">
          We're sorry, but this page encountered an unexpected error. Please try refreshing the
          page.
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Refresh Page
          </button>
          <a
            href="/dashboard"
            className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );

  return <ErrorBoundary fallback={fallback || defaultFallback}>{children}</ErrorBoundary>;
}

export default PageErrorBoundary;
