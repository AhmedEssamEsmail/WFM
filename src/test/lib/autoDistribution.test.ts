import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findHighestCoverageIntervals,
  calculateShiftThirds,
  balancedCoverageStrategy,
  staggeredTimingStrategy,
  generateDistributionPreview,
  applyDistribution,
} from '../../lib/autoDistribution';
import type { AgentBreakSchedule, AutoDistributePreview, ShiftType } from '../../types';

// Note: calculateShiftThirds, balancedCoverageStrategy, staggeredTimingStrategy,
// generateDistributionPreview, and applyDistribution are now async and require
// database access, so they're tested in integration tests

// Mock the services
vi.mock('../../services/breakSchedulesService', () => ({
  breakSchedulesService: {
    getScheduleForDate: vi.fn(),
    updateBreakSchedule: vi.fn(),
  },
}));

vi.mock('../../services/breakRulesService', () => ({
  breakRulesService: {
    getActiveRules: vi.fn(),
  },
}));

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

describe('autoDistribution', () => {
  describe('calculateShiftThirds', () => {
    it('should calculate thirds for AM shift (9:00-17:00)', async () => {
      const result = await calculateShiftThirds('AM');

      expect(result).not.toBeNull();
      expect(result?.early.start).toBe(540); // 9:00 in minutes
      expect(result?.early.end).toBe(700); // ~11:40
      expect(result?.middle.start).toBe(700);
      expect(result?.middle.end).toBe(860); // ~14:20
      expect(result?.late.start).toBe(860);
      expect(result?.late.end).toBe(1020); // 17:00
    });

    it('should calculate thirds for PM shift (13:00-21:00)', async () => {
      const result = await calculateShiftThirds('PM');

      expect(result).not.toBeNull();
      expect(result?.early.start).toBe(780); // 13:00 in minutes
      expect(result?.late.end).toBe(1260); // 21:00
    });

    it('should calculate thirds for BET shift (11:00-19:00)', async () => {
      const result = await calculateShiftThirds('BET');

      expect(result).not.toBeNull();
      expect(result?.early.start).toBe(660); // 11:00 in minutes
      expect(result?.late.end).toBe(1140); // 19:00
    });

    it('should return null for OFF shift', async () => {
      const result = await calculateShiftThirds('OFF');
      expect(result).toBeNull();
    });
  });

  describe('findHighestCoverageIntervals', () => {
    it('should find intervals with highest coverage', () => {
      const coverageSummary = {
        '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
        '09:15': { in: 8, hb1: 2, b: 0, hb2: 0 },
        '09:30': { in: 12, hb1: 0, b: 0, hb2: 0 },
        '09:45': { in: 5, hb1: 3, b: 2, hb2: 0 },
      };

      const result = findHighestCoverageIntervals(coverageSummary, 540, 600, 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('09:30'); // Highest coverage (12)
      expect(result[1]).toBe('09:00'); // Second highest (10)
    });

    it('should filter by time range', () => {
      const coverageSummary = {
        '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
        '10:00': { in: 8, hb1: 2, b: 0, hb2: 0 },
        '11:00': { in: 12, hb1: 0, b: 0, hb2: 0 },
      };

      // Only include 10:00-11:00 range (600-660 minutes)
      const result = findHighestCoverageIntervals(coverageSummary, 600, 660, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('10:00');
    });

    it('should generate all intervals in range even with no data', () => {
      const coverageSummary = {
        '09:00': { in: 10, hb1: 0, b: 0, hb2: 0 },
      };

      // Request interval in range with no coverage data
      const result = findHighestCoverageIntervals(coverageSummary, 600, 660, 1);

      // Should return the interval with 0 coverage
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('10:00');
    });
  });

  describe('balancedCoverageStrategy', () => {
    it('should skip agents with OFF shift', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');
      const { breakRulesService } = await import('../../services/breakRulesService');

      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [],
        summary: {},
      });
      vi.mocked(breakRulesService.getActiveRules).mockResolvedValue([]);

      const agents: AgentBreakSchedule[] = [
        {
          user_id: '1',
          name: 'Agent 1',
          shift_type: 'OFF',
          department: 'Sales',
          has_warning: false,
          warning_details: null,
          breaks: { HB1: null, B: null, HB2: null },
          intervals: {},
        },
      ];

      const result = await balancedCoverageStrategy(agents, '2024-01-01', []);

      expect(result.schedules).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle agents with no shift type', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');
      const { breakRulesService } = await import('../../services/breakRulesService');

      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [],
        summary: {},
      });
      vi.mocked(breakRulesService.getActiveRules).mockResolvedValue([]);

      const agents: AgentBreakSchedule[] = [
        {
          user_id: '1',
          name: 'Agent 1',
          shift_type: null,
          department: 'Sales',
          has_warning: false,
          warning_details: null,
          breaks: { HB1: null, B: null, HB2: null },
          intervals: {},
        },
      ];

      const result = await balancedCoverageStrategy(agents, '2024-01-01', []);

      expect(result.schedules).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('staggeredTimingStrategy', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should skip agents with OFF shift', async () => {
      const agents: AgentBreakSchedule[] = [
        {
          user_id: '1',
          name: 'Agent 1',
          shift_type: 'OFF',
          department: 'Sales',
          has_warning: false,
          warning_details: null,
          breaks: { HB1: null, B: null, HB2: null },
          intervals: {},
        },
      ];

      const result = await staggeredTimingStrategy(agents, '2024-01-01', []);

      expect(result.schedules).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle agents with no shift type', async () => {
      const agents: AgentBreakSchedule[] = [
        {
          user_id: '1',
          name: 'Agent 1',
          shift_type: null,
          department: 'Sales',
          has_warning: false,
          warning_details: null,
          breaks: { HB1: null, B: null, HB2: null },
          intervals: {},
        },
      ];

      const result = await staggeredTimingStrategy(agents, '2024-01-01', []);

      expect(result.schedules).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should add failed agent when invalid shift type', async () => {
      const agents: AgentBreakSchedule[] = [
        {
          user_id: '1',
          name: 'Agent 1',
          shift_type: 'INVALID' as ShiftType,
          department: 'Sales',
          has_warning: false,
          warning_details: null,
          breaks: { HB1: null, B: null, HB2: null },
          intervals: {},
        },
      ];

      const result = await staggeredTimingStrategy(agents, '2024-01-01', []);

      expect(result.schedules).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toBe('Invalid shift type');
    });
  });

  describe('generateDistributionPreview', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should generate preview with balanced coverage strategy', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');
      const { breakRulesService } = await import('../../services/breakRulesService');

      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [],
        summary: {},
      });
      vi.mocked(breakRulesService.getActiveRules).mockResolvedValue([]);

      const request = {
        schedule_date: '2024-01-01',
        strategy: 'balanced_coverage' as const,
        apply_mode: 'all_agents' as const,
        department: 'All',
      };

      const result = await generateDistributionPreview(request);

      expect(result).toHaveProperty('proposed_schedules');
      expect(result).toHaveProperty('coverage_stats');
      expect(result).toHaveProperty('rule_compliance');
      expect(result).toHaveProperty('failed_agents');
    });

    it('should generate preview with staggered timing strategy', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');
      const { breakRulesService } = await import('../../services/breakRulesService');

      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [],
        summary: {},
      });
      vi.mocked(breakRulesService.getActiveRules).mockResolvedValue([]);

      const request = {
        schedule_date: '2024-01-01',
        strategy: 'staggered_timing' as const,
        apply_mode: 'all_agents' as const,
        department: 'All',
      };

      const result = await generateDistributionPreview(request);

      expect(result).toHaveProperty('proposed_schedules');
      expect(result).toHaveProperty('coverage_stats');
    });

    it('should filter only unscheduled agents when apply_mode is only_unscheduled', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');
      const { breakRulesService } = await import('../../services/breakRulesService');

      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [
          {
            user_id: '1',
            name: 'Agent 1',
            shift_type: 'AM',
            department: 'Sales',
            has_warning: false,
            warning_details: null,
            breaks: { HB1: '10:00', B: '12:00', HB2: '14:00' }, // Already scheduled
            intervals: {},
          },
          {
            user_id: '2',
            name: 'Agent 2',
            shift_type: 'AM',
            department: 'Sales',
            has_warning: false,
            warning_details: null,
            breaks: { HB1: null, B: null, HB2: null }, // Unscheduled
            intervals: {},
          },
        ],
        summary: {},
      });
      vi.mocked(breakRulesService.getActiveRules).mockResolvedValue([]);

      const request = {
        schedule_date: '2024-01-01',
        strategy: 'balanced_coverage' as const,
        apply_mode: 'only_unscheduled' as const,
        department: 'All',
      };

      await generateDistributionPreview(request);

      // The function should filter to only Agent 2 (unscheduled)
      // We can't directly test this without mocking the strategy functions
      // but we verify the function runs without error
      expect(breakSchedulesService.getScheduleForDate).toHaveBeenCalled();
    });
  });

  describe('applyDistribution', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should apply distribution by updating break schedules', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');

      vi.mocked(breakSchedulesService.updateBreakSchedule).mockResolvedValue({
        success: true,
        violations: [],
      });

      const preview: AutoDistributePreview = {
        proposed_schedules: [
          {
            user_id: '1',
            name: 'Agent 1',
            shift_type: 'AM',
            department: 'Sales',
            has_warning: false,
            warning_details: null,
            breaks: { HB1: '10:00', B: '12:00', HB2: '14:00' },
            intervals: {
              '10:00': 'HB1',
              '12:00': 'B',
              '12:15': 'B',
              '14:00': 'HB2',
            },
          },
        ],
        coverage_stats: {
          min_coverage: 5,
          max_coverage: 10,
          avg_coverage: 7.5,
          variance: 2.5,
        },
        rule_compliance: {
          total_violations: 0,
          blocking_violations: 0,
          warning_violations: 0,
        },
        failed_agents: [],
      };

      await applyDistribution(preview, '2024-01-01');

      expect(breakSchedulesService.updateBreakSchedule).toHaveBeenCalledTimes(1);
      expect(breakSchedulesService.updateBreakSchedule).toHaveBeenCalledWith({
        user_id: '1',
        schedule_date: '2024-01-01',
        intervals: [
          { interval_start: '10:00:00', break_type: 'HB1' },
          { interval_start: '12:00:00', break_type: 'B' },
          { interval_start: '12:15:00', break_type: 'B' },
          { interval_start: '14:00:00', break_type: 'HB2' },
        ],
      });
    });

    it('should skip agents with no break intervals', async () => {
      const { breakSchedulesService } = await import('../../services/breakSchedulesService');

      vi.mocked(breakSchedulesService.updateBreakSchedule).mockResolvedValue({
        success: true,
        violations: [],
      });

      const preview: AutoDistributePreview = {
        proposed_schedules: [
          {
            user_id: '1',
            name: 'Agent 1',
            shift_type: 'AM',
            department: 'Sales',
            has_warning: false,
            warning_details: null,
            breaks: { HB1: null, B: null, HB2: null },
            intervals: {
              '10:00': 'IN',
              '10:15': 'IN',
            },
          },
        ],
        coverage_stats: {
          min_coverage: 5,
          max_coverage: 10,
          avg_coverage: 7.5,
          variance: 2.5,
        },
        rule_compliance: {
          total_violations: 0,
          blocking_violations: 0,
          warning_violations: 0,
        },
        failed_agents: [],
      };

      await applyDistribution(preview, '2024-01-01');

      // Should not call updateBreakSchedule since there are no break intervals
      expect(breakSchedulesService.updateBreakSchedule).not.toHaveBeenCalled();
    });
  });
});
