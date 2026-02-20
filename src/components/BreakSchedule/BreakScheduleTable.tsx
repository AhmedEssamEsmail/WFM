import { useState, useEffect, useCallback } from 'react';
import type { AgentBreakSchedule, BreakType, BreakScheduleUpdateRequest } from '../../types';
import AgentRow from './AgentRow';
import CoverageCell from './CoverageCell';

interface BreakScheduleTableProps {
  schedules: AgentBreakSchedule[];
  intervals: string[];
  onUpdate?: (updates: BreakScheduleUpdateRequest[]) => Promise<void>;
  isEditable?: boolean;
  scheduleDate: string;
}

export default function BreakScheduleTable({
  schedules,
  intervals,
  onUpdate,
  isEditable = false,
  scheduleDate,
}: BreakScheduleTableProps) {
  const [pendingUpdates, setPendingUpdates] = useState<BreakScheduleUpdateRequest[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate coverage for each interval
  const getCoverageForInterval = (intervalStart: string): number => {
    return schedules.reduce((count, schedule) => {
      const breakType = schedule.intervals[intervalStart];
      return count + (breakType === 'IN' ? 1 : 0);
    }, 0);
  };

  // Auto-save with 500ms debounce
  useEffect(() => {
    if (pendingUpdates.length === 0) return;

    const timer = setTimeout(async () => {
      if (onUpdate && pendingUpdates.length > 0) {
        setIsSaving(true);
        try {
          // Merge all updates for the same user into single requests
          const merged = mergePendingUpdates(pendingUpdates);
          await onUpdate(merged);
          setPendingUpdates([]);
        } catch (error) {
          console.error('Failed to save updates:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pendingUpdates, onUpdate]);

  /**
   * Merge pending updates for the same user into single requests
   * This prevents multiple toast notifications when placing B breaks (2 intervals)
   */
  const mergePendingUpdates = (
    updates: BreakScheduleUpdateRequest[]
  ): BreakScheduleUpdateRequest[] => {
    const byUser = new Map<string, BreakScheduleUpdateRequest>();

    for (const update of updates) {
      const existing = byUser.get(update.user_id);
      if (existing) {
        // Merge intervals, avoiding duplicates
        const existingIntervalKeys = new Set(existing.intervals.map((i) => i.interval_start));
        for (const interval of update.intervals) {
          if (!existingIntervalKeys.has(interval.interval_start)) {
            existing.intervals.push(interval);
          }
        }
      } else {
        byUser.set(update.user_id, { ...update, intervals: [...update.intervals] });
      }
    }

    return Array.from(byUser.values());
  };

  const handleBreakClick = useCallback(
    (userId: string, intervalStart: string, selectedBreakType: BreakType) => {
      if (!isEditable) return;

      // Add to pending updates
      const update: BreakScheduleUpdateRequest = {
        user_id: userId,
        schedule_date: scheduleDate,
        intervals: [
          {
            interval_start: intervalStart + ':00', // Convert HH:MM to HH:MM:SS
            break_type: selectedBreakType,
          },
        ],
      };

      setPendingUpdates((prev) => {
        // Remove any existing update for this cell
        const filtered = prev.filter(
          (u) =>
            !(
              u.user_id === userId &&
              u.intervals.some((i) => i.interval_start === intervalStart + ':00')
            )
        );
        return [...filtered, update];
      });
    },
    [isEditable, scheduleDate]
  );

  return (
    <div className="w-full overflow-hidden rounded-lg bg-white shadow">
      {isSaving && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Saving changes...
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table
            className="min-w-full table-fixed divide-y divide-gray-200"
            style={{ width: 'max-content' }}
          >
            <thead className="sticky top-0 z-20 bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-30 min-w-[209px] bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  Agent Name
                </th>
                <th
                  scope="col"
                  className="min-w-[80px] bg-gray-50 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Shift
                </th>
                <th
                  scope="col"
                  className="min-w-[80px] bg-gray-50 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  HB1 Start
                </th>
                <th
                  scope="col"
                  className="min-w-[80px] bg-gray-50 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  B Start
                </th>
                <th
                  scope="col"
                  className="min-w-[80px] bg-gray-50 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  HB2 Start
                </th>
                {intervals.map((interval) => (
                  <th
                    key={interval}
                    scope="col"
                    className="min-w-[70px] bg-gray-50 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {interval}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* Total IN summary row */}
              <tr className="bg-gray-100 font-semibold">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-sm text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  Total IN
                </th>
                <td className="bg-gray-100 px-4 py-3 text-center">-</td>
                <td className="bg-gray-100 px-4 py-3 text-center">-</td>
                <td className="bg-gray-100 px-4 py-3 text-center">-</td>
                <td className="bg-gray-100 px-4 py-3 text-center">-</td>
                {intervals.map((interval) => (
                  <td key={interval} className="bg-gray-100 px-2 py-3 text-center">
                    <CoverageCell count={getCoverageForInterval(interval)} />
                  </td>
                ))}
              </tr>

              {/* Agent rows */}
              {schedules.map((schedule) => (
                <AgentRow
                  key={schedule.user_id}
                  schedule={schedule}
                  intervals={intervals}
                  onBreakClick={(intervalStart, breakType) =>
                    handleBreakClick(schedule.user_id, intervalStart, breakType)
                  }
                  selectedIntervals={new Set()}
                  isEditable={isEditable}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
