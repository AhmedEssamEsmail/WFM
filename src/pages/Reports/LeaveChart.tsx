import { SEMANTIC_COLORS } from '../../lib/designSystem'
import type { ReportMetrics } from '../../services/reportsService'

interface LeaveChartProps {
  metrics: ReportMetrics
}

export default function LeaveChart({ metrics }: LeaveChartProps) {
  const maxLeaveValue = Math.max(...Object.values(metrics.leavesByType), 1)
  const maxShiftValue = Math.max(...Object.values(metrics.shiftDistribution), 1)

  return (
    <>
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
                    style={{ width: `${(count / maxLeaveValue) * 100}%` }}
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
                    style={{ width: `${(count / maxShiftValue) * 100}%` }}
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
    </>
  )
}
