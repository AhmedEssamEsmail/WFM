import { useState, useEffect, useCallback } from 'react'
import { AgentBreakSchedule, BreakType, BreakScheduleUpdateRequest } from '../../types'
import AgentRow from './AgentRow'
import CoverageCell from './CoverageCell'

interface BreakScheduleTableProps {
  schedules: AgentBreakSchedule[]
  intervals: string[]
  onUpdate?: (updates: BreakScheduleUpdateRequest[]) => Promise<void>
  isEditable?: boolean
  scheduleDate: string
}

export default function BreakScheduleTable({
  schedules,
  intervals,
  onUpdate,
  isEditable = false,
  scheduleDate,
}: BreakScheduleTableProps) {
  const [pendingUpdates, setPendingUpdates] = useState<BreakScheduleUpdateRequest[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Calculate coverage for each interval
  const getCoverageForInterval = (intervalStart: string): number => {
    return schedules.reduce((count, schedule) => {
      const breakType = schedule.intervals[intervalStart]
      return count + (breakType === 'IN' ? 1 : 0)
    }, 0)
  }

  // Auto-save with 500ms debounce
  useEffect(() => {
    if (pendingUpdates.length === 0) return

    const timer = setTimeout(async () => {
      if (onUpdate && pendingUpdates.length > 0) {
        setIsSaving(true)
        try {
          await onUpdate(pendingUpdates)
          setPendingUpdates([])
        } catch (error) {
          console.error('Failed to save updates:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [pendingUpdates, onUpdate])

  const handleBreakClick = useCallback(
    (userId: string, intervalStart: string, selectedBreakType: BreakType) => {
      if (!isEditable) return

      // Add to pending updates
      const update: BreakScheduleUpdateRequest = {
        user_id: userId,
        schedule_date: scheduleDate,
        intervals: [{
          interval_start: intervalStart + ':00', // Convert HH:MM to HH:MM:SS
          break_type: selectedBreakType,
        }],
      }

      setPendingUpdates(prev => {
        // Remove any existing update for this cell
        const filtered = prev.filter(
          u => !(u.user_id === userId && u.intervals.some(i => i.interval_start === intervalStart + ':00'))
        )
        return [...filtered, update]
      })
    },
    [isEditable, scheduleDate]
  )

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {isSaving && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
          Saving changes...
        </div>
      )}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  Agent Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] bg-gray-50"
                >
                  Shift
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] bg-gray-50"
                >
                  HB1 Start
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] bg-gray-50"
                >
                  B Start
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] bg-gray-50"
                >
                  HB2 Start
                </th>
                {intervals.map((interval) => (
                  <th
                    key={interval}
                    scope="col"
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px] bg-gray-50"
                  >
                    {interval}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Total IN summary row */}
              <tr className="bg-gray-100 font-semibold">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-sm text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  Total IN
                </th>
                <td className="px-4 py-3 text-center bg-gray-100">-</td>
                <td className="px-4 py-3 text-center bg-gray-100">-</td>
                <td className="px-4 py-3 text-center bg-gray-100">-</td>
                <td className="px-4 py-3 text-center bg-gray-100">-</td>
                {intervals.map((interval) => (
                  <td key={interval} className="px-2 py-3 text-center bg-gray-100">
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
  )
}
