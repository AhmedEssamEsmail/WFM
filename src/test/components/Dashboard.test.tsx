import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../../pages/Dashboard'
import { AuthContext } from '../../lib/AuthContext'
import { ToastProvider } from '../../lib/ToastContext'
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

describe('Dashboard Component', () => {
  let queryClient: QueryClient
  let mockUser: User

  const mockSwapRequests: SwapRequest[] = [
    {
      id: 'swap-1',
      requester_id: 'user-1',
      target_user_id: 'user-2',
      requester_shift_id: 'shift-1',
      target_shift_id: 'shift-2',
      status: 'pending_acceptance',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      requester: {
        id: 'user-1',
        email: 'requester@dabdoob.com',
        name: 'John Requester',
        role: 'agent',
        created_at: '2024-01-01T00:00:00Z'
      },
      target_user: {
        id: 'user-2',
        email: 'target@dabdoob.com',
        name: 'Jane Target',
        role: 'agent',
        created_at: '2024-01-01T00:00:00Z'
      }
    } as any
  ]

  const mockLeaveRequests: LeaveRequest[] = [
    {
      id: 'leave-1',
      user_id: 'user-1',
      leave_type: 'AL',
      start_date: '2024-02-01',
      end_date: '2024-02-05',
      status: 'pending_tl',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      user: {
        id: 'user-1',
        email: 'user@dabdoob.com',
        name: 'John Doe',
        role: 'agent',
        created_at: '2024-01-01T00:00:00Z'
      }
    } as any
  ]

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

  describe('Rendering with data', () => {
    it('should render dashboard with user name', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: mockSwapRequests as any,
        leaveRequests: mockLeaveRequests as any
      })

      renderDashboard()

      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument()
    })

    it('should render action cards', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: []
      })

      renderDashboard()

      expect(screen.getByText('New Swap Request')).toBeInTheDocument()
      expect(screen.getByText('New Leave Request')).toBeInTheDocument()
    })

    it('should render swap requests when data is available', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: mockSwapRequests as any,
        leaveRequests: []
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('John Requester')).toBeInTheDocument()
        expect(screen.getByText('→ Jane Target')).toBeInTheDocument()
      })
    })

    it('should render leave requests when data is available', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: mockLeaveRequests as any
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Annual Leave')).toBeInTheDocument()
      })
    })
  })

  describe('Loading states', () => {
    it('should show loading spinner for swap requests', () => {
      vi.mocked(dashboardService.getPendingItems).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderDashboard()

      // Check for loading spinner by class name
      const spinners = document.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('should hide loading spinner after data loads', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: []
      })

      renderDashboard()

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin')
        expect(spinners.length).toBe(0)
      })
    })
  })

  describe('Error states', () => {
    it('should handle swap requests fetch error gracefully', async () => {
      vi.mocked(dashboardService.getPendingItems).mockRejectedValue(
        new Error('Failed to fetch dashboard data')
      )

      renderDashboard()

      await waitFor(() => {
        expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
      })

      // Dashboard should still render even with error
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument()
    })

    it('should handle leave requests fetch error gracefully', async () => {
      vi.mocked(dashboardService.getPendingItems).mockRejectedValue(
        new Error('Failed to fetch dashboard data')
      )

      renderDashboard()

      await waitFor(() => {
        expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument()
      })

      // Dashboard should still render even with error
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument()
    })

    it('should show empty state when no swap requests', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: []
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('No swap requests found')).toBeInTheDocument()
      })
    })

    it('should show empty state when no leave requests', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: []
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('No leave requests found')).toBeInTheDocument()
      })
    })
  })
})



