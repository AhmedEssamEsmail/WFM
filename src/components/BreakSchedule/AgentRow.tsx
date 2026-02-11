import { AgentBreakSchedule } from '../../types'
import { SHIFT_COLORS, SHIFT_LABELS } from '../../lib/designSystem'
import BreakCell from './BreakCell'

interface AgentRowProps {
  schedule: AgentBreakSchedule
  intervals: string[]
  onBreakClick?: (intervalStart: string) => void
  selectedIntervals?: Set<string>
  isEditable?: boolean
}

export default function AgentRow({
  schedule,
  intervals,
  onBreakClick,
  selectedIntervals = new Set(),
  isEditable = false,
}: AgentRowProps) {
  const hasWarning = schedule.has_warning

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (time: string | null) => {
    if (!time) return '-'
    return time.substring(0, 5) // Extract HH:MM from HH:MM:SS
  }

  return (
    <tr className="hover:bg-gray-50">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-2">
          <span>{schedule.name}</span>
          {hasWarning && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold"
              title="Has unresolved warnings"
              aria-label="Warning indicator"
            >
              !
            </span>
          )}
        </div>
      </th>
      <td className="px-4 py-3 text-center text-sm">
        {schedule.shift_type && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SHIFT_COLORS[schedule.shift_type]}`}>
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
      {intervals.map((intervalStart) => {
        const breakType = schedule.intervals[intervalStart] || null
        
        return (
          <td key={intervalStart} className="px-2 py-3 text-center">
            <BreakCell
              breakType={breakType}
              onClick={() => onBreakClick?.(intervalStart)}
              isSelected={selectedIntervals.has(intervalStart)}
              violations={[]}
              isEditable={isEditable}
            />
          </td>
        )
      })}
    </tr>
  )
}
