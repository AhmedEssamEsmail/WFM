import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { SEMANTIC_COLORS } from '../lib/designSystem'
import type { User, ShiftType, LeaveType } from '../types'
import { getDaysBetween, downloadCSV } from '../utils'

interface ReportMetrics {
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

export default function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'current' | 'last' | 'custom'>('current')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [users, setUsers] = useState<User[]>([])

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  useEffect(() => {
    if (dateRange === 'current') {
      setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    } else if (dateRange === 'last') {
      const lastMonth = subMonths(new Date(), 1)
      setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
    }
  }, [dateRange])

  useEffect(() => {
    if (isManager) {
      fetchReportData()
    }
  }, [startDate, endDate, isManager])

  async function fetchReportData() {
    setLoading(true)
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('name')
      setUsers(usersData || [])

      // Fetch swap requests
      const { data: swapData } = await supabase
        .from('swap_requests')
        .select('*, requester:users!swap_requests_requester_id_fkey(name)')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')

      // Fetch leave requests
      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')

      // Fetch shifts for distribution
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('shift_type')
        .gte('date', startDate)
        .lte('date', endDate)

      // Calculate metrics
      const swapRequests = swapData || []
      const leaveRequests = leaveData || []
      const shifts = shiftsData || []

      const swapsByUser: Record<string, number> = {}
      swapRequests.forEach(swap => {
        const userName = (swap.requester as any)?.name || 'Unknown'
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

      setMetrics({
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
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function exportToCSV() {
    if (!metrics) return

    try {
      const csvData = [
        ['WFM Report'],
        ['Period', `${startDate} to ${endDate}`],
        [''],
        ['Swap Requests Summary'],
        ['Total', metrics.totalSwapRequests.toString()],
        ['Approved', metrics.approvedSwaps.toString()],
        ['Rejected', metrics.rejectedSwaps.toString()],
        ['Pending', metrics.pendingSwaps.toString()],
        [''],
        ['Leave Requests Summary'],
        ['Total', metrics.totalLeaveRequests.toString()],
        ['Approved', metrics.approvedLeaves.toString()],
        ['Rejected', metrics.rejectedLeaves.toString()],
        ['Pending', metrics.pendingLeaves.toString()],
        ['Total Leave Days', metrics.totalLeaveDays.toString()],
        [''],
        ['Swaps by User'],
        ...Object.entries(metrics.swapsByUser).map(([user, count]) => [user, count.toString()]),
        [''],
        ['Leaves by Type'],
        ...Object.entries(metrics.leavesByType).map(([type, count]) => [type, count.toString()]),
      ]

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const filename = `wfm-report-${startDate}-to-${endDate}.csv`
      downloadCSV(filename, csvContent)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  if (!isManager) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to view reports.</p>
      </div>
    )
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            View team performance and request statistics
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('current')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'current'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setDateRange('last')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'last'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'custom'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {metrics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Swap Requests Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Swap Requests</h3>
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalSwapRequests}</p>
              <div className="mt-4 flex gap-4 text-xs">
                <span className={`${SEMANTIC_COLORS.success.badge} px-2 py-1 rounded`}>
                  {metrics.approvedSwaps} approved
                </span>
                <span className={`${SEMANTIC_COLORS.warning.badge} px-2 py-1 rounded`}>
                  {metrics.pendingSwaps} pending
                </span>
              </div>
            </div>

            {/* Leave Requests Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Leave Requests</h3>
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalLeaveRequests}</p>
              <div className="mt-4 flex gap-4 text-xs">
                <span className={`${SEMANTIC_COLORS.success.badge} px-2 py-1 rounded`}>
                  {metrics.approvedLeaves} approved
                </span>
                <span className={`${SEMANTIC_COLORS.warning.badge} px-2 py-1 rounded`}>
                  {metrics.pendingLeaves} pending
                </span>
              </div>
            </div>

            {/* Total Leave Days Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Total Leave Days</h3>
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalLeaveDays}</p>
              <p className="mt-2 text-sm text-gray-500">Approved leave days</p>
            </div>

            {/* Active Users Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              <p className="mt-2 text-sm text-gray-500">Total team members</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Swaps by User */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Swaps by User</h3>
              <div className="space-y-3">
                {Object.entries(metrics.swapsByUser)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([userName, count]) => (
                    <div key={userName} className="flex items-center">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{userName}</span>
                          <span className="text-sm text-gray-500">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(count / Math.max(...Object.values(metrics.swapsByUser))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                {Object.keys(metrics.swapsByUser).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No swap requests in this period</p>
                )}
              </div>
            </div>

            {/* Leaves by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Leaves by Type</h3>
              <div className="space-y-3">
                {Object.entries(metrics.leavesByType).map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(metrics.leavesByType))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(metrics.leavesByType).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No leave requests in this period</p>
                )}
              </div>
            </div>

            {/* Shift Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shift Distribution</h3>
              <div className="space-y-3">
                {Object.entries(metrics.shiftDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{type}</span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(metrics.shiftDistribution))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(metrics.shiftDistribution).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No shifts in this period</p>
                )}
              </div>
            </div>

            {/* Request Status Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Status Overview</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Swap Requests</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`${SEMANTIC_COLORS.success.bg} p-3 rounded text-center`}>
                      <p className="text-2xl font-bold text-green-900">{metrics.approvedSwaps}</p>
                      <p className="text-xs text-green-700">Approved</p>
                    </div>
                    <div className={`${SEMANTIC_COLORS.warning.bg} p-3 rounded text-center`}>
                      <p className="text-2xl font-bold text-yellow-900">{metrics.pendingSwaps}</p>
                      <p className="text-xs text-yellow-700">Pending</p>
                    </div>
                    <div className={`${SEMANTIC_COLORS.error.bg} p-3 rounded text-center`}>
                      <p className="text-2xl font-bold text-red-900">{metrics.rejectedSwaps}</p>
                      <p className="text-xs text-red-700">Rejected</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Leave Requests</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`${SEMANTIC_COLORS.success.bg} p-3 rounded text-center`}>
                      <p className="text-2xl font-bold text-green-900">{metrics.approvedLeaves}</p>
                      <p className="text-xs text-green-700">Approved</p>
                    </div>
                    <div className={`${SEMANTIC_COLORS.warning.bg} p-3 rounded text-center`}>
                      <p className="text-2xl font-bold text-yellow-900">{metrics.pendingLeaves}</p>
                      <p className="text-xs text-yellow-700">Pending</p>
                    </div>
                    <div className={`${SEMANTIC_COLORS.error.bg} p-3 rounded text-center`}>
                      <p className="text-2xl font-bold text-red-900">{metrics.rejectedLeaves}</p>
                      <p className="text-xs text-red-700">Rejected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
