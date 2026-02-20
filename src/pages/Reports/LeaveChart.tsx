import { SEMANTIC_COLORS } from '../../lib/designSystem';
import type { ReportMetrics } from '../../services/reportsService';

interface LeaveChartProps {
  metrics: ReportMetrics;
}

export default function LeaveChart({ metrics }: LeaveChartProps) {
  const maxLeaveValue = Math.max(...Object.values(metrics.leavesByType), 1);
  const maxShiftValue = Math.max(...Object.values(metrics.shiftDistribution), 1);

  return (
    <>
      {/* Leaves by Type */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Leaves by Type</h3>
        <div className="space-y-3">
          {Object.entries(metrics.leavesByType).map(([type, count]) => (
            <div key={type} className="flex items-center">
              <div className="flex-1">
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium capitalize text-gray-700">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${(count / maxLeaveValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {Object.keys(metrics.leavesByType).length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              No leave requests in this period
            </p>
          )}
        </div>
      </div>

      {/* Shift Distribution */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Shift Distribution</h3>
        <div className="space-y-3">
          {Object.entries(metrics.shiftDistribution).map(([type, count]) => (
            <div key={type} className="flex items-center">
              <div className="flex-1">
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <span className="text-sm text-gray-500">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-purple-600"
                    style={{ width: `${(count / maxShiftValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {Object.keys(metrics.shiftDistribution).length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No shifts in this period</p>
          )}
        </div>
      </div>

      {/* Request Status Breakdown */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Request Status Overview</h3>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Swap Requests</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className={`${SEMANTIC_COLORS.success.bg} rounded p-3 text-center`}>
                <p className="text-2xl font-bold text-green-900">{metrics.approvedSwaps}</p>
                <p className="text-xs text-green-700">Approved</p>
              </div>
              <div className={`${SEMANTIC_COLORS.warning.bg} rounded p-3 text-center`}>
                <p className="text-2xl font-bold text-yellow-900">{metrics.pendingSwaps}</p>
                <p className="text-xs text-yellow-700">Pending</p>
              </div>
              <div className={`${SEMANTIC_COLORS.error.bg} rounded p-3 text-center`}>
                <p className="text-2xl font-bold text-red-900">{metrics.rejectedSwaps}</p>
                <p className="text-xs text-red-700">Rejected</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Leave Requests</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className={`${SEMANTIC_COLORS.success.bg} rounded p-3 text-center`}>
                <p className="text-2xl font-bold text-green-900">{metrics.approvedLeaves}</p>
                <p className="text-xs text-green-700">Approved</p>
              </div>
              <div className={`${SEMANTIC_COLORS.warning.bg} rounded p-3 text-center`}>
                <p className="text-2xl font-bold text-yellow-900">{metrics.pendingLeaves}</p>
                <p className="text-xs text-yellow-700">Pending</p>
              </div>
              <div className={`${SEMANTIC_COLORS.error.bg} rounded p-3 text-center`}>
                <p className="text-2xl font-bold text-red-900">{metrics.rejectedLeaves}</p>
                <p className="text-xs text-red-700">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
