import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Error boundary that handles chunk loading errors
 * Automatically reloads the page once to fetch new chunks after deployment
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Detect chunk loading errors
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('Failed to load module script') ||
      error.name === 'ChunkLoadError';

    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.isChunkError) {
      console.log('Chunk load error detected:', error.message);

      // Auto-reload once to get new chunks
      // Use sessionStorage to prevent infinite reload loops
      const hasReloaded = sessionStorage.getItem('chunk-error-reloaded');

      if (!hasReloaded) {
        console.log('Reloading page to fetch new chunks...');
        sessionStorage.setItem('chunk-error-reloaded', 'true');

        // Small delay to show loading message
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // If already reloaded once, clear flag and show error
        sessionStorage.removeItem('chunk-error-reloaded');
        console.error('Chunk load error persists after reload:', error, errorInfo);
      }
    } else {
      // Log non-chunk errors
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.isChunkError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="mx-auto max-w-md p-6 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 animate-spin text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Loading new version...</h2>
            <p className="text-gray-600">
              We're updating the app with the latest changes. This will only take a moment.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
