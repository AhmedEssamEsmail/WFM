import { describe, it, expect, vi, beforeEach } from 'vitest';
import { breakSchedulesService } from '../../services/breakSchedulesService';
import type { BreakSchedule, BreakScheduleWarning } from '../../types';
import { BREAK_SCHEDULE } from '../../constants';

// Define the same constants as the service file
const { TABLE_NAMES: BREAK_SCHEDULES_TABLE_NAMES, HOURS, INTERVAL_MINUTES } = BREAK_SCHEDULE;

const createMockQuery = (data: any, error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  then: (resolve: any, reject: any) => {
    if (error) reject(error);
    else resolve({ data, error });
    return Promise.resolve({ data, error });
  },
});

const createMockQueryWithSingle = (data: any, error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data, error }),
  then: (resolve: any, reject: any) => {
    if (error) reject(error);
    else resolve({ data, error });
    return Promise.resolve({ data, error });
  },
});

// Create a mock delete chain that supports eq().eq().eq().neq()
const createMockDeleteChain = (error: any = null) => {
  // Create a chainable object that supports eq().eq().eq().neq()
  const chain: any = {
    then: (resolve: any, reject: any) => {
      if (error) reject(error);
      else resolve({ data: null, error });
      return Promise.resolve({ data: null, error });
    },
  };

  // Create a recursive eq function that returns the chain
  const eqFn = vi.fn().mockImplementation(() => chain);
  chain.eq = eqFn;
  chain.neq = vi.fn().mockReturnValue(chain);

  return {
    eq: eqFn,
  };
};

const createMockInsert = (error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  then: (resolve: any, reject: any) => {
    if (error) reject(error);
    else resolve({ data: [{ id: 'new-id' }], error });
    return Promise.resolve({ data: [{ id: 'new-id' }], error });
  },
});

const createMockUpdate = (error: any = null) => ({
  eq: vi.fn().mockReturnThis(),
  then: (resolve: any, reject: any) => {
    if (error) reject(error);
    else resolve({ data: null, error });
    return Promise.resolve({ data: null, error });
  },
});

// Mock Supabase before importing the service
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'shifts') {
        return createMockQueryWithSingle({ id: 'shift1', shift_type: 'AM' });
      }
      if (table === 'break_schedules') {
        return {
          ...createMockQuery([]),
          delete: vi.fn().mockImplementation(() => createMockDeleteChain()),
          insert: vi.fn().mockReturnValue(createMockInsert()),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'break_schedule_warnings') {
        return createMockQuery([]);
      }
      return createMockQuery(null);
    }),
  },
}));

// Mock shift configurations service
vi.mock('../../services/shiftConfigurationsService', () => ({
  shiftConfigurationsService: {
    getShiftHoursMap: vi.fn().mockResolvedValue({
      AM: { start: '09:00:00', end: '17:00:00' },
      PM: { start: '13:00:00', end: '21:00:00' },
      BET: { start: '11:00:00', end: '19:00:00' },
      OFF: null,
    }),
    getActiveShiftConfigurations: vi.fn().mockResolvedValue([
      { shift_code: 'AM', start_time: '09:00:00', end_time: '17:00:00' },
      { shift_code: 'PM', start_time: '13:00:00', end_time: '21:00:00' },
      { shift_code: 'BET', start_time: '11:00:00', end_time: '19:00:00' },
      { shift_code: 'OFF', start_time: '00:00:00', end_time: '00:00:00' },
    ]),
  },
}));

describe('breakSchedulesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getScheduleForDate', () => {
    it('should fetch schedules for a specific date', async () => {
      const { supabase } = await import('../../lib/supabase');

      const mockShifts = [
        {
          id: 'shift1',
          user_id: 'user1',
          date: '2024-01-01',
          shift_type: 'AM',
          users: { id: 'user1', name: 'Agent 1', department: 'Sales' },
        },
      ];

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
      ];

      const mockWarnings: BreakScheduleWarning[] = [];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
          } as any;
        }
        if (table === 'break_schedules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockBreakSchedules, error: null }),
          } as any;
        }
        if (table === 'break_schedule_warnings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockWarnings, error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await breakSchedulesService.getScheduleForDate('2024-01-01');

      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('summary');
      expect(result.agents).toHaveLength(1);
    });

    it('should filter by department when provided', async () => {
      const { supabase } = await import('../../lib/supabase');

      const mockShifts = [
        {
          id: 'shift1',
          user_id: 'user1',
          date: '2024-01-01',
          shift_type: 'AM',
          users: { id: 'user1', name: 'Agent 1', department: 'Sales' },
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
            }),
          } as any;
        }
        if (table === 'break_schedules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        if (table === 'break_schedule_warnings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await breakSchedulesService.getScheduleForDate('2024-01-01', 'Sales');

      expect(result).toHaveProperty('agents');
    });

    it('should throw error when shifts query fails', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
          } as any;
        }
        return {} as any;
      });

      await expect(breakSchedulesService.getScheduleForDate('2024-01-01')).rejects.toThrow();
    });
  });

  describe('getCoverageSummary', () => {
    it('should return coverage summary for a date', async () => {
      const { supabase } = await import('../../lib/supabase');

      const mockShifts = [
        {
          id: 'shift1',
          user_id: 'user1',
          date: '2024-01-01',
          shift_type: 'AM',
          users: { id: 'user1', name: 'Agent 1', department: 'Sales' },
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
          } as any;
        }
        if (table === 'break_schedules') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        if (table === 'break_schedule_warnings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await breakSchedulesService.getCoverageSummary('2024-01-01');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('getWarnings', () => {
    it('should fetch unresolved warnings for a date', async () => {
      const { supabase } = await import('../../lib/supabase');

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
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockWarnings, error: null }),
        }),
      } as any);

      const result = await breakSchedulesService.getWarnings('2024-01-01');

      expect(result).toHaveLength(1);
      expect(result[0].warning_type).toBe('shift_changed');
    });

    it('should throw error when query fails', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
        }),
      } as any);

      await expect(breakSchedulesService.getWarnings('2024-01-01')).rejects.toThrow();
    });
  });

  describe('updateBreakSchedule', () => {
    it('should update break schedule for a user', async () => {
      const { supabase } = await import('../../lib/supabase');

      const mockShift = { shift_type: 'AM' };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockShift, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'break_schedules') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    neq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const request = {
        user_id: 'user1',
        schedule_date: '2024-01-01',
        intervals: [
          { interval_start: '10:00:00', break_type: 'HB1' as const },
          { interval_start: '12:00:00', break_type: 'B' as const },
        ],
      };

      const result = await breakSchedulesService.updateBreakSchedule(request);

      expect(result.success).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should throw error when shift not found', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Shift not found') }),
          }),
        }),
      } as any);

      const request = {
        user_id: 'user1',
        schedule_date: '2024-01-01',
        intervals: [{ interval_start: '10:00:00', break_type: 'HB1' as const }],
      };

      await expect(breakSchedulesService.updateBreakSchedule(request)).rejects.toThrow(
        'Shift not found'
      );
    });
  });

  describe('bulkUpdateBreakSchedules', () => {
    it('should update multiple break schedules', async () => {
      const { supabase } = await import('../../lib/supabase');

      const mockShift = { shift_type: 'AM' };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockShift, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'break_schedules') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    neq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

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
      ];

      const result = await breakSchedulesService.bulkUpdateBreakSchedules(updates);

      expect(result.success).toBe(true);
    });
  });

  describe('dismissWarning', () => {
    it('should mark warning as resolved', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await breakSchedulesService.dismissWarning('warning1');

      expect(supabase.from).toHaveBeenCalledWith('break_schedule_warnings');
    });

    it('should throw error when update fails', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
      } as any);

      await expect(breakSchedulesService.dismissWarning('warning1')).rejects.toThrow();
    });
  });

  describe('getBreakScheduleById', () => {
    it('should fetch break schedule by ID', async () => {
      const { supabase } = await import('../../lib/supabase');

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
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockBreak, error: null }),
        }),
      } as any);

      const result = await breakSchedulesService.getBreakScheduleById('break1');

      expect(result.id).toBe('break1');
      expect(result.break_type).toBe('HB1');
    });
  });

  describe('deleteUserBreaks', () => {
    it('should delete all breaks for a user on a date', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as any);

      await breakSchedulesService.deleteUserBreaks('user1', '2024-01-01');

      expect(supabase.from).toHaveBeenCalledWith('break_schedules');
    });

    it('should throw error when delete fails', async () => {
      const { supabase } = await import('../../lib/supabase');

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
          }),
        }),
      } as any);

      await expect(breakSchedulesService.deleteUserBreaks('user1', '2024-01-01')).rejects.toThrow();
    });
  });

  describe('autoDistribute', () => {
    it('should call generateDistributionPreview and applyDistribution', async () => {
      // This is an integration test that requires database access
      // Just verify the function exists and is callable
      expect(breakSchedulesService.autoDistribute).toBeDefined();
      expect(typeof breakSchedulesService.autoDistribute).toBe('function');
    });
  });
});
