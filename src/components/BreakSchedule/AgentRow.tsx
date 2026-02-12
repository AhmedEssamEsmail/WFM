import type { AgentBreakSchedule, BreakType } from '../../types'
import { SHIFT_COLORS, SHIFT_LABELS } from '../../lib/designSystem'
import BreakCell from './BreakCell'

interface AgentRowProps {
  schedule: AgentBreakSchedule
  intervals: string[]
  onBreakClick?: (intervalStart: string, breakType: BreakType) => void
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
  
  // Check if agent has no breaks assigned
  const hasNoBreaks = !schedule.breaks?.HB1 && !schedule.breaks?.B && !schedule.breaks?.HB2
  
  // Get failure reason from auto_distribution_failure field if available
  const failureReason = schedule.auto_distribution_failure || 
                        'No breaks assigned during auto-distribution'

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (time: string | null) => {
    if (!time) return '-'
    return time.substring(0, 5) // Extract HH:MM from HH:MM:SS
  }

  return (
    <tr className="hover:bg-gray-50">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-2 relative">
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
          {hasNoBreaks && schedule.shift_type && schedule.shift_type !== 'OFF' && (
            <div className="group relative inline-flex">
              <span
                className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-800 rounded-full text-xs font-bold cursor-help"
                aria-label="No breaks assigned"
              >
                ✕
              </span>
              <div className="pointer-events-none absolute left-full bottom-full mb-2 -ml-16 z-50 w-80 scale-0 transition-all duration-150 group-hover:scale-100">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-3 px-4 shadow-xl">
                  <div className="font-semibold mb-2 text-red-300">Auto-distribution failed</div>
                  <div className="whitespace-pre-wrap break-words leading-relaxed">{failureReason}</div>
                  <div className="absolute bottom-3 left-16 w-3 h-3 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>
            </div>
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
              onClick={(selectedBreakType) => onBreakClick?.(intervalStart, selectedBreakType)}
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
