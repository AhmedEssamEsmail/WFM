import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChunkErrorBoundary } from '../../components/shared/ChunkErrorBoundary'

// Component that throws different types of errors
const ThrowError = ({ errorType }: { errorType: 'chunk' | 'other' | 'none' }) => {
  if (errorType === 'chunk') {
    const error = new Error('Failed to fetch dynamically imported module')
    throw error
  }
  if (errorType === 'other') {
    throw new Error('Regular error')
  }
  return <div>No error</div>
}

describe('ChunkErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error and console.log for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    // Clear sessionStorage
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('Error catching', () => {
    it('should render children when there is no error', () => {
      render(
        <ChunkErrorBoundary>
          <div>Test content</div>
        </ChunkErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should detect chunk loading errors', () => {
      render(
        <ChunkErrorBoundary>
          <ThrowError errorType="chunk" />
        </ChunkErrorBoundary>
      )

      expect(screen.getByText('Loading new version...')).toBeInTheDocument()
      expect(screen.getByText(/We're updating the app with the latest changes/i)).toBeInTheDocument()
    })

    it('should pass through non-chunk errors', () => {
      // Non-chunk errors should be caught by parent error boundary
      expect(() => {
        render(
          <ChunkErrorBoundary>
            <ThrowError errorType="other" />
          </ChunkErrorBoundary>
        )
      }).toThrow('Regular error')
    })
  })

  describe('Retry logic', () => {
    it('should reload page on first chunk error', () => {
      vi.useFakeTimers()
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      })

      render(
        <ChunkErrorBoundary>
          <ThrowError errorType="chunk" />
        </ChunkErrorBoundary>
      )

      // Fast-forward time to trigger reload
      vi.advanceTimersByTime(500)

      expect(reloadMock).toHaveBeenCalled()
      expect(sessionStorage.getItem('chunk-error-reloaded')).toBe('true')

      vi.useRealTimers()
    })
  })
})
