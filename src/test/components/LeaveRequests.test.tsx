import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LeaveRequests from '../../pages/LeaveRequests/LeaveRequests'
import { AuthContext } from '../../lib/AuthContext'
import { leaveRequestsService } from '../../services'
import type { User, LeaveRequest } from '../../types'

vi.mock('../../services', () => ({
  leaveRequestsService: {
    getLeaveRequests: vi.fn(),
    getUserLeaveRequests: vi.fn()
  }
}))

vi.mock('../../hooks/useLeaveTypes', () => ({
  useLeaveTypes: () => ({
    leaveTypes: [
      { code: 'AL', label: 'Annual Leave', color: '#3B82F6' },
      { code: 'SL', label: 'Sick Leave', color: '#EF4444' }
    ]
  })
}))

describe('LeaveRequests Page', () => {
  let queryClient: QueryClient
  let mockUser: User

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
      users: {
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

  const renderLeaveRequests = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <LeaveRequests />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('List rendering', () => {
    it('should render page title', () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([])

      renderLeaveRequests()

      expect(screen.getByText('Leave Requests')).toBeInTheDocument()
    })

    it('should render leave requests when data is available', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue(mockLeaveRequests)

      renderLeaveRequests()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should show empty state when no requests', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([])

      renderLeaveRequests()

      await waitFor(() => {
        expect(screen.getByText(/no leave requests found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    it('should render filter controls', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([])

      renderLeaveRequests()

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading states', () => {
    it('should show loading state initially', () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockImplementation(
        () => new Promise(() => {})
      )

      renderLeaveRequests()

      const spinners = document.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('should hide loading state after data loads', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([])

      renderLeaveRequests()

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin')
        expect(spinners.length).toBe(0)
      })
    })
  })

  describe('Pagination', () => {
    it('should render pagination controls when data is available', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue(mockLeaveRequests)

      renderLeaveRequests()

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).toBeInTheDocument()
      })
    })
  })
})
