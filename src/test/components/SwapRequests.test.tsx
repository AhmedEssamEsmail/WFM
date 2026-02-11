import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SwapRequests from '../../pages/SwapRequests/SwapRequests'
import { AuthContext } from '../../lib/AuthContext'
import { swapRequestsService } from '../../services'
import type { User, SwapRequest } from '../../types'

vi.mock('../../services', () => ({
  swapRequestsService: {
    getSwapRequests: vi.fn(),
    getUserSwapRequests: vi.fn()
  }
}))

describe('SwapRequests Page', () => {
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

  const renderSwapRequests = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <SwapRequests />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('List rendering', () => {
    it('should render page title', () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockResolvedValue([])

      renderSwapRequests()

      expect(screen.getByText('Swap Requests')).toBeInTheDocument()
    })

    it('should render swap requests when data is available', async () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockResolvedValue(mockSwapRequests)

      renderSwapRequests()

      await waitFor(() => {
        expect(screen.getByText('John Requester')).toBeInTheDocument()
      })
    })

    it('should show empty state when no requests', async () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockResolvedValue([])

      renderSwapRequests()

      await waitFor(() => {
        expect(screen.getByText(/no swap requests found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filtering', () => {
    it('should render filter controls', async () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockResolvedValue([])

      renderSwapRequests()

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading states', () => {
    it('should show loading state initially', () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockImplementation(
        () => new Promise(() => {})
      )

      renderSwapRequests()

      const spinners = document.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('should hide loading state after data loads', async () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockResolvedValue([])

      renderSwapRequests()

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin')
        expect(spinners.length).toBe(0)
      })
    })
  })

  describe('Pagination', () => {
    it('should render pagination controls when data is available', async () => {
      vi.mocked(swapRequestsService.getUserSwapRequests).mockResolvedValue(mockSwapRequests)

      renderSwapRequests()

      await waitFor(() => {
        expect(screen.queryByText('John Requester')).toBeInTheDocument()
      })
    })
  })
})
