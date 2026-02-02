import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, Shift, ShiftType, LeaveType, LeaveTypeConfig, LeaveRequest } from '../types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns'

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

const leaveColors: Record<LeaveType, string> = {
  sick: 'bg-red-100 text-red-800 border-red-300',
  annual: 'bg-green-100 text-green-800 border-green-300',
  casual: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  public_holiday: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  bereavement: 'bg-gray-200 text-gray-800 border-gray-400',
}

const leaveLabels: Record<LeaveType, string> = {
  sick: 'Sick',
  annual: 'Annual',
  casual: 'Casual',
  public_holiday: 'Holiday',
  bereavement: 'Bereav.',
}


// Mapping from display labels to database enum values
const labelToLeaveTypeEnum: Record<string, LeaveType> = {
  // Short labels used in leaveLabels
  'Sick': 'sick',
  'Annual': 'annual',
  'Casual': 'casual',
  'Holiday': 'public_holiday',
  'Bereav.': 'bereavement',
  'Bereavement': 'bereavement',
  // Full labels from database/defaults
  'Sick Leave': 'sick',
  'Annual Leave': 'annual',
  'Casual Leave': 'casual',
  'Public Holiday': 'public_holiday',
  'Bereavement Leave': 'bereavement',
  // Lowercase enum values (for direct matches)
  'sick': 'sick',
  'annual': 'annual',
  'casual': 'casual',
  'public_holiday': 'public_holiday',
  'bereavement': 'bereavement',
}

const defaultLeaveTypes: { label: string }[] = [
  { label: 'Sick Leave' },
  { label: 'Annual Leave' },
  { label: 'Casual Leave' },
  { label: 'Public Holiday' },
  { label: 'Bereavement Leave' },
]

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
  const [approvedLeaves, setApprovedLeaves] = useState<LeaveRequest[]>([])
  const [swappedUserNames, setSwappedUserNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'schedule' | 'leave-types'>('schedule')
  
  // Shift editing state
  const [editingShift, setEditingShift] = useState<{ userId: string; date: string; shiftId?: string; existingLeave?: LeaveRequest | null } | null>(null)
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>('AM')
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null)
  const [savingShift, setSavingShift] = useState(false)
  
  // Leave types state
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([])
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false)
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeConfig | null>(null)
  const [newLeaveType, setNewLeaveType] = useState({ label: '', color: 'gray', is_active: true })
  const [showAddLeaveType, setShowAddLeaveType] = useState(false)
  
  // Filter state
  const [selectedUserId, setSelectedUserId] = useState<string>('all')

  const canEdit = user?.role === 'tl' || user?.role === 'wfm'
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Filter users based on selection
  const filteredUsers = selectedUserId === 'all' ? users : users.filter(u => u.id === selectedUserId)

  useEffect(() => {
    fetchScheduleData()
    // Fetch leave types when schedule loads (needed for edit modal)
    if (canEdit) {
      fetchLeaveTypes()
    }
  }, [currentDate, user, canEdit])

  useEffect(() => {
    if (activeTab === 'leave-types' && canEdit) {
      fetchLeaveTypes()
    }
  }, [activeTab, canEdit])

  async function fetchScheduleData() {
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

      // Fetch shifts for the month
      const startDate = format(monthStart, 'yyyy-MM-dd')
      const endDate = format(monthEnd, 'yyyy-MM-dd')

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
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLeaveTypes() {
    setLoadingLeaveTypes(true)
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('label')

      if (error) {
        // If table doesn't exist, use defaults
        console.log('Leave types table not found, using defaults')
        setLeaveTypes(defaultLeaveTypes.map((lt, i) => ({ 
          id: `default-${i}`, 
          label: lt.label, 
          is_active: true,
          created_at: new Date().toISOString()
        })))
      } else {
        setLeaveTypes(data || [])
      }
    } catch (error) {
      console.error('Error fetching leave types:', error)
    } finally {
      setLoadingLeaveTypes(false)
    }
  }

  function getShiftForUserAndDate(userId: string, date: Date): ShiftWithSwap | undefined {
    const dateStr = format(date, 'yyyy-MM-dd')
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
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const existingShift = getShiftForUserAndDate(userId, date)
    const existingLeave = getLeaveForUserAndDate(userId, date)
    
    setEditingShift({ userId, date: dateStr, shiftId: existingShift?.id, existingLeave })
    setSelectedShiftType(existingShift?.shift_type || 'AM')
    // If there's an existing leave, pre-select that leave type; otherwise null (shift mode)
    // Find the label for the leave type enum value
    if (existingLeave) {
      // Get the display label from leave_type enum
      const leaveLabel = leaveLabels[existingLeave.leave_type as LeaveType] || existingLeave.leave_type
      setSelectedLeaveType(leaveLabel)
    } else {
      setSelectedLeaveType(null)
    }
  }

  async function saveShift() {
    if (!editingShift) return
    setSavingShift(true)

    try {
      // CASE 1: Delete only - no shift or leave selected
      if (!selectedLeaveType && !selectedShiftType) {
        // Delete existing leave if any
        if (editingShift.existingLeave) {
          const { error } = await supabase
            .from('leave_requests')
            .delete()
            .eq('id', editingShift.existingLeave.id)
          if (error) throw error
        }

        // Delete existing shift if any
        if (editingShift.shiftId) {
          const { error } = await supabase
            .from('shifts')
            .delete()
            .eq('id', editingShift.shiftId)
          if (error) throw error
        }

        await fetchScheduleData()
        setEditingShift(null)
        setSavingShift(false)
        return
      }

      // CASE 2: Assign/update leave
      if (selectedLeaveType) {
        const selectedLeaveEnum = labelToLeaveTypeEnum[selectedLeaveType] || selectedLeaveType

        // If there's an existing leave with the same type, just close
        if (editingShift.existingLeave && editingShift.existingLeave.leave_type === selectedLeaveEnum) {
          setEditingShift(null)
          setSavingShift(false)
          return
        }

        // If there's an existing leave with different type, UPDATE it instead of delete+insert
        if (editingShift.existingLeave) {
          const { error: updateError } = await supabase
            .from('leave_requests')
            .update({ leave_type: selectedLeaveEnum })
            .eq('id', editingShift.existingLeave.id)

          if (updateError) throw updateError
        } else {
          // No existing leave - create new one
          const { error: leaveError } = await supabase
            .from('leave_requests')
            .insert({
              user_id: editingShift.userId,
              leave_type: selectedLeaveEnum,
              start_date: editingShift.date,
              end_date: editingShift.date,
              notes: 'Assigned by TL/WFM from schedule',
              status: 'approved'
            })

          if (leaveError) throw leaveError
        }

        // Remove any existing shift for this day (leave takes precedence)
        if (editingShift.shiftId) {
          await supabase
            .from('shifts')
            .delete()
            .eq('id', editingShift.shiftId)
        }
      }
      // CASE 3: Assign/update shift (no leave selected)
      else if (selectedShiftType) {
        // First, remove any existing leave for this day
        if (editingShift.existingLeave) {
          const { error: deleteLeaveError } = await supabase
            .from('leave_requests')
            .delete()
            .eq('id', editingShift.existingLeave.id)

          if (deleteLeaveError) throw deleteLeaveError
        }

        if (editingShift.shiftId) {
          // Update existing shift
          const { error } = await supabase
            .from('shifts')
            .update({ shift_type: selectedShiftType })
            .eq('id', editingShift.shiftId)

          if (error) throw error
        } else {
          // Create new shift
          const { error } = await supabase
            .from('shifts')
            .insert({
              user_id: editingShift.userId,
              date: editingShift.date,
              shift_type: selectedShiftType
            })

          if (error) throw error
        }
      }

      await fetchScheduleData()
      setEditingShift(null)
    } catch (error) {
      console.error('Error saving shift:', error)
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
        const { error } = await supabase
          .from('leave_requests')
          .delete()
          .eq('id', editingShift.existingLeave.id)
        if (error) throw error
      }

      // Delete existing shift if any
      if (editingShift.shiftId) {
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', editingShift.shiftId)
        if (error) throw error
      }

      await fetchScheduleData()
      setEditingShift(null)
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete')
    } finally {
      setSavingShift(false)
    }
  }

  async function saveLeaveType() {
    if (!editingLeaveType) return

    try {
      const { error } = await supabase
        .from('leave_types')
        .update({ 
          label: editingLeaveType.label,
          is_active: editingLeaveType.is_active 
        })
        .eq('id', editingLeaveType.id)

      if (error) throw error

      await fetchLeaveTypes()
      setEditingLeaveType(null)
    } catch (error) {
      console.error('Error updating leave type:', error)
      alert('Failed to update leave type')
    }
  }

  async function addLeaveType() {
    if (!newLeaveType.label) {
      alert('Please fill in the label')
      return
    }

    try {
      const { error } = await supabase
        .from('leave_types')
        .insert({
          label: newLeaveType.label,
          color: newLeaveType.color,
          is_active: newLeaveType.is_active
        })

      if (error) throw error

      await fetchLeaveTypes()
      setNewLeaveType({ label: '', color: 'gray', is_active: true })
      setShowAddLeaveType(false)
    } catch (error) {
      console.error('Error adding leave type:', error)
      alert('Failed to add leave type')
    }
  }

  async function deleteLeaveType(id: string) {
    if (!confirm('Are you sure you want to delete this leave type?')) return

    try {
      const { error } = await supabase
        .from('leave_types')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchLeaveTypes()
    } catch (error) {
      console.error('Error deleting leave type:', error)
      alert('Failed to delete leave type')
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
    <div className="space-y-6 w-full overflow-hidden">
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

      {/* Tabs for TL/WFM */}
      {canEdit && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`${
                activeTab === 'schedule'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('leave-types')}
              className={`${
                activeTab === 'leave-types'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Leave Types
            </button>
          </nav>
        </div>
      )}

      {activeTab === 'schedule' && (
        <>
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
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-20">
                  <tr>
                    <th className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Name
                    </th>
                    {daysInMonth.map(day => (
                      <th
                        key={day.toISOString()}
                        className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px] bg-gray-50"
                      >
                        <div>{format(day, 'EEE')}</div>
                        <div className="text-gray-900">{format(day, 'd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {u.name}
                      </td>
                      {daysInMonth.map(day => {
                        const shift = getShiftForUserAndDate(u.id, day)
                        const leave = getLeaveForUserAndDate(u.id, day)
                        const isOnLeave = !!leave
                        
                        return (
                          <td
                            key={day.toISOString()}
                            className={`px-2 py-2 text-center ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''} ${isOnLeave ? 'bg-opacity-50' : ''}`}
                            onClick={() => handleShiftClick(u.id, day)}
                            title={isOnLeave ? `On ${leave.leave_type} leave (click to edit)` : undefined}
                          >
                            {isOnLeave ? (
                              <div className="relative">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${leaveColors[leave.leave_type] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                                  {leaveLabels[leave.leave_type] || leave.leave_type}
                                </span>
                              </div>
                            ) : shift ? (
                              <div className="relative">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${shiftColors[shift.shift_type]}`}>
                                  {shiftLabels[shift.shift_type]}
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

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Shifts</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(shiftColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color}`}>
                        {shiftLabels[type as ShiftType]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {type === 'AM' && 'Morning'}
                        {type === 'PM' && 'Afternoon'}
                        {type === 'BET' && 'Between'}
                        {type === 'OFF' && 'Day Off'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Leave Types</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(leaveColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${color}`}>
                        {leaveLabels[type as LeaveType]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {type === 'sick' && 'Sick Leave'}
                        {type === 'annual' && 'Annual Leave'}
                        {type === 'casual' && 'Casual Leave'}
                        {type === 'public_holiday' && 'Public Holiday'}
                        {type === 'bereavement' && 'Bereavement'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'leave-types' && canEdit && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Leave Types</h3>
              <p className="mt-1 text-sm text-gray-500">Manage available leave types for the team</p>
            </div>
            <button
              onClick={() => setShowAddLeaveType(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Leave Type
            </button>
          </div>

          {loadingLeaveTypes ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {leaveTypes.map(lt => (
                <li key={lt.id} className="px-4 py-4 sm:px-6">
                  {editingLeaveType?.id === lt.id ? (
                    <div className="flex items-center gap-4">
                      
                      <input
                        type="text"
                        value={editingLeaveType.label}
                        onChange={e => setEditingLeaveType({ ...editingLeaveType, label: e.target.value })}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        placeholder="Label (e.g., Sick Leave)"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingLeaveType.is_active}
                          onChange={e => setEditingLeaveType({ ...editingLeaveType, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Active</span>
                      </label>
                      <button
                        onClick={saveLeaveType}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingLeaveType(null)}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lt.label}</p>
                        
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lt.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => setEditingLeaveType(lt)}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLeaveType(lt.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {leaveTypes.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500">
                  No leave types configured. Add one to get started.
                </li>
              )}
            </ul>
          )}

          {/* Add new leave type form */}
          {showAddLeaveType && (
            <div className="px-4 py-4 sm:px-6 border-t bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Leave Type</h4>
              <div className="flex items-center gap-4">
                
                <input
                  type="text"
                  value={newLeaveType.label}
                  onChange={e => setNewLeaveType({ ...newLeaveType, label: e.target.value })}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  placeholder="Label (e.g., Maternity Leave)"
                />
                <select
                  value={newLeaveType.color}
                  onChange={e => setNewLeaveType({ ...newLeaveType, color: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="gray">Gray</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="indigo">Indigo</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newLeaveType.is_active}
                    onChange={e => setNewLeaveType({ ...newLeaveType, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Active</span>
                </label>
                <button
                  onClick={addLeaveType}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddLeaveType(false)
                    setNewLeaveType({ label: '', color: 'gray', is_active: true })
                  }}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                {(Object.keys(shiftColors) as ShiftType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => { setSelectedShiftType(type); setSelectedLeaveType(null); }}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedShiftType === type && !selectedLeaveType
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${shiftColors[type]}`}>
                      {shiftLabels[type]}
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
                ) : leaveTypes.filter(lt => lt.is_active !== false).length === 0 ? (
                  <div className="col-span-2 text-center text-sm text-gray-500">No leave types available</div>
                ) : (
                  leaveTypes.filter(lt => lt.is_active !== false).map(leaveType => (
                    <button
                      key={leaveType.id}
                      onClick={() => {
                        setSelectedLeaveType(leaveType.label)
                        setSelectedShiftType(null as any)
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        (selectedLeaveType ? (labelToLeaveTypeEnum[selectedLeaveType] || selectedLeaveType) : null) === (labelToLeaveTypeEnum[leaveType.label] || leaveType.label)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        leaveColors[labelToLeaveTypeEnum[leaveType.label] as LeaveType] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {leaveType.label}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {selectedLeaveType && (
                <button
                  onClick={() => {
                    setSelectedLeaveType(null)
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
