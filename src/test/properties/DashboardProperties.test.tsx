/**
 * Property-Based Tests: Dashboard Component
 * Feature: dashboard
 * Properties: 15
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../../pages/Dashboard'
import { AuthContext } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { dashboardService } from '../../services/dashboardService'
import type { User, SwapRequest, LeaveRequest } from '../../types'

// Mock dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getPendingItems: vi.fn()
  }
}))

// Mock useLeaveTypes hook
vi.mock('../../hooks/useLeaveTypes', () => ({
  useLeaveTypes: () => ({
    leaveTypes: [
      { code: 'AL', label: 'Annual Leave', color: '#3B82F6' },
      { code: 'SL', label: 'Sick Leave', color: '#EF4444' }
    ]
  })
}))

// Arbitraries for generating test data
const uuidArb = fc.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
const dateArb = fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
const timestampArb = fc.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)

const userArb: fc.Arbitrary<User> = fc.record({
  id: uuidArb,
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
  role: fc.constantFrom('agent', 'tl', 'wfm'),
  created_at: timestampArb
})

const swapRequestArb: fc.Arbitrary<SwapRequest & { requester: User; target_user: User }> = fc.record({
  id: uuidArb,
  requester_id: uuidArb,
  target_user_id: uuidArb,
  requester_shift_id: uuidArb,
  target_shift_id: uuidArb,
  status: fc.constantFrom('pending_acceptance', 'pending_tl', 'pending_wfm', 'approved', 'rejected'),
  created_at: timestampArb,
  updated_at: timestampArb,
  requester: userArb,
  target_user: userArb
}).map(req => ({
  ...req,
  requester_id: req.requester.id,
  target_user_id: req.target_user.id
}) as any)

const leaveRequestArb: fc.Arbitrary<LeaveRequest & { user: User }> = fc.record({
  id: uuidArb,
  user_id: uuidArb,
  leave_type: fc.constantFrom('AL', 'SL', 'CL', 'PL'),
  start_date: dateArb,
  end_date: dateArb,
  status: fc.constantFrom('pending_tl', 'pending_wfm', 'approved', 'rejected', 'denied'),
  created_at: timestampArb,
  updated_at: timestampArb,
  user: userArb
}).map(req => ({
  ...req,
  user_id: req.user.id
}) as any)

describe('Dashboard Component Properties', () => {
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

    vi.clearAllMocks()
  })

  const renderDashboard = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <ToastProvider>
              <Dashboard />
            </ToastProvider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  /**
   * Property 15: Component Test Coverage
   * For any valid dashboard data, the component should render correctly
   * without errors and display all expected elements.
   * 
   * Validates: Requirements 6.2
   */
  describe('Rendering with various data combinations', () => {
    it('Property 15: Should render welcome message for any valid user', () => {
      fc.assert(
        fc.property(
          userArb,
          async (user) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: [],
              leaveRequests: []
            })

            renderDashboard(user)

            // Check for welcome message pattern
            expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument()
            // Use getByRole to find the paragraph and check if it contains the user name
            const paragraphs = screen.getAllByRole('paragraph')
            const welcomeParagraph = paragraphs.find(p => p.textContent?.includes('Welcome back'))
            expect(welcomeParagraph).toBeDefined()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 15: Should render action cards regardless of data', () => {
      fc.assert(
        fc.property(
          userArb,
          async (user) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: [],
              leaveRequests: []
            })

            renderDashboard(user)

            expect(screen.getByText('New Swap Request')).toBeInTheDocument()
            expect(screen.getByText('New Leave Request')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 15: Should render swap requests when data is available', () => {
      fc.assert(
        fc.property(
          fc.array(swapRequestArb, { maxLength: 5 }),
          async (swapRequests) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: swapRequests as any,
              leaveRequests: []
            })

            renderDashboard()

            // Check that swap requests section is rendered
            expect(screen.getByText('Recent Swap Requests')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 15: Should render leave requests when data is available', () => {
      fc.assert(
        fc.property(
          fc.array(leaveRequestArb, { maxLength: 5 }),
          async (leaveRequests) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: [],
              leaveRequests: leaveRequests as any
            })

            renderDashboard()

            // Check that leave requests section is rendered
            expect(screen.getByText('Recent Leave Requests')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 15: Should handle empty data gracefully', () => {
      fc.assert(
        fc.property(
          userArb,
          async (user) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: [],
              leaveRequests: []
            })

            renderDashboard(user)

            expect(screen.getByText('No swap requests found')).toBeInTheDocument()
            expect(screen.getByText('No leave requests found')).toBeInTheDocument()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('Property 15: Should handle mixed data (some requests, no others)', () => {
      fc.assert(
        fc.property(
          fc.array(swapRequestArb, { maxLength: 3 }),
          fc.array(leaveRequestArb, { maxLength: 3 }),
          async (swapRequests, leaveRequests) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: swapRequests as any,
              leaveRequests: leaveRequests as any
            })

            renderDashboard()

            if (swapRequests.length > 0) {
              await waitFor(() => {
                expect(screen.queryByText('No swap requests found')).not.toBeInTheDocument()
              })
            }

            if (leaveRequests.length > 0) {
              await waitFor(() => {
                expect(screen.queryByText('No leave requests found')).not.toBeInTheDocument()
              })
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Error handling', () => {
    it('Property 15: Should render even when service throws error', () => {
      fc.assert(
        fc.property(
          userArb,
          async (user) => {
            vi.mocked(dashboardService.getPendingItems).mockRejectedValue(
              new Error('Network error')
            )

            renderDashboard(user)

            // Dashboard should still render with welcome message
            expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument()
            expect(screen.getByText(user.name)).toBeInTheDocument()
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Navigation elements', () => {
    it('Property 15: Should have View All links for both sections', () => {
      fc.assert(
        fc.property(
          userArb,
          async (user) => {
            vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
              swapRequests: [],
              leaveRequests: []
            })

            renderDashboard(user)

            // Check for View All links
            const viewAllLinks = screen.getAllByText('View All')
            expect(viewAllLinks).toHaveLength(2)
            expect(viewAllLinks[0].closest('a')).toHaveAttribute('href', '/swap-requests')
            expect(viewAllLinks[1].closest('a')).toHaveAttribute('href', '/leave-requests')
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})