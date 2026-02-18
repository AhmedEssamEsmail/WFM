import { useOvertimeStatistics } from '../../hooks/useOvertimeStatistics'
import type { OvertimeRequestFilters } from '../../types/overtime'
import { Download } from 'lucide-react'
import { overtimeRequestsService } from '../../services/overtimeRequestsService'
import { generateOvertimeCSVFilename } from '../../utils/overtimeCsvHelpers'
import { downloadCSV } from '../../utils'
import { useState } from 'react'
import { useToast } from '../../contexts/ToastContext'

interface OvertimeStatisticsProps {
  filters: OvertimeRequestFilters
  onExportCSV?: () => void
}

export default function OvertimeStatistics({ filters }: OvertimeStatisticsProps) {
  const { data: statistics, isLoading, error } = useOvertimeStatistics(filters)
  const [exporting, setExporting] = useState(false)
  const { success, error: showError } = useToast()

  async function handleExportCSV() {
    setExporting(true)
    try {
      const csvContent = await overtimeRequestsService.exportOvertimeCSV(filters)
      const filename = generateOvertimeCSVFilename(filters.date_from, filters.date_to)
      downloadCSV(filename, csvContent)
      success('CSV exported successfully')
    } catch (err) {
      console.error('Export error:', err)
      showError('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600">Loading statistics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-600">Error loading statistics</div>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Requests</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {statistics.summary.total_requests}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="mt-2 text-3xl font-semibold text-green-600">
            {statistics.summary.approved}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="mt-2 text-3xl font-semibold text-red-600">
            {statistics.summary.rejected}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Approval Rate</div>
          <div className="mt-2 text-3xl font-semibold text-indigo-600">
            {statistics.summary.approval_rate}%
          </div>
        </div>
      </div>

      {/* Hours Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hours Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Total Hours</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {statistics.hours.total_hours}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Regular (1.5x)</div>
            <div className="mt-1 text-2xl font-semibold text-blue-600">
              {statistics.hours.regular_hours}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Double (2.0x)</div>
            <div className="mt-1 text-2xl font-semibold text-purple-600">
              {statistics.hours.double_hours}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Equivalent Hours</div>
            <div className="mt-1 text-2xl font-semibold text-indigo-600">
              {statistics.hours.equivalent_hours}
            </div>
            <div className="text-xs text-gray-500 mt-1">For payroll</div>
          </div>
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Agents by Overtime Hours</h3>
        {statistics.by_agent.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No approved overtime requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regular
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Double
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equivalent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.by_agent.map((agent) => (
                  <tr key={agent.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {agent.total_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">
                      {agent.regular_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right">
                      {agent.double_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 text-right font-medium">
                      {agent.equivalent_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {agent.request_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overtime by Type */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Overtime Distribution by Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Regular Overtime (1.5x)</div>
              <div className="text-2xl font-semibold text-blue-600">
                {statistics.by_type.regular.count}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {statistics.by_type.regular.hours} hours
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    statistics.summary.total_requests > 0
                      ? (statistics.by_type.regular.count / statistics.summary.total_requests) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Double Overtime (2.0x)</div>
              <div className="text-2xl font-semibold text-purple-600">
                {statistics.by_type.double.count}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {statistics.by_type.double.hours} hours
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${
                    statistics.summary.total_requests > 0
                      ? (statistics.by_type.double.count / statistics.summary.total_requests) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      {statistics.trend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Trend (Last 8 Weeks)</h3>
          <div className="space-y-2">
            {statistics.trend.map((week) => (
              <div key={week.week} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{week.week}</div>
                <div className="flex-1 ml-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-indigo-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${
                            statistics.trend.length > 0
                              ? (week.hours / Math.max(...statistics.trend.map(t => t.hours))) * 100
                              : 0
                          }%`,
                          minWidth: week.hours > 0 ? '40px' : '0',
                        }}
                      >
                        <span className="text-xs font-medium text-white">
                          {week.hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
