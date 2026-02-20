import { useOvertimeStatistics } from '../../hooks/useOvertimeStatistics';
import type { OvertimeRequestFilters } from '../../types/overtime';
import { Download } from 'lucide-react';
import { overtimeRequestsService } from '../../services/overtimeRequestsService';
import { generateOvertimeCSVFilename } from '../../utils/overtimeCsvHelpers';
import { downloadCSV } from '../../utils';
import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface OvertimeStatisticsProps {
  filters: OvertimeRequestFilters;
  onExportCSV?: () => void;
}

export default function OvertimeStatistics({ filters }: OvertimeStatisticsProps) {
  const { data: statistics, isLoading, error } = useOvertimeStatistics(filters);
  const [exporting, setExporting] = useState(false);
  const { success, error: showError } = useToast();

  async function handleExportCSV() {
    setExporting(true);
    try {
      const csvContent = await overtimeRequestsService.exportOvertimeCSV(filters);
      const filename = generateOvertimeCSVFilename(filters.date_from, filters.date_to);
      downloadCSV(filename, csvContent);
      success('CSV exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      showError('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-gray-600">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-red-600">Error loading statistics</div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">Total Requests</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {statistics.summary.total_requests}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="mt-2 text-3xl font-semibold text-green-600">
            {statistics.summary.approved}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="mt-2 text-3xl font-semibold text-red-600">
            {statistics.summary.rejected}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">Approval Rate</div>
          <div className="mt-2 text-3xl font-semibold text-indigo-600">
            {statistics.summary.approval_rate}%
          </div>
        </div>
      </div>

      {/* Hours Breakdown */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Hours Breakdown</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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
            <div className="mt-1 text-xs text-gray-500">For payroll</div>
          </div>
        </div>
      </div>

      {/* Top Agents */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Top 5 Agents by Overtime Hours</h3>
        {statistics.by_agent.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No approved overtime requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Regular
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Double
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Equivalent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Requests
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {statistics.by_agent.map((agent) => (
                  <tr key={agent.user_id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {agent.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {agent.department}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                      {agent.total_hours}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-blue-600">
                      {agent.regular_hours}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-purple-600">
                      {agent.double_hours}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-indigo-600">
                      {agent.equivalent_hours}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
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
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Overtime Distribution by Type</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Regular Overtime (1.5x)</div>
              <div className="text-2xl font-semibold text-blue-600">
                {statistics.by_type.regular.count}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {statistics.by_type.regular.hours} hours
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600"
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

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Double Overtime (2.0x)</div>
              <div className="text-2xl font-semibold text-purple-600">
                {statistics.by_type.double.count}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {statistics.by_type.double.hours} hours
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-purple-600"
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
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Weekly Trend (Last 8 Weeks)</h3>
          <div className="space-y-2">
            {statistics.trend.map((week) => (
              <div key={week.week} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{week.week}</div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <div className="h-6 w-full rounded-full bg-gray-200">
                      <div
                        className="flex h-6 items-center justify-end rounded-full bg-indigo-600 pr-2"
                        style={{
                          width: `${
                            statistics.trend.length > 0
                              ? (week.hours / Math.max(...statistics.trend.map((t) => t.hours))) *
                                100
                              : 0
                          }%`,
                          minWidth: week.hours > 0 ? '40px' : '0',
                        }}
                      >
                        <span className="text-xs font-medium text-white">{week.hours}h</span>
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
  );
}
