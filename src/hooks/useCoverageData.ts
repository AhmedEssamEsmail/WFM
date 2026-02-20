import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { format, addDays } from 'date-fns';
import { getStartOfWeek } from '../utils/dateHelpers';

/**
 * Daily coverage data interface
 * Requirements: 4.3, 4.4
 */
export interface DailyCoverage {
  date: string; // ISO date
  dayName: string; // 'Mon', 'Tue', etc.
  scheduledCount: number;
  onLeaveCount: number;
  netCoverage: number;
  level: 'adequate' | 'low' | 'critical';
}

/**
 * Weekly coverage data interface
 */
export interface WeeklyCoverage {
  weekStart: string; // ISO date
  weekEnd: string; // ISO date
  days: DailyCoverage[];
}

/**
 * Hook to calculate weekly coverage data
 *
 * Calculation Logic:
 * - scheduledCount: Count of shifts for each day
 * - onLeaveCount: Count of employees on approved leave that overlaps each day
 * - netCoverage: scheduledCount - onLeaveCount
 * - level: 'adequate' if >= 20, 'low' if >= 15 and < 20, 'critical' if < 15
 *
 * Requirements:
 * - 4.2: Display bar chart showing staffing levels for each day of the current week (Monday through Sunday)
 * - 4.3: Calculate coverage as number of employees with assigned shifts minus those on approved leave
 * - 4.4: Use different colors to indicate coverage levels (adequate, low, critical)
 * - 4.5: Update coverage data when Dashboard is loaded or refreshed
 */
export function useCoverageData() {
  return useQuery({
    queryKey: [...queryKeys.settings(), 'coverage-data'],
    queryFn: async (): Promise<WeeklyCoverage> => {
      // Get current week range (Monday to Sunday)
      const weekStart = getStartOfWeek(new Date());
      const weekEnd = addDays(weekStart, 6); // Sunday

      const weekStartISO = format(weekStart, 'yyyy-MM-dd');
      const weekEndISO = format(weekEnd, 'yyyy-MM-dd');

      // Fetch shifts for the week
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('date, user_id')
        .gte('date', weekStartISO)
        .lte('date', weekEndISO);

      if (shiftsError) throw shiftsError;

      // Fetch approved leave requests that overlap with the week
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('leave_requests')
        .select('user_id, start_date, end_date')
        .eq('status', 'approved')
        .lte('start_date', weekEndISO)
        .gte('end_date', weekStartISO);

      if (leaveError) throw leaveError;

      // Calculate coverage for each day
      const days: DailyCoverage[] = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(weekStart, i);
        const dateISO = format(currentDate, 'yyyy-MM-dd');
        const dayName = dayNames[i];

        // Count shifts for this day
        const scheduledCount = shifts?.filter((s) => s.date === dateISO).length || 0;

        // Count employees on approved leave for this day
        const onLeaveCount =
          leaveRequests?.filter((lr) => dateISO >= lr.start_date && dateISO <= lr.end_date)
            .length || 0;

        // Calculate net coverage
        const netCoverage = scheduledCount - onLeaveCount;

        // Determine coverage level: Red (<8), Yellow (8-12), Green (>12)
        const level: 'adequate' | 'low' | 'critical' =
          netCoverage > 12 ? 'adequate' : netCoverage >= 8 ? 'low' : 'critical';

        days.push({
          date: dateISO,
          dayName,
          scheduledCount,
          onLeaveCount,
          netCoverage,
          level,
        });
      }

      return {
        weekStart: weekStartISO,
        weekEnd: weekEndISO,
        days,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - coverage data should be relatively fresh
  });
}
