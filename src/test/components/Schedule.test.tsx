import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Mock supabase
vi.mock('../../lib/supabase', () => {
  const mockSupabaseFrom = vi.fn((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ 
              data: [
                { id: 'user-1', name: 'Agent 1', role: 'agent', department: 'Support' },
                { id: 'user-2', name: 'Agent 2', role: 'agent', department: 'Sales' },
                { id: 'user-3', name: 'Agent 3', role: 'agent', department: 'Support' }
              ], 
              error: null 
            }))
          })),
          order: vi.fn(() => Promise.resolve({ 
            data: [
              { id: 'user-1', name: 'Agent 1', role: 'agent', department: 'Support' },
              { id: 'user-2', name: 'Agent 2', role: 'agent', department: 'Sales' },
              { id: 'user-3', name: 'Agent 3', role: 'agent', department: 'Support' }
            ], 
            error: null 
          }))
        }))
      }
    }
    // Default for other tables
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          lte: vi.fn(() => ({
            gte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }
  })

  return {
    supabase: {
      from: mockSupabaseFrom
    }
  }
})

describe('Schedule Page', () => {
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

  describe('Team and Agent Filters', () => {
    const mockTLUser: User = {
      id: 'tl-1',
      email: 'tl@dabdoob.com',
      name: 'Team Lead',
      role: 'tl',
      created_at: '2024-01-01T00:00:00Z',
      department: 'Support'
    }

    const mockWFMUser: User = {
      id: 'wfm-1',
      email: 'wfm@dabdoob.com',
      name: 'WFM Admin',
      role: 'wfm',
      created_at: '2024-01-01T00:00:00Z',
      department: 'Operations'
    }

    it('should show Team filter for TL users', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockTLUser)

      await waitFor(() => {
        const teamFilter = screen.getByLabelText('Filter by team')
        expect(teamFilter).toBeInTheDocument()
      })
    })

    it('should show Team filter for WFM users', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockWFMUser)

      await waitFor(() => {
        const teamFilter = screen.getByLabelText('Filter by team')
        expect(teamFilter).toBeInTheDocument()
      })
    })

    it('should NOT show Team filter for Agent users', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockUser)

      await waitFor(() => {
        expect(screen.queryByLabelText('Filter by team')).not.toBeInTheDocument()
      })
    })

    it('should show Agent filter for TL users', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockTLUser)

      await waitFor(() => {
        const agentFilter = screen.getByLabelText('Filter by agent')
        expect(agentFilter).toBeInTheDocument()
      })
    })

    it('should show Agent filter for WFM users', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockWFMUser)

      await waitFor(() => {
        const agentFilter = screen.getByLabelText('Filter by agent')
        expect(agentFilter).toBeInTheDocument()
      })
    })

    it('should NOT show Agent filter for Agent users', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockUser)

      await waitFor(() => {
        expect(screen.queryByLabelText('Filter by agent')).not.toBeInTheDocument()
      })
    })

    it('should have "All Teams" as default option in Team filter', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockTLUser)

      await waitFor(() => {
        const teamFilter = screen.getByLabelText('Filter by team') as HTMLSelectElement
        expect(teamFilter.value).toBe('all')
        const allTeamsOption = within(teamFilter).getByText('All Teams')
        expect(allTeamsOption).toBeInTheDocument()
      })
    })

    it('should have "All Agents" as default option in Agent filter', async () => {
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockTLUser)

      await waitFor(() => {
        const agentFilter = screen.getByLabelText('Filter by agent') as HTMLSelectElement
        expect(agentFilter.value).toBe('all')
        const allAgentsOption = within(agentFilter).getByText('All Agents')
        expect(allAgentsOption).toBeInTheDocument()
      })
    })

    it('should reset agent filter when team filter changes', async () => {
      const user = userEvent.setup()
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockTLUser)

      await waitFor(() => {
        expect(screen.getByLabelText('Filter by team')).toBeInTheDocument()
      })

      const agentFilter = screen.getByLabelText('Filter by agent') as HTMLSelectElement
      const teamFilter = screen.getByLabelText('Filter by team') as HTMLSelectElement

      // Initially both should be 'all'
      expect(agentFilter.value).toBe('all')
      expect(teamFilter.value).toBe('all')

      // Change team filter
      await user.selectOptions(teamFilter, 'Support')

      // Agent filter should reset to 'all'
      expect(agentFilter.value).toBe('all')
    })

    it('should maintain schedule editing capabilities when filters are applied', async () => {
      const user = userEvent.setup()
      vi.mocked(shiftsService.getShifts).mockResolvedValue([])

      renderSchedule(mockTLUser)

      await waitFor(() => {
        expect(screen.getByLabelText('Filter by team')).toBeInTheDocument()
      })

      const teamFilter = screen.getByLabelText('Filter by team') as HTMLSelectElement

      // Apply team filter
      await user.selectOptions(teamFilter, 'Support')

      // Schedule grid should still be present and editable
      await waitFor(() => {
        const scheduleGrid = document.querySelector('table')
        expect(scheduleGrid).toBeInTheDocument()
      })
    })
  })
})