import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBreakSchedules } from '../../../hooks/useBreakSchedules';
import { breakSchedulesService } from '../../../services/breakSchedulesService';
import type { AutoDistributePreview } from '../../../types';

vi.mock('../../../services/breakSchedulesService');
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useBreakSchedules - Comprehensive Coverage', () => {
  const mockDate = '2024-01-15';
  const mockScheduleData = {
    agents: [
      {
        user_id: '1',
        name: 'John Doe',
        shift_type: 'AM' as const,
        department: 'Sales',
        has_warning: false,
        warning_details: null,
        breaks: {
          HB1: '10:00:00',
          B: '12:00:00',
          HB2: '14:00:00',
        },
        intervals: {
          '10:00': 'HB1' as const,
          '12:00': 'B' as const,
          '14:00': 'HB2' as const,
        },
      },
    ],
    summary: {
      '10:00': { in: 10, hb1: 1, b: 0, hb2: 0 },
      '12:00': { in: 10, hb1: 0, b: 1, hb2: 0 },
      '14:00': { in: 10, hb1: 0, b: 0, hb2: 1 },
    },
  };

  const mockWarnings = [
    {
      id: 'w1',
      user_id: '1',
      schedule_date: mockDate,
      warning_type: 'shift_changed' as const,
      old_shift_type: 'AM' as const,
      new_shift_type: 'PM' as const,
      is_resolved: false,
      created_at: '2024-01-15T08:00:00Z',
    },
  ];

  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Query Operations', () => {
    it('should fetch schedule data for given date', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue(mockWarnings);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules).toEqual(mockScheduleData.agents);
      expect(result.current.coverageSummary).toEqual(mockScheduleData.summary);
      expect(breakSchedulesService.getScheduleForDate).toHaveBeenCalledWith(mockDate);
    });

    it('should fetch warnings for given date', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue(mockWarnings);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.warnings).toEqual(mockWarnings);
      });

      expect(breakSchedulesService.getWarnings).toHaveBeenCalledWith(mockDate);
    });

    it('should handle empty schedule data', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [],
        summary: {},
      });
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules).toEqual([]);
      expect(result.current.coverageSummary).toEqual({});
      expect(result.current.warnings).toEqual([]);
    });

    it('should handle schedule fetch errors', async () => {
      const error = new Error('Network error');
      vi.mocked(breakSchedulesService.getScheduleForDate).mockRejectedValue(error);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle warnings fetch errors gracefully', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockRejectedValue(new Error('Warning error'));

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.schedules).toEqual(mockScheduleData.agents);
      });
    });
  });

  describe('Mutation Operations', () => {
    describe('updateBreakSchedules', () => {
      it('should update break schedules successfully', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.bulkUpdateBreakSchedules).mockResolvedValue({
          success: true,
          violations: [],
        });

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const updates = [
          {
            user_id: '1',
            schedule_date: mockDate,
            intervals: [
              {
                interval_start: '10:30',
                break_type: 'HB1' as const,
              },
            ],
          },
        ];

        result.current.updateBreakSchedules.mutate(updates);

        await waitFor(() => {
          expect(breakSchedulesService.bulkUpdateBreakSchedules).toHaveBeenCalledWith(updates);
        });
      });

      it('should handle update errors', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.bulkUpdateBreakSchedules).mockRejectedValue(
          new Error('Update failed')
        );

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const updates = [
          {
            user_id: '1',
            schedule_date: mockDate,
            intervals: [
              {
                interval_start: '10:30',
                break_type: 'HB1' as const,
              },
            ],
          },
        ];

        result.current.updateBreakSchedules.mutate(updates);

        await waitFor(() => {
          expect(result.current.updateBreakSchedules.isError).toBe(true);
        });
      });

      it('should invalidate queries on successful update', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.bulkUpdateBreakSchedules).mockResolvedValue({
          success: true,
          violations: [],
        });

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const updates = [
          {
            user_id: '1',
            schedule_date: mockDate,
            intervals: [
              {
                interval_start: '10:30',
                break_type: 'HB1' as const,
              },
            ],
          },
        ];

        result.current.updateBreakSchedules.mutate(updates);

        await waitFor(() => {
          expect(invalidateSpy).toHaveBeenCalled();
        });
      });
    });

    describe('dismissWarning', () => {
      it('should dismiss warning successfully', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue(mockWarnings);
        vi.mocked(breakSchedulesService.dismissWarning).mockResolvedValue(undefined);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        result.current.dismissWarning.mutate('w1');

        await waitFor(() => {
          expect(breakSchedulesService.dismissWarning).toHaveBeenCalledWith('w1');
        });
      });

      it('should handle dismiss warning errors', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue(mockWarnings);
        vi.mocked(breakSchedulesService.dismissWarning).mockRejectedValue(
          new Error('Dismiss failed')
        );

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        result.current.dismissWarning.mutate('w1');

        await waitFor(() => {
          expect(result.current.dismissWarning.isError).toBe(true);
        });
      });

      it('should invalidate warnings query on successful dismiss', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue(mockWarnings);
        vi.mocked(breakSchedulesService.dismissWarning).mockResolvedValue(undefined);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        result.current.dismissWarning.mutate('w1');

        await waitFor(() => {
          expect(invalidateSpy).toHaveBeenCalled();
        });
      });
    });

    describe('autoDistribute', () => {
      const mockPreview: AutoDistributePreview = {
        proposed_schedules: mockScheduleData.agents,
        coverage_stats: {
          min_coverage: 8,
          max_coverage: 10,
          avg_coverage: 9,
          variance: 0.5,
        },
        rule_compliance: {
          total_violations: 0,
          blocking_violations: 0,
          warning_violations: 0,
        },
        failed_agents: [],
      };

      it('should auto-distribute breaks successfully', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.autoDistribute).mockResolvedValue(mockPreview);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const request = {
          schedule_date: mockDate,
          strategy: 'balanced_coverage' as const,
          apply_mode: 'only_unscheduled' as const,
        };

        result.current.autoDistribute.mutate(request);

        await waitFor(() => {
          expect(breakSchedulesService.autoDistribute).toHaveBeenCalledWith(request);
        });
      });

      it('should handle auto-distribute with different strategies', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.autoDistribute).mockResolvedValue(mockPreview);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const strategies = ['balanced_coverage', 'staggered_timing', 'ladder'] as const;

        for (const strategy of strategies) {
          const request = {
            schedule_date: mockDate,
            strategy,
            apply_mode: 'only_unscheduled' as const,
          };

          result.current.autoDistribute.mutate(request);

          await waitFor(() => {
            expect(breakSchedulesService.autoDistribute).toHaveBeenCalledWith(request);
          });
        }
      });

      it('should handle auto-distribute errors', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.autoDistribute).mockRejectedValue(
          new Error('Distribution failed')
        );

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const request = {
          schedule_date: mockDate,
          strategy: 'balanced_coverage' as const,
          apply_mode: 'only_unscheduled' as const,
        };

        result.current.autoDistribute.mutate(request);

        await waitFor(() => {
          expect(result.current.autoDistribute.isError).toBe(true);
        });
      });

      it('should invalidate queries on successful auto-distribute', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.autoDistribute).mockResolvedValue(mockPreview);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const request = {
          schedule_date: mockDate,
          strategy: 'balanced_coverage' as const,
          apply_mode: 'only_unscheduled' as const,
        };

        result.current.autoDistribute.mutate(request);

        await waitFor(() => {
          expect(invalidateSpy).toHaveBeenCalled();
        });
      });
    });

    describe('clearAllBreaks', () => {
      it('should clear all breaks successfully', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.clearAllBreaksForDate).mockResolvedValue(undefined);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        result.current.clearAllBreaks.mutate(mockDate);

        await waitFor(() => {
          expect(breakSchedulesService.clearAllBreaksForDate).toHaveBeenCalledWith(mockDate);
        });
      });

      it('should handle clear breaks errors', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.clearAllBreaksForDate).mockRejectedValue(
          new Error('Clear failed')
        );

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        result.current.clearAllBreaks.mutate(mockDate);

        await waitFor(() => {
          expect(result.current.clearAllBreaks.isError).toBe(true);
        });
      });

      it('should invalidate queries on successful clear', async () => {
        vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
        vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);
        vi.mocked(breakSchedulesService.clearAllBreaksForDate).mockResolvedValue(undefined);

        const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        result.current.clearAllBreaks.mutate(mockDate);

        await waitFor(() => {
          expect(invalidateSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Interval Generation', () => {
    it('should generate 15-minute intervals from 9:00 AM to 9:00 PM', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.intervals).toBeDefined();
      });

      const intervals = result.current.intervals;
      expect(intervals[0]).toBe('09:00');
      expect(intervals[intervals.length - 1]).toBe('20:45');
      expect(intervals).toHaveLength(48); // 12 hours * 4 intervals per hour
    });

    it('should generate intervals in correct order', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.intervals).toBeDefined();
      });

      const intervals = result.current.intervals;

      // Check first hour intervals
      expect(intervals[0]).toBe('09:00');
      expect(intervals[1]).toBe('09:15');
      expect(intervals[2]).toBe('09:30');
      expect(intervals[3]).toBe('09:45');

      // Check last hour intervals
      expect(intervals[44]).toBe('20:00');
      expect(intervals[45]).toBe('20:15');
      expect(intervals[46]).toBe('20:30');
      expect(intervals[47]).toBe('20:45');
    });

    it('should generate intervals with proper formatting', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.intervals).toBeDefined();
      });

      const intervals = result.current.intervals;

      // All intervals should be in HH:MM format
      intervals.forEach((interval) => {
        expect(interval).toMatch(/^\d{2}:\d{2}$/);
      });
    });
  });

  describe('Warning Management', () => {
    it('should handle multiple warnings', async () => {
      const multipleWarnings = [
        {
          id: 'w1',
          user_id: '1',
          schedule_date: mockDate,
          warning_type: 'shift_changed' as const,
          old_shift_type: 'AM' as const,
          new_shift_type: 'PM' as const,
          is_resolved: false,
          created_at: '2024-01-15T08:00:00Z',
        },
        {
          id: 'w2',
          user_id: '2',
          schedule_date: mockDate,
          warning_type: 'shift_changed' as const,
          old_shift_type: 'PM' as const,
          new_shift_type: 'AM' as const,
          is_resolved: false,
          created_at: '2024-01-15T09:00:00Z',
        },
      ];

      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue(multipleWarnings);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.warnings).toHaveLength(2);
      });

      expect(result.current.warnings).toEqual(multipleWarnings);
    });

    it('should handle empty warnings', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.warnings).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle null schedule data', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue({
        agents: [],
        summary: {},
      });
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules).toEqual([]);
      expect(result.current.coverageSummary).toEqual({});
    });

    it('should expose queryClient for manual invalidation', async () => {
      vi.mocked(breakSchedulesService.getScheduleForDate).mockResolvedValue(mockScheduleData);
      vi.mocked(breakSchedulesService.getWarnings).mockResolvedValue([]);

      const { result } = renderHook(() => useBreakSchedules(mockDate), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.queryClient).toBeDefined();
      expect(result.current.queryClient).toBe(queryClient);
    });
  });
});
