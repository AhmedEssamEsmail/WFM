import { useState, useEffect, useCallback } from 'react'
import { AgentBreakSchedule, BreakType, BreakScheduleUpdateRequest } from '../../types'
import AgentRow from './AgentRow'
import CoverageCell from './CoverageCell'

interface BreakScheduleTableProps {
  schedules: AgentBreakSchedule[]
  intervals: string[]
  onUpdate?: (updates: BreakScheduleUpdateRequest[]) => Promise<void>
  isEditable?: boolean
}

const BREAK_TYPE_CYCLE: (BreakType | null)[] = [null, 'HB1', 'B', 'HB2', 'IN']

export default function BreakScheduleTable({
  schedules,
  intervals,
  onUpdate,
  isEditable = false,
}: BreakScheduleTableProps) {
  const [selectedCells, setSelectedCells] = useState<Map<string, Set<string>>>(new Map())
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
    (userId: string, intervalStart: string, event?: React.MouseEvent) => {
      if (!isEditable) return

      const schedule = schedules.find(s => s.user_id === userId)
      if (!schedule) return

      const currentType = schedule.intervals[intervalStart] || null

      // Cycle to next break type
      const currentIndex = BREAK_TYPE_CYCLE.indexOf(currentType)
      const nextType = BREAK_TYPE_CYCLE[(currentIndex + 1) % BREAK_TYPE_CYCLE.length]

      // Add to pending updates
      const update: BreakScheduleUpdateRequest = {
        user_id: userId,
        schedule_date: '', // Will be set by parent
        intervals: [{
          interval_start: intervalStart,
          break_type: nextType || 'IN',
        }],
      }

      setPendingUpdates(prev => {
        // Remove any existing update for this cell
        const filtered = prev.filter(
          u => !(u.user_id === userId && u.intervals.some(i => i.interval_start === intervalStart))
        )
        return [...filtered, update]
      })

      // Handle multi-select
      if (event?.shiftKey || event?.ctrlKey) {
        setSelectedCells(prev => {
          const newMap = new Map(prev)
          const userSet = newMap.get(userId) || new Set()
          if (userSet.has(intervalStart)) {
            userSet.delete(intervalStart)
          } else {
            userSet.add(intervalStart)
          }
          newMap.set(userId, userSet)
          return newMap
        })
      } else {
        setSelectedCells(new Map())
      }
    },
    [isEditable, schedules]
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
                  className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  Agent
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
                {intervals.map((interval) => (
                  <td key={interval} className="px-2 py-3 text-center">
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
                  onBreakClick={(intervalStart) =>
                    handleBreakClick(schedule.user_id, intervalStart)
                  }
                  selectedIntervals={selectedCells.get(schedule.user_id) || new Set()}
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
