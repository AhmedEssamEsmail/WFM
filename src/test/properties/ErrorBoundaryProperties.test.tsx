/**
 * Property-Based Tests: ErrorBoundary Component
 * Feature: error-handling
 * Properties: 16
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ErrorBoundary } from '../../components/ErrorBoundary'

// Component that throws an error conditionally
const ThrowError = ({ shouldThrow, message }: { shouldThrow: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message || 'Test error')
  }
  return <div>No error</div>
}

// Arbitraries
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 })

describe('ErrorBoundary Component Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  /**
   * Property 16: Error Boundary Testing
   * For any error thrown by child components, the ErrorBoundary should
   * catch it and display the error UI without crashing.
   * 
   * Validates: Requirements 6.3
   */
  describe('Error catching behavior', () => {
    it('Property 16: Should catch any error thrown by children', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          errorMessageArb,
          (shouldThrow, message) => {
            render(
              <ErrorBoundary>
                <ThrowError shouldThrow={shouldThrow} message={message} />
              </ErrorBoundary>
            )

            if (shouldThrow) {
              expect(screen.getByText('Something went wrong')).toBeInTheDocument()
              expect(screen.getByText(/We're sorry, but something unexpected happened/i)).toBeInTheDocument()
            } else {
              expect(screen.getByText('No error')).toBeInTheDocument()
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    it('Property 16: Should display custom fallback when provided', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (shouldThrow, fallbackText) => {
            const customFallback = <div>{fallbackText}</div>

            render(
              <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={shouldThrow} />
              </ErrorBoundary>
            )

            if (shouldThrow) {
              expect(screen.getByText(fallbackText)).toBeInTheDocument()
              expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
            } else {
              expect(screen.getByText('No error')).toBeInTheDocument()
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Recovery options', () => {
    it('Property 16: Should always show refresh button when error occurs', () => {
      fc.assert(
        fc.property(
          errorMessageArb,
          (message) => {
            render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} message={message} />
              </ErrorBoundary>
            )

            expect(screen.getByText('Refresh Page')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 16: Should always show dashboard button when error occurs', () => {
      fc.assert(
        fc.property(
          errorMessageArb,
          (message) => {
            render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} message={message} />
              </ErrorBoundary>
            )

            expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 16: Refresh button should be clickable', () => {
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const refreshButton = screen.getByText('Refresh Page')
      fireEvent.click(refreshButton)

      expect(reloadMock).toHaveBeenCalled()
    })
  })

  describe('Error display in development', () => {
    it('Property 16: Should show error details in development mode', () => {
      const originalEnv = import.meta.env.DEV
      import.meta.env.DEV = true

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundary>
      )

      // Error details should be visible in dev mode
      expect(screen.getByText('Test error message')).toBeInTheDocument()

      import.meta.env.DEV = originalEnv
    })
  })

  describe('Multiple error instances', () => {
    it('Property 16: Each ErrorBoundary should handle errors independently', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()

      // First error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="First error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('First error')).toBeInTheDocument()

      // Second error (new instance)
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Second error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Second error')).toBeInTheDocument()
    })
  })

  describe('Nested ErrorBoundaries', () => {
    it('Property 16: Inner ErrorBoundary should catch errors before outer', () => {
      const InnerThrow = ({ shouldThrow }: { shouldThrow: boolean }) => (
        <ErrorBoundary fallback={<div>Inner caught</div>}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      render(
        <ErrorBoundary fallback={<div>Outer caught</div>}>
          <InnerThrow shouldThrow={true} />
        </ErrorBoundary>
      )

      // Inner ErrorBoundary should catch the error
      expect(screen.getByText('Inner caught')).toBeInTheDocument()
    })
  })
})


