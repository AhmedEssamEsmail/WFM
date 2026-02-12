/**
 * Page Error Boundary Wrapper
 * 
 * A wrapper component that wraps page components in ErrorBoundary
 * to catch errors at the page level and display a user-friendly error message.
 */

import { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface PageErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * PageErrorBoundary component that wraps children in an ErrorBoundary
 * with a default fallback UI optimized for page-level errors.
 */
export function PageErrorBoundary({ children, fallback }: PageErrorBoundaryProps) {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page Error
        </h1>
        
        <p className="text-gray-600 mb-6">
          We're sorry, but this page encountered an unexpected error. Please try refreshing the page.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Refresh Page
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  )
}

export default PageErrorBoundary