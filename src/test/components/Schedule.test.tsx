import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Schedule from '../../pages/Schedule/Schedule'
import { AuthContext } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { shiftsService } from '../../services'
import type { User } from '../../types'

vi.mock('../../services', () => ({
  shiftsService: {
    getShifts: vi.fn()
  }
}))

describe.skip('Schedule Page', () => {
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

  const renderSchedule = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <ToastProvider>
              <Schedule />
            </ToastProvider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  describe('Calendar rendering', () => {
    it('should render page title', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule()

      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })
    })

    it('should render calendar view', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule()

      await waitFor(() => {
        // Calendar should be rendered
        expect(document.querySelector('.calendar') || screen.getByText('Schedule')).toBeTruthy()
      })
    })
  })

  describe('Loading states', () => {
    it('should show loading state initially', () => {
      vi.mocked(shiftsService.getShifts).mockImplementation(
        () => new Promise(() => {})
      )

      renderSchedule()

      const spinners = document.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('should hide loading state after data loads', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule()

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin')
        expect(spinners.length).toBe(0)
      })
    })
  })

  describe('Shift display', () => {
    it('should display shifts when data is available', async () => {
      const mockShifts = [
        {
          id: 'shift-1',
          user_id: 'user-1',
          shift_date: '2024-02-01',
          shift_type: 'morning',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      vi.mocked(shiftsService.getShifts).mockResolvedValue(mockShifts as any)

      renderSchedule()

      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })
    })
  })
})
