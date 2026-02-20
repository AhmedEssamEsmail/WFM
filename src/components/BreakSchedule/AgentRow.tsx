import type { AgentBreakSchedule, BreakType } from '../../types';
import { SHIFT_COLORS, SHIFT_LABELS } from '../../lib/designSystem';
import BreakCell from './BreakCell';

interface AgentRowProps {
  schedule: AgentBreakSchedule;
  intervals: string[];
  onBreakClick?: (intervalStart: string, breakType: BreakType) => void;
  selectedIntervals?: Set<string>;
  isEditable?: boolean;
}

export default function AgentRow({
  schedule,
  intervals,
  onBreakClick,
  selectedIntervals = new Set(),
  isEditable = false,
}: AgentRowProps) {
  const hasWarning = schedule.has_warning;

  // Check if agent has no breaks assigned
  const hasNoBreaks = !schedule.breaks?.HB1 && !schedule.breaks?.B && !schedule.breaks?.HB2;

  // Get failure reason from auto_distribution_failure field if available
  const failureReason =
    schedule.auto_distribution_failure || 'No breaks assigned during auto-distribution';

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  return (
    <tr className="hover:bg-gray-50">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
      >
        <div className="relative flex items-center gap-2">
          <span>{schedule.name}</span>
          {hasWarning && (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-800"
              title="Has unresolved warnings"
              aria-label="Warning indicator"
            >
              !
            </span>
          )}
          {hasNoBreaks && schedule.shift_type && schedule.shift_type !== 'OFF' && (
            <div className="group relative inline-flex">
              <span
                className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-800"
                aria-label="No breaks assigned"
              >
                ✕
              </span>
              <div className="pointer-events-none absolute bottom-full left-full z-50 -ml-16 mb-2 w-80 scale-0 transition-all duration-150 group-hover:scale-100">
                <div className="rounded-lg bg-gray-900 px-4 py-3 text-xs text-white shadow-xl">
                  <div className="mb-2 font-semibold text-red-300">Auto-distribution failed</div>
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {failureReason}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </th>
      <td className="px-4 py-3 text-center text-sm">
        {schedule.shift_type && (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${SHIFT_COLORS[schedule.shift_type]}`}
          >
            {SHIFT_LABELS[schedule.shift_type]}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-900">
        {formatTime(schedule.breaks?.HB1 || null)}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-900">
        {formatTime(schedule.breaks?.B || null)}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-900">
        {formatTime(schedule.breaks?.HB2 || null)}
      </td>
      {intervals.map((intervalStart, index) => {
        const breakType = schedule.intervals[intervalStart] || null;

        // Skip rendering if this interval is the second part of a 30-minute break
        if (index > 0) {
          const prevInterval = intervals[index - 1];
          const prevBreakType = schedule.intervals[prevInterval];
          if (prevBreakType === 'B' && breakType === 'B') {
            return null;
          }
        }

        // Check if this is the start of a 30-minute break (Break B)
        const isBreakBStart = breakType === 'B' && index < intervals.length - 1;
        const nextInterval = isBreakBStart ? intervals[index + 1] : null;
        const nextBreakType = nextInterval ? schedule.intervals[nextInterval] : null;
        const colspan = isBreakBStart && nextBreakType === 'B' ? 2 : 1;

        return (
          <td key={intervalStart} className="px-2 py-3 text-center" colSpan={colspan}>
            <BreakCell
              breakType={breakType}
              onClick={(selectedBreakType) => onBreakClick?.(intervalStart, selectedBreakType)}
              isSelected={selectedIntervals.has(intervalStart)}
              violations={[]}
              isEditable={isEditable}
            />
          </td>
        );
      })}
    </tr>
  );
}
