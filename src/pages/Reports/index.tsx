import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { downloadCSV } from '../../utils'
import { useReportData } from '../../hooks/useReportData'
import ReportFilters from './ReportFilters'
import MetricCards from './MetricCards'
import SwapChart from './SwapChart'
import LeaveChart from './LeaveChart'

export default function Reports() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<'current' | 'last' | 'custom'>('current')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const isManager = user?.role === 'tl' || user?.role === 'wfm'
  const { loading, metrics, users } = useReportData(startDate, endDate)

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
      <ReportFilters
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={setDateRange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {metrics && (
        <>
          {/* Summary Cards */}
          <MetricCards metrics={metrics} usersCount={users.length} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SwapChart metrics={metrics} />
            <LeaveChart metrics={metrics} />
          </div>
        </>
      )}
    </div>
  )
}
