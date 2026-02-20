import { SEMANTIC_COLORS } from '../../lib/designSystem';
import type { ReportMetrics } from '../../services/reportsService';

interface MetricCardsProps {
  metrics: ReportMetrics;
  usersCount: number;
}

export default function MetricCards({ metrics, usersCount }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Swap Requests Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">Swap Requests</h3>
          <svg
            className="h-8 w-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
        <p className="text-3xl font-bold text-gray-900">{metrics.totalSwapRequests}</p>
        <div className="mt-4 flex gap-4 text-xs">
          <span className={`${SEMANTIC_COLORS.success.badge} rounded px-2 py-1`}>
            {metrics.approvedSwaps} approved
          </span>
          <span className={`${SEMANTIC_COLORS.warning.badge} rounded px-2 py-1`}>
            {metrics.pendingSwaps} pending
          </span>
        </div>
      </div>

      {/* Leave Requests Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">Leave Requests</h3>
          <svg
            className="h-8 w-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-3xl font-bold text-gray-900">{metrics.totalLeaveRequests}</p>
        <div className="mt-4 flex gap-4 text-xs">
          <span className={`${SEMANTIC_COLORS.success.badge} rounded px-2 py-1`}>
            {metrics.approvedLeaves} approved
          </span>
          <span className={`${SEMANTIC_COLORS.warning.badge} rounded px-2 py-1`}>
            {metrics.pendingLeaves} pending
          </span>
        </div>
      </div>

      {/* Total Leave Days Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">Total Leave Days</h3>
          <svg
            className="h-8 w-8 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-3xl font-bold text-gray-900">{metrics.totalLeaveDays}</p>
        <p className="mt-2 text-sm text-gray-500">Approved leave days</p>
      </div>

      {/* Active Users Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <svg
            className="h-8 w-8 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p className="text-3xl font-bold text-gray-900">{usersCount}</p>
        <p className="mt-2 text-sm text-gray-500">Total team members</p>
      </div>
    </div>
  );
}
