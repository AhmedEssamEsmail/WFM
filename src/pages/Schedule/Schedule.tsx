import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useLeaveTypes } from '../../hooks/useLeaveTypes'
import { User, Shift, ShiftType, LeaveType, LeaveRequest } from '../../types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns'
import { SHIFT_COLORS, SHIFT_LABELS, SHIFT_DESCRIPTIONS } from '../../lib/designSystem'
import { shiftsService, leaveRequestsService } from '../../services'
import { formatDateISO } from '../../utils'
import { handleDatabaseError } from '../../lib/errorHandler'

interface ShiftWithSwap extends Shift {
  swapped_with_user_id?: string | null
  original_user_id?: string | null
  swapped_user?: User | null
}

export default function Schedule() {
  const { user } = useAuth()
  const { leaveTypes, isLoading: loadingLeaveTypes } = useLeaveTypes()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<ShiftWithSwap[]>([])
  const [approvedLeaves, setApprovedLeaves] = useState<LeaveRequest[]>([])
  const [swappedUserNames, setSwappedUserNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  
  // Shift editing state
  const [editingShift, setEditingShift] = useState<{ userId: string; date: string; shiftId?: string; existingLeave?: LeaveRequest | null } | null>(null)
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | null>('AM')
  const [selectedLeaveTypeCode, setSelectedLeaveTypeCode] = useState<LeaveType | null>(null)
  const [savingShift, setSavingShift] = useState(false)
  
  // Filter state
  const [selectedUserId, setSelectedUserId] = useState<string>('all')

  const canEdit = user?.role === 'tl' || user?.role === 'wfm'
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Filter users based on selection
  const filteredUsers = selectedUserId === 'all' ? users : users.filter(u => u.id === selectedUserId)

  const fetchScheduleData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // Fetch users based on role visibility
      // - Agent: Can see all agents' schedules (but not TL/WFM)
      // - TL: Can see all agents + TL + WFM schedules
      // - WFM: Can see all agents + TL + WFM schedules
      let usersQuery = supabase.from('users').select('*')
      
      if (user.role === 'agent') {
        // Agents can see all agents' schedules, but not TL or WFM
        usersQuery = usersQuery.eq('role', 'agent')
      }
      // TL and WFM see all users (agents, TL, and WFM)

      const { data: usersData, error: usersError } = await usersQuery.order('name')
      if (usersError) throw usersError

      setUsers(usersData || [])

      // Calculate dates inside the callback to ensure they're fresh
      const startDate = formatDateISO(startOfMonth(currentDate))
      const endDate = formatDateISO(endOfMonth(currentDate))

      let shiftsQuery = supabase
        .from('shifts')
        .select('*, users!inner(role)')
        .gte('date', startDate)
        .lte('date', endDate)

      if (user.role === 'agent') {
        // Agents can only see shifts for users with role 'agent'
        shiftsQuery = shiftsQuery.eq('users.role', 'agent')
      }
      // TL and WFM see all shifts

      const { data: shiftsData, error: shiftsError } = await shiftsQuery
      if (shiftsError) throw shiftsError

      // Fetch approved leave requests that overlap with this month
      let leavesQuery = supabase
        .from('leave_requests')
        .select('*, users!inner(role)')
        .eq('status', 'approved')
        .lte('start_date', endDate)
        .gte('end_date', startDate)

      if (user.role === 'agent') {
        // Agents can only see leave requests for users with role 'agent'
        leavesQuery = leavesQuery.eq('users.role', 'agent')
      }
      // TL and WFM see all leave requests

      const { data: leavesData, error: leavesError } = await leavesQuery
      if (leavesError) throw leavesError

      setApprovedLeaves(leavesData || [])

      // Fetch swapped user names for shifts with swaps
      const swappedUserIds = (shiftsData || [])
        .filter(s => s.swapped_with_user_id)
        .map(s => s.swapped_with_user_id)
        .filter((id, index, self) => id && self.indexOf(id) === index)

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

      setShifts(shiftsData || [])
    } catch (error) {
      handleDatabaseError(error, 'fetch schedule')
    } finally {
      setLoading(false)
    }
  }, [user, currentDate])

  useEffect(() => {
    fetchScheduleData()
  }, [fetchScheduleData])

  // Helper function to get leave type label from code
  function getLeaveTypeLabel(leaveTypeCode: LeaveType): string {
    const leaveType = leaveTypes.find(lt => lt.code === leaveTypeCode)
    return leaveType?.label || leaveTypeCode
  }

  function getShiftForUserAndDate(userId: string, date: Date): ShiftWithSwap | undefined {
    const dateStr = formatDateISO(date)
    return shifts.find(s => s.user_id === userId && s.date === dateStr)
  }

  function getLeaveForUserAndDate(userId: string, date: Date): LeaveRequest | undefined {
    return approvedLeaves.find(leave => {
      if (leave.user_id !== userId) return false
      const leaveStart = parseISO(leave.start_date)
      const leaveEnd = parseISO(leave.end_date)
      return isWithinInterval(date, { start: leaveStart, end: leaveEnd })
    })
  }

  function handleShiftClick(userId: string, date: Date) {
    if (!canEdit) return
    
    const dateStr = formatDateISO(date)
    const existingShift = getShiftForUserAndDate(userId, date)
    const existingLeave = getLeaveForUserAndDate(userId, date)
    
    setEditingShift({ userId, date: dateStr, shiftId: existingShift?.id, existingLeave })
    setSelectedShiftType(existingShift?.shift_type || 'AM')
    // If there's an existing leave, pre-select that leave type code
    if (existingLeave) {
      setSelectedLeaveTypeCode(existingLeave.leave_type as LeaveType)
    } else {
      setSelectedLeaveTypeCode(null)
    }
  }

  async function saveShift() {
    if (!editingShift) return
    setSavingShift(true)

    try {
      // CASE 1: Delete only - no shift or leave selected
      if (!selectedLeaveTypeCode && !selectedShiftType) {
        // Delete existing leave if any
        if (editingShift.existingLeave) {
          await leaveRequestsService.deleteLeaveRequest(editingShift.existingLeave.id)
        }

        // Delete existing shift if any
        if (editingShift.shiftId) {
          await shiftsService.deleteShift(editingShift.shiftId)
        }

        await fetchScheduleData()
        setEditingShift(null)
        setSavingShift(false)
        return
      }

      // CASE 2: Assign/update leave
      if (selectedLeaveTypeCode) {
        // If there's an existing leave with the same type, just close
        if (editingShift.existingLeave && editingShift.existingLeave.leave_type === selectedLeaveTypeCode) {
          setEditingShift(null)
          setSavingShift(false)
          return
        }

        // If there's an existing leave with different type, UPDATE it instead of delete+insert
        if (editingShift.existingLeave) {
          const { error: updateError } = await supabase
            .from('leave_requests')
            .update({ leave_type: selectedLeaveTypeCode })
            .eq('id', editingShift.existingLeave.id)

          if (updateError) throw updateError
        } else {
          // No existing leave - create new one
          const { error: leaveError } = await supabase
            .from('leave_requests')
            .insert({
              user_id: editingShift.userId,
              leave_type: selectedLeaveTypeCode,
              start_date: editingShift.date,
              end_date: editingShift.date,
              notes: 'Assigned by TL/WFM from schedule',
              status: 'approved'
            })

          if (leaveError) throw leaveError
        }

        // Remove any existing shift for this day (leave takes precedence)
        if (editingShift.shiftId) {
          await shiftsService.deleteShift(editingShift.shiftId)
        }
      }
      // CASE 3: Assign/update shift (no leave selected)
      else if (selectedShiftType) {
        // First, remove any existing leave for this day
        if (editingShift.existingLeave) {
          await leaveRequestsService.deleteLeaveRequest(editingShift.existingLeave.id)
        }

        if (editingShift.shiftId) {
          // Update existing shift
          await shiftsService.updateShift(editingShift.shiftId, { shift_type: selectedShiftType })
        } else {
          // Create new shift
          await shiftsService.createShift({
            user_id: editingShift.userId,
            date: editingShift.date,
            shift_type: selectedShiftType
          })
        }
      }

      await fetchScheduleData()
      setEditingShift(null)
    } catch (error) {
      handleDatabaseError(error, 'save shift')
      alert('Failed to save shift/leave')
    } finally {
      setSavingShift(false)
    }
  }

  async function deleteShift() {
    if (!editingShift) return
    setSavingShift(true)

    try {
      // Delete existing leave if any
      if (editingShift.existingLeave) {
        await leaveRequestsService.deleteLeaveRequest(editingShift.existingLeave.id)
      }

      // Delete existing shift if any
      if (editingShift.shiftId) {
        await shiftsService.deleteShift(editingShift.shiftId)
      }

      await fetchScheduleData()
      setEditingShift(null)
    } catch (error) {
      handleDatabaseError(error, 'delete shift')
      alert('Failed to delete')
    } finally {
      setSavingShift(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            {canEdit ? 'View and manage team schedules' : 'View your schedule'}
          </p>
        </div>
        
        {/* Agent Filter - Only show for TL/WFM */}
        {canEdit && (
          <div className="mt-4 sm:mt-0">
            <label htmlFor="agent-filter" className="sr-only">Filter by agent</label>
            <select
              id="agent-filter"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Agents</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Month navigation */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Schedule grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-20">
                  <tr>
                    <th 
                      scope="col"
                      className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] sm:min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    >
                      Name
                    </th>
                    {daysInMonth.map(day => (
                      <th
                        key={day.toISOString()}
                        scope="col"
                        className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px] sm:min-w-[60px] bg-gray-50"
                      >
                        <div className="sr-only">{format(day, 'EEEE')}</div>
                        <div aria-hidden="true">{format(day, 'EEE')}</div>
                        <div className="text-gray-900">{format(day, 'd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <th 
                        scope="row"
                        className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        {u.name}
                      </th>
                      {daysInMonth.map(day => {
                        const shift = getShiftForUserAndDate(u.id, day)
                        const leave = getLeaveForUserAndDate(u.id, day)
                        const isOnLeave = !!leave
                        const dateStr = format(day, 'MMMM d, yyyy')
                        
                        return (
                          <td
                            key={day.toISOString()}
                            className={`px-2 py-3 text-center ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''} ${isOnLeave ? 'bg-opacity-50' : ''}`}
                            onClick={() => canEdit && handleShiftClick(u.id, day)}
                            onKeyDown={(e) => {
                              if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault()
                                handleShiftClick(u.id, day)
                              }
                            }}
                            tabIndex={canEdit ? 0 : -1}
                            role={canEdit ? 'button' : undefined}
                            aria-label={
                              isOnLeave 
                                ? `${u.name} on ${leave.leave_type} leave on ${dateStr}${canEdit ? ', press Enter to edit' : ''}`
                                : shift
                                ? `${u.name} has ${shift.shift_type} shift on ${dateStr}${canEdit ? ', press Enter to edit' : ''}`
                                : canEdit
                                ? `No shift for ${u.name} on ${dateStr}, press Enter to add`
                                : `No shift for ${u.name} on ${dateStr}`
                            }
                            title={isOnLeave ? `On ${leave.leave_type} leave${canEdit ? ' (click to edit)' : ''}` : undefined}
                          >
                            {isOnLeave ? (
                              <div className="relative">
                                <span 
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
                                  style={{
                                    backgroundColor: leaveTypes.find(lt => lt.code === leave.leave_type)?.color || '#E5E7EB',
                                    color: '#1F2937',
                                    borderColor: leaveTypes.find(lt => lt.code === leave.leave_type)?.color || '#D1D5DB'
                                  }}
                                >
                                  {getLeaveTypeLabel(leave.leave_type as LeaveType)}
                                </span>
                              </div>
                            ) : shift ? (
                              <div className="relative">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${SHIFT_COLORS[shift.shift_type]}`}>
                                  {SHIFT_LABELS[shift.shift_type]}
                                </span>
                                {shift.swapped_with_user_id && (
                                  <div className="text-xs text-gray-500 mt-1 truncate" title={`Swapped with ${swappedUserNames[shift.swapped_with_user_id] || 'Unknown'}`}>
                                    â {swappedUserNames[shift.swapped_with_user_id]?.split(' ')[0] || '?'}
                                  </div>
                                )}
                              </div>
                            ) : canEdit ? (
                              <span className="text-gray-300 text-xs">+</span>
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
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Shifts</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(SHIFT_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color}`}>
                        {SHIFT_LABELS[type as ShiftType]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {SHIFT_DESCRIPTIONS[type as ShiftType]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Leave Types</h4>
                <div className="flex flex-wrap gap-4">
                  {loadingLeaveTypes ? (
                    <div className="text-sm text-gray-500">Loading leave types...</div>
                  ) : leaveTypes.length === 0 ? (
                    <div className="text-sm text-gray-500">No leave types configured</div>
                  ) : (
                    leaveTypes.filter(lt => lt.is_active).map(leaveType => (
                      <div key={leaveType.id} className="flex items-center gap-2">
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
                          style={{
                            backgroundColor: leaveType.color,
                            color: '#1F2937',
                            borderColor: leaveType.color
                          }}
                        >
                          {leaveType.label}
                        </span>
                        {leaveType.description && (
                          <span className="text-sm text-gray-600">
                            {leaveType.description}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

      {/* Shift edit modal */}
      {editingShift && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingShift.existingLeave ? 'Edit Leave/Shift' : editingShift.shiftId ? 'Edit Shift' : 'Add Shift/Leave'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Date: {format(new Date(editingShift.date), 'EEEE, MMMM d, yyyy')}
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Shift Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(SHIFT_COLORS) as ShiftType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => { setSelectedShiftType(type); setSelectedLeaveTypeCode(null); }}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedShiftType === type && !selectedLeaveTypeCode
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${SHIFT_COLORS[type]}`}>
                      {SHIFT_LABELS[type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Type Assignment */}
            <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700">Or Assign Leave</label>
              <div className="grid grid-cols-2 gap-3">
                {loadingLeaveTypes ? (
                  <div className="col-span-2 text-center text-sm text-gray-500">Loading leave types...</div>
                ) : leaveTypes.filter(lt => lt.is_active).length === 0 ? (
                  <div className="col-span-2 text-center text-sm text-gray-500">No leave types available</div>
                ) : (
                  leaveTypes.filter(lt => lt.is_active).map(leaveType => (
                    <button
                      key={leaveType.id}
                      onClick={() => {
                        setSelectedLeaveTypeCode(leaveType.code)
                        setSelectedShiftType(null)
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedLeaveTypeCode === leaveType.code
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
                        style={{
                          backgroundColor: leaveType.color,
                          color: '#1F2937',
                          borderColor: leaveType.color
                        }}
                      >
                        {leaveType.label}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selectedLeaveTypeCode && (
                <button
                  onClick={() => {
                    setSelectedLeaveTypeCode(null)
                    setSelectedShiftType('AM')
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear leave selection
                </button>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <div>
                {(editingShift.shiftId || editingShift.existingLeave) && (
                  <button
                    onClick={deleteShift}
                    disabled={savingShift}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingShift(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={saveShift}
                  disabled={savingShift}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingShift ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
