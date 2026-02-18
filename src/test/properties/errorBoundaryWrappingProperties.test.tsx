/**
 * Property-Based Tests: Error Boundary Wrapping
 * Feature: error-handling
 * Properties: 21
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { PageErrorBoundary } from '../../components/shared/PageErrorBoundary'
import type { User } from '../../types'

// Mock console.error to suppress error boundary logs
vi.spyOn(console, 'error').mockImplementation(() => {})

// Component that throws an error
const ThrowError = ({ shouldThrow, message }: { shouldThrow: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message || 'Test error')
  }
  return <div>No error</div>
}

// Arbitraries
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 })
describe('Error Boundary Wrapping Properties', () => {
  let queryClient: QueryClient
  let mockUser: User

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    mockUser = {
      id: 'user-1',
      email: 'user@dabdoob.com',
      name: 'John Doe',
      role: 'agent',
      created_at: '2024-01-01T00:00:00Z'
    }
  })

  /**
   * Property 21: Error Boundary Wrapping
   * For any page component wrapped in PageErrorBoundary, errors should
   * be caught and display the fallback UI without crashing the application.
   * 
   * Validates: Requirements 7.4
   */
  describe('PageErrorBoundary catches errors', () => {
    it('Property 21: Should catch errors in wrapped components', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          errorMessageArb,
          (shouldThrow, message) => {
            cleanup()
            render(
              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
                    <ToastProvider>
                      <PageErrorBoundary>
                        <ThrowError shouldThrow={shouldThrow} message={message} />
                      </PageErrorBoundary>
                    </ToastProvider>
                  </AuthContext.Provider>
                </BrowserRouter>
              </QueryClientProvider>
            )

            if (shouldThrow) {
              // Error should be caught and fallback displayed
              expect(screen.getByText('Page Error')).toBeInTheDocument()
              expect(screen.getByText(/We're sorry, but this page encountered an unexpected error/i)).toBeInTheDocument()
            } else {
              // No error, content should be displayed
              expect(screen.getByText('No error')).toBeInTheDocument()
            }
          }
        ),
        { numRuns: 30 }
      )
    })

    it('Property 21: Should show refresh button when error occurs', () => {
      fc.assert(
        fc.property(
          errorMessageArb,
          (message) => {
            cleanup()
            render(
              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
                    <ToastProvider>
                      <PageErrorBoundary>
                        <ThrowError shouldThrow={true} message={message} />
                      </PageErrorBoundary>
                    </ToastProvider>
                  </AuthContext.Provider>
                </BrowserRouter>
              </QueryClientProvider>
            )

            expect(screen.getByText('Refresh Page')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 21: Should show dashboard link when error occurs', () => {
      fc.assert(
        fc.property(
          errorMessageArb,
          (message) => {
            cleanup()
            render(
              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
                    <ToastProvider>
                      <PageErrorBoundary>
                        <ThrowError shouldThrow={true} message={message} />
                      </PageErrorBoundary>
                    </ToastProvider>
                  </AuthContext.Provider>
                </BrowserRouter>
              </QueryClientProvider>
            )

            const dashboardLink = screen.getByText('Go to Dashboard')
            expect(dashboardLink).toBeInTheDocument()
            expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard')
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Custom fallback support', () => {
    it('Property 21: Should use custom fallback when provided', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          (shouldThrow, customMessage) => {
            const customFallback = <div data-testid="custom-fallback">{customMessage}</div>

            cleanup()
            render(
              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
                    <ToastProvider>
                      <PageErrorBoundary fallback={customFallback}>
                        <ThrowError shouldThrow={shouldThrow} />
                      </PageErrorBoundary>
                    </ToastProvider>
                  </AuthContext.Provider>
                </BrowserRouter>
              </QueryClientProvider>
            )

            if (shouldThrow) {
              const fallback = screen.getByTestId('custom-fallback')
              expect(fallback).toBeInTheDocument()
              expect(fallback.textContent).toBe(customMessage)
            } else {
              expect(screen.getByText('No error')).toBeInTheDocument()
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Multiple wrapped components', () => {
    it('Property 21: Each wrapped component handles errors independently', () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
              <ToastProvider>
                <PageErrorBoundary>
                  <ThrowError shouldThrow={false} />
                </PageErrorBoundary>
              </ToastProvider>
            </AuthContext.Provider>
          </BrowserRouter>
        </QueryClientProvider>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()

      // First error
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
              <ToastProvider>
                <PageErrorBoundary>
                  <ThrowError shouldThrow={true} message="First error" />
                </PageErrorBoundary>
              </ToastProvider>
            </AuthContext.Provider>
          </BrowserRouter>
        </QueryClientProvider>
      )

      expect(screen.queryByText(/First error/)).not.toBeInTheDocument()
      expect(screen.getByText('Page Error')).toBeInTheDocument()
    })
  })

  describe('Nested error boundaries', () => {
    it('Property 21: Inner error boundary catches errors before outer', () => {
      const InnerThrow = ({ shouldThrow }: { shouldThrow: boolean }) => (
        <PageErrorBoundary fallback={<div data-testid="inner-caught">Inner caught</div>}>
          <ThrowError shouldThrow={shouldThrow} />
        </PageErrorBoundary>
      )

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
              <ToastProvider>
                <PageErrorBoundary fallback={<div data-testid="outer-caught">Outer caught</div>}>
                  <InnerThrow shouldThrow={true} />
                </PageErrorBoundary>
              </ToastProvider>
            </AuthContext.Provider>
          </BrowserRouter>
        </QueryClientProvider>
      )

      // Inner ErrorBoundary should catch the error
      expect(screen.getByTestId('inner-caught')).toBeInTheDocument()
      expect(screen.queryByTestId('outer-caught')).not.toBeInTheDocument()
    })
  })

  describe('Recovery actions', () => {
    it('Property 21: Refresh button should be clickable', () => {
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      })

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthContext.Provider value={{ user: mockUser, loading: false, signOut: vi.fn() }}>
              <ToastProvider>
                <PageErrorBoundary>
                  <ThrowError shouldThrow={true} />
                </PageErrorBoundary>
              </ToastProvider>
            </AuthContext.Provider>
          </BrowserRouter>
        </QueryClientProvider>
      )

      const refreshButton = screen.getByText('Refresh Page')
      fireEvent.click(refreshButton)

      expect(reloadMock).toHaveBeenCalled()
    })
  })
})
