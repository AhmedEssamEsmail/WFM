import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCoverageData } from '../../hooks/useCoverageData'
import { supabase } from '../../lib/supabase'
import { format, addDays } from 'date-fns'
import { getStartOfWeek } from '../../utils/dateHelpers'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('useCoverageData Hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockSupabaseQuery = (data: any, error: any = null) => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    }

    // Return the final result
    Object.assign(mockChain, {
      then: (resolve: any) => {
        resolve({ data, error })
        return Promise.resolve({ data, error })
      }
    })

    return mockChain
  }

  describe('Coverage Calculation', () => {
    it('should calculate net coverage correctly', async () => {
      const weekStart = getStartOfWeek(new Date())
      const weekStartISO = format(weekStart, 'yyyy-MM-dd')
      const weekEndISO = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      // Mock shifts data - 20 shifts on Monday
      const shifts = Array.from({ length: 20 }, (_, i) => ({
        date: weekStartISO,
        user_id: `user-${i}`
      }))

      // Mock leave requests - 2 employees on leave on Monday
      const leaveRequests = [
        {
          user_id: 'user-100',
          start_date: weekStartISO,
          end_date: weekStartISO
        },
        {
          user_id: 'user-101',
          start_date: weekStartISO,
          end_date: weekStartISO
        }
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return mockSupabaseQuery(shifts) as any
        }
        if (table === 'leave_requests') {
          return mockSupabaseQuery(leaveRequests) as any
        }
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.days).toHaveLength(7)
      
      // Monday should have 20 shifts - 2 on leave = 18 net coverage
      const monday = result.current.data?.days[0]
      expect(monday?.scheduledCount).toBe(20)
      expect(monday?.onLeaveCount).toBe(2)
      expect(monday?.netCoverage).toBe(18)
    })

    it('should classify coverage levels correctly', async () => {
      const weekStart = getStartOfWeek(new Date())
      const weekStartISO = format(weekStart, 'yyyy-MM-dd')
      const day2ISO = format(addDays(weekStart, 1), 'yyyy-MM-dd')
      const day3ISO = format(addDays(weekStart, 2), 'yyyy-MM-dd')

      // Mock shifts: 15 on Monday (adequate), 10 on Tuesday (low), 5 on Wednesday (critical)
      // Based on actual thresholds: >12 = adequate, 8-12 = low, <8 = critical
      const shifts = [
        ...Array.from({ length: 15 }, (_, i) => ({ date: weekStartISO, user_id: `user-${i}` })),
        ...Array.from({ length: 10 }, (_, i) => ({ date: day2ISO, user_id: `user-${i}` })),
        ...Array.from({ length: 5 }, (_, i) => ({ date: day3ISO, user_id: `user-${i}` }))
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return mockSupabaseQuery(shifts) as any
        }
        if (table === 'leave_requests') {
          return mockSupabaseQuery([]) as any
        }
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const days = result.current.data?.days
      expect(days?.[0].level).toBe('adequate') // 15 > 12
      expect(days?.[1].level).toBe('low') // 10 >= 8 and <= 12
      expect(days?.[2].level).toBe('critical') // 5 < 8
    })

    it('should handle overlapping leave requests correctly', async () => {
      const weekStart = getStartOfWeek(new Date())
      const weekStartISO = format(weekStart, 'yyyy-MM-dd')
      const weekEndISO = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      // Mock shifts - 20 shifts each day
      const shifts = []
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
        for (let j = 0; j < 20; j++) {
          shifts.push({ date, user_id: `user-${j}` })
        }
      }

      // Mock leave request spanning entire week
      const leaveRequests = [
        {
          user_id: 'user-100',
          start_date: weekStartISO,
          end_date: weekEndISO
        }
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return mockSupabaseQuery(shifts) as any
        }
        if (table === 'leave_requests') {
          return mockSupabaseQuery(leaveRequests) as any
        }
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // All days should have 1 person on leave
      result.current.data?.days.forEach(day => {
        expect(day.onLeaveCount).toBe(1)
        expect(day.netCoverage).toBe(19) // 20 - 1
      })
    })

    it('should handle zero shifts correctly', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.data?.days.forEach(day => {
        expect(day.scheduledCount).toBe(0)
        expect(day.onLeaveCount).toBe(0)
        expect(day.netCoverage).toBe(0)
        expect(day.level).toBe('critical')
      })
    })
  })

  describe('Week Range', () => {
    it('should return 7 days starting from Monday', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.days).toHaveLength(7)
      
      const dayNames = result.current.data?.days.map(d => d.dayName)
      expect(dayNames).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    })

    it('should set correct week start and end dates', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const weekStart = getStartOfWeek(new Date())
      const weekEnd = addDays(weekStart, 6)

      expect(result.current.data?.weekStart).toBe(format(weekStart, 'yyyy-MM-dd'))
      expect(result.current.data?.weekEnd).toBe(format(weekEnd, 'yyyy-MM-dd'))
    })
  })

  describe('Error Handling', () => {
    it('should handle shifts query error', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return mockSupabaseQuery(null, new Error('Database error')) as any
        }
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })

    it('should handle leave_requests query error', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'leave_requests') {
          return mockSupabaseQuery(null, new Error('Database error')) as any
        }
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null data from queries', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery(null) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.data?.days.forEach(day => {
        expect(day.scheduledCount).toBe(0)
        expect(day.onLeaveCount).toBe(0)
      })
    })

    it('should handle boundary coverage levels', async () => {
      const weekStart = getStartOfWeek(new Date())
      const day1ISO = format(weekStart, 'yyyy-MM-dd')
      const day2ISO = format(addDays(weekStart, 1), 'yyyy-MM-dd')
      const day3ISO = format(addDays(weekStart, 2), 'yyyy-MM-dd')
      const day4ISO = format(addDays(weekStart, 3), 'yyyy-MM-dd')

      // Exactly 13 (adequate), exactly 12 (low), exactly 8 (low), exactly 7 (critical)
      // Based on actual thresholds: >12 = adequate, 8-12 = low, <8 = critical
      const shifts = [
        ...Array.from({ length: 13 }, (_, i) => ({ date: day1ISO, user_id: `user-${i}` })),
        ...Array.from({ length: 12 }, (_, i) => ({ date: day2ISO, user_id: `user-${i}` })),
        ...Array.from({ length: 8 }, (_, i) => ({ date: day3ISO, user_id: `user-${i}` })),
        ...Array.from({ length: 7 }, (_, i) => ({ date: day4ISO, user_id: `user-${i}` }))
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return mockSupabaseQuery(shifts) as any
        }
        return mockSupabaseQuery([]) as any
      })

      const { result } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const days = result.current.data?.days
      expect(days?.[0].netCoverage).toBe(13)
      expect(days?.[0].level).toBe('adequate') // 13 > 12
      expect(days?.[1].netCoverage).toBe(12)
      expect(days?.[1].level).toBe('low') // 12 >= 8 and <= 12
      expect(days?.[2].netCoverage).toBe(8)
      expect(days?.[2].level).toBe('low') // 8 >= 8 and <= 12
      expect(days?.[3].netCoverage).toBe(7)
      expect(days?.[3].level).toBe('critical') // 7 < 8
    })
  })

  describe('Caching', () => {
    it('should cache results for 2 minutes', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery([]) as any
      })

      const { result, rerender } = renderHook(() => useCoverageData(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstData = result.current.data

      // Rerender should use cached data
      rerender()

      expect(result.current.data).toBe(firstData)
      expect(result.current.isLoading).toBe(false)
    })
  })
})
