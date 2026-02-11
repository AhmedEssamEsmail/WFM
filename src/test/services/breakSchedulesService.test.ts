import { describe, it, expect, vi, beforeEach } from 'vitest'
import { breakSchedulesService } from '../../services/breakSchedulesService'
import type { BreakSchedule, BreakScheduleWarning } from '../../types'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('breakSchedulesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getScheduleForDate', () => {
    it('should fetch schedules for a specific date', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockShifts = [
        {
          id: 'shift1',
          user_id: 'user1',
          date: '2024-01-01',
          shift_type: 'AM',
          users: { id: 'user1', name: 'Agent 1', department: 'Sales' },
        },
      ]

      const mockBreakSchedules: BreakSchedule[] = [
        {
          id: 'break1',
          user_id: 'user1',
          schedule_date: '2024-01-01',
          shift_type: 'AM',
          interval_start: '10:00:00',
          break_type: 'HB1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'user1',
        },
      ]

      const mockWarnings: BreakScheduleWarning[] = []

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
          } as any
        }
        if (table === 'break_schedules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockBreakSchedules, error: null }),
          } as any
        }
        if (table === 'break_schedule_warnings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockWarnings, error: null }),
            }),
          } as any
        }
        return {} as any
      })

      const result = await breakSchedulesService.getScheduleForDate('2024-01-01')

      expect(result).toHaveProperty('agents')
      expect(result).toHaveProperty('summary')
      expect(result.agents).toHaveLength(1)
    })

    it('should filter by department when provided', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockShifts = [
        {
          id: 'shift1',
          user_id: 'user1',
          date: '2024-01-01',
          shift_type: 'AM',
          users: { id: 'user1', name: 'Agent 1', department: 'Sales' },
        },
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
            }),
          } as any
        }
        if (table === 'break_schedules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any
        }
        if (table === 'break_schedule_warnings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any
        }
        return {} as any
      })

      const result = await breakSchedulesService.getScheduleForDate('2024-01-01', 'Sales')

      expect(result).toHaveProperty('agents')
    })

    it('should throw error when shifts query fails', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
          } as any
        }
        return {} as any
      })

      await expect(breakSchedulesService.getScheduleForDate('2024-01-01')).rejects.toThrow()
    })
  })

  describe('getCoverageSummary', () => {
    it('should return coverage summary for a date', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockShifts = [
        {
          id: 'shift1',
          user_id: 'user1',
          date: '2024-01-01',
          shift_type: 'AM',
          users: { id: 'user1', name: 'Agent 1', department: 'Sales' },
        },
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
          } as any
        }
        if (table === 'break_schedules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any
        }
        if (table === 'break_schedule_warnings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any
        }
        return {} as any
      })

      const result = await breakSchedulesService.getCoverageSummary('2024-01-01')

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })
  })

  describe('getWarnings', () => {
    it('should fetch unresolved warnings for a date', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockWarnings: BreakScheduleWarning[] = [
        {
          id: 'warning1',
          user_id: 'user1',
          schedule_date: '2024-01-01',
          warning_type: 'shift_changed',
          message: 'Shift changed',
          old_shift_type: 'AM',
          new_shift_type: 'PM',
          is_resolved: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockWarnings, error: null }),
        }),
      } as any)

      const result = await breakSchedulesService.getWarnings('2024-01-01')

      expect(result).toHaveLength(1)
      expect(result[0].warning_type).toBe('shift_changed')
    })

    it('should throw error when query fails', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
        }),
      } as any)

      await expect(breakSchedulesService.getWarnings('2024-01-01')).rejects.toThrow()
    })
  })

  describe('updateBreakSchedule', () => {
    it('should update break schedule for a user', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockShift = { shift_type: 'AM' }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockShift, error: null }),
              }),
            }),
          } as any
        }
        if (table === 'break_schedules') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any
        }
        return {} as any
      })

      const request = {
        user_id: 'user1',
        schedule_date: '2024-01-01',
        intervals: [
          { interval_start: '10:00:00', break_type: 'HB1' as const },
          { interval_start: '12:00:00', break_type: 'B' as const },
        ],
      }

      const result = await breakSchedulesService.updateBreakSchedule(request)

      expect(result.success).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should throw error when shift not found', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Shift not found') }),
          }),
        }),
      } as any)

      const request = {
        user_id: 'user1',
        schedule_date: '2024-01-01',
        intervals: [],
      }

      await expect(breakSchedulesService.updateBreakSchedule(request)).rejects.toThrow()
    })
  })

  describe('bulkUpdateBreakSchedules', () => {
    it('should update multiple break schedules', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockShift = { shift_type: 'AM' }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockShift, error: null }),
              }),
            }),
          } as any
        }
        if (table === 'break_schedules') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any
        }
        return {} as any
      })

      const updates = [
        {
          user_id: 'user1',
          schedule_date: '2024-01-01',
          intervals: [{ interval_start: '10:00:00', break_type: 'HB1' as const }],
        },
        {
          user_id: 'user2',
          schedule_date: '2024-01-01',
          intervals: [{ interval_start: '11:00:00', break_type: 'HB1' as const }],
        },
      ]

      const result = await breakSchedulesService.bulkUpdateBreakSchedules(updates)

      expect(result.success).toBe(true)
    })
  })

  describe('dismissWarning', () => {
    it('should mark warning as resolved', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      await breakSchedulesService.dismissWarning('warning1')

      expect(supabase.from).toHaveBeenCalledWith('break_schedule_warnings')
    })

    it('should throw error when update fails', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
      } as any)

      await expect(breakSchedulesService.dismissWarning('warning1')).rejects.toThrow()
    })
  })

  describe('getBreakScheduleById', () => {
    it('should fetch break schedule by ID', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      const mockBreak: BreakSchedule = {
        id: 'break1',
        user_id: 'user1',
        schedule_date: '2024-01-01',
        shift_type: 'AM',
        interval_start: '10:00:00',
        break_type: 'HB1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user1',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockBreak, error: null }),
        }),
      } as any)

      const result = await breakSchedulesService.getBreakScheduleById('break1')

      expect(result.id).toBe('break1')
      expect(result.break_type).toBe('HB1')
    })
  })

  describe('deleteUserBreaks', () => {
    it('should delete all breaks for a user on a date', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as any)

      await breakSchedulesService.deleteUserBreaks('user1', '2024-01-01')

      expect(supabase.from).toHaveBeenCalledWith('break_schedules')
    })

    it('should throw error when delete fails', async () => {
      const { supabase } = await import('../../lib/supabase')
      
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
          }),
        }),
      } as any)

      await expect(breakSchedulesService.deleteUserBreaks('user1', '2024-01-01')).rejects.toThrow()
    })
  })

  describe('autoDistribute', () => {
    it('should throw not implemented error', async () => {
      await expect(breakSchedulesService.autoDistribute({})).rejects.toThrow(
        'Auto-distribute not yet implemented'
      )
    })
  })
})
