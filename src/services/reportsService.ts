import { supabase } from '../lib/supabase'
import { getDaysBetween } from '../utils'
import type { User, LeaveType, ShiftType, SwapRequest } from '../types'

interface SwapRequestWithRequester extends SwapRequest {
  requester?: User
}

export interface ReportMetrics {
  totalSwapRequests: number
  approvedSwaps: number
  rejectedSwaps: number
  pendingSwaps: number
  totalLeaveRequests: number
  approvedLeaves: number
  rejectedLeaves: number
  pendingLeaves: number
  totalLeaveDays: number
  swapsByUser: Record<string, number>
  leavesByType: Record<LeaveType, number>
  shiftDistribution: Record<ShiftType, number>
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface ReportData {
  metrics: ReportMetrics
  users: User[]
}

/**
 * Fetch report metrics for a given date range
 * @param dateRange - Object containing startDate and endDate in 'yyyy-MM-dd' format
 * @returns Report metrics and user list
 */
export async function getMetrics(dateRange: DateRange): Promise<ReportData> {
  const { startDate, endDate } = dateRange

  // Fetch users
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`)
  }

  // Fetch swap requests
  const { data: swapData, error: swapError } = await supabase
    .from('swap_requests')
    .select('*, requester:users!swap_requests_requester_id_fkey(name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')

  if (swapError) {
    throw new Error(`Failed to fetch swap requests: ${swapError.message}`)
  }

  // Fetch leave requests
  const { data: leaveData, error: leaveError } = await supabase
    .from('leave_requests')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')

  if (leaveError) {
    throw new Error(`Failed to fetch leave requests: ${leaveError.message}`)
  }

  // Fetch shifts for distribution
  const { data: shiftsData, error: shiftsError } = await supabase
    .from('shifts')
    .select('shift_type')
    .gte('date', startDate)
    .lte('date', endDate)

  if (shiftsError) {
    throw new Error(`Failed to fetch shifts: ${shiftsError.message}`)
  }

  // Calculate metrics
  const swapRequests = swapData || []
  const leaveRequests = leaveData || []
  const shifts = shiftsData || []
  const users = usersData || []

  const swapsByUser: Record<string, number> = {}
  swapRequests.forEach(swap => {
    const userName = (swap as SwapRequestWithRequester).requester?.name || 'Unknown'
    swapsByUser[userName] = (swapsByUser[userName] || 0) + 1
  })

  const leavesByType: Record<string, number> = {}
  leaveRequests.forEach(leave => {
    leavesByType[leave.leave_type] = (leavesByType[leave.leave_type] || 0) + 1
  })

  const shiftDistribution: Record<string, number> = {}
  shifts.forEach(shift => {
    shiftDistribution[shift.shift_type] = (shiftDistribution[shift.shift_type] || 0) + 1
  })

  // Calculate total leave days
  const totalLeaveDays = leaveRequests
    .filter(leave => leave.status === 'approved')
    .reduce((sum, leave) => {
      const days = getDaysBetween(leave.start_date, leave.end_date)
      return sum + days
    }, 0)

  const metrics: ReportMetrics = {
    totalSwapRequests: swapRequests.length,
    approvedSwaps: swapRequests.filter(s => s.status === 'approved').length,
    rejectedSwaps: swapRequests.filter(s => s.status === 'rejected').length,
    pendingSwaps: swapRequests.filter(s => s.status.startsWith('pending')).length,
    totalLeaveRequests: leaveRequests.length,
    approvedLeaves: leaveRequests.filter(l => l.status === 'approved').length,
    rejectedLeaves: leaveRequests.filter(l => l.status === 'rejected' || l.status === 'denied').length,
    pendingLeaves: leaveRequests.filter(l => l.status.startsWith('pending')).length,
    totalLeaveDays,
    swapsByUser,
    leavesByType: leavesByType as Record<LeaveType, number>,
    shiftDistribution: shiftDistribution as Record<ShiftType, number>,
  }

  return { metrics, users }
}
