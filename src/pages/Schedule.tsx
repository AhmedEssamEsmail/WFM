import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, Shift, ShiftType } from '../types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'

const shiftColors: Record<ShiftType, string> = {
  AM: 'bg-blue-100 text-blue-800',
  PM: 'bg-purple-100 text-purple-800',
  BET: 'bg-orange-100 text-orange-800',
  OFF: 'bg-gray-100 text-gray-800'
}

const shiftLabels: Record<ShiftType, string> = {
  AM: 'AM',
  PM: 'PM',
  BET: 'BET',
  OFF: 'OFF'
}

interface ShiftWithSwap extends Shift {
  swapped_with_user_id?: string | null
  original_user_id?: string | null
  swapped_user?: User | null
}

export default function Schedule() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<ShiftWithSwap[]>([])
  const [swappedUserNames, setSwappedUserNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    fetchScheduleData()
  }, [currentDate, user])

  async function fetchScheduleData() {
    if (!user) return
    setLoading(true)

    try {
      // Fetch users based on role
      let usersQuery = supabase.from('users').select('*')
      
      if (user.role === 'agent') {
        // Agents see only their own row
        usersQuery = usersQuery.eq('id', user.id)
      }
      // TL and WFM see all users

      const { data: usersData, error: usersError } = await usersQuery.order('name')
      if (usersError) throw usersError

      setUsers(usersData || [])

      // Fetch shifts for the month
      const startDate = format(monthStart, 'yyyy-MM-dd')
      const endDate = format(monthEnd, 'yyyy-MM-dd')

      let shiftsQuery = supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (user.role === 'agent') {
        shiftsQuery = shiftsQuery.eq('user_id', user.id)
      }

      const { data: shiftsData, error: shiftsError } = await shiftsQuery
      if (shiftsError) throw shiftsError

      setShifts(shiftsData || [])

      // Fetch names for swapped users
      const swappedUserIds = (shiftsData || [])
        .filter(s => s.swapped_with_user_id)
        .map(s => s.swapped_with_user_id)
        .filter((id, index, self) => self.indexOf(id) === index)

      if (swappedUserIds.length > 0) {
        const { data: swappedUsers } = await supabase
          .from('users')
          .select('id, name')
          .in('id', swappedUserIds)

        const namesMap: Record<string, string> = {}
        swappedUsers?.forEach(u => {
          namesMap[u.id] = u.name
        })
        setSwappedUserNames(namesMap)
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getShiftForUserAndDate(userId: string, date: Date): ShiftWithSwap | undefined {
    const dateStr = format(date, 'yyyy-MM-dd')
    return shifts.find(s => s.user_id === userId && s.date === dateStr)
  }

  function goToPreviousMonth() {
    setCurrentDate(subMonths(currentDate, 1))
  }

  function goToNextMonth() {
    setCurrentDate(addMonths(currentDate, 1))
  }

  function goToCurrentMonth() {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">Monthly calendar view of all shifts</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToCurrentMonth}
            className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <span className="text-sm text-gray-600 font-medium">Legend:</span>
        {Object.entries(shiftColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
              {shiftLabels[type as ShiftType]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            *
          </span>
          <span className="text-sm text-gray-600">= Swapped shift</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r z-10">
                  Agent
                </th>
                {daysInMonth.map(day => (
                  <th
                    key={day.toISOString()}
                    className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[60px] ${
                      format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        ? 'bg-primary-100 text-primary-800'
                        : 'text-gray-500'
                    }`}
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div className="font-bold">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-gray-900 border-r whitespace-nowrap z-10">
                    {u.name}
                  </td>
                  {daysInMonth.map(day => {
                    const shift = getShiftForUserAndDate(u.id, day)
                    const isSwapped = shift?.swapped_with_user_id
                    const swappedUserName = isSwapped ? swappedUserNames[shift.swapped_with_user_id!] : null

                    return (
                      <td
                        key={day.toISOString()}
                        className={`px-2 py-3 text-center ${
                          format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                            ? 'bg-primary-50'
                            : ''
                        }`}
                      >
                        {shift ? (
                          <div className="relative group">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                shiftColors[shift.shift_type]
                              } ${isSwapped ? 'ring-2 ring-yellow-400' : ''}`}
                            >
                              {shiftLabels[shift.shift_type]}
                              {isSwapped && <span className="ml-0.5 text-yellow-600">*</span>}
                            </span>
                            {isSwapped && swappedUserName && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                Swapped with {swappedUserName}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No agents found</p>
        </div>
      )}
    </div>
  )
}
