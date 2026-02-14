import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLeaveTypes } from '../hooks/useLeaveTypes'
import { useDashboardData } from '../hooks/useDashboardData'
import type { SwapRequest, LeaveRequest, User } from '../types'
import { getStatusColor, getStatusLabel } from '../lib/designSystem'
import { formatDate as formatDateUtil } from '../utils'
import { sanitizeColorForStyle } from '../validation/validators'
import { ROUTES } from '../constants'

interface SwapRequestWithUsers extends SwapRequest {
  requester: User
  target_user: User
}

interface LeaveRequestWithUser extends LeaveRequest {
  user: User
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { leaveTypes } = useLeaveTypes()
  const { data, isLoading: loading } = useDashboardData()

  const swapRequests = data?.swapRequests || []
  const leaveRequests = data?.leaveRequests || []

  // Helper function to get leave type info with color
  const getLeaveTypeInfo = useCallback((leaveTypeCode: string) => {
    const leaveType = leaveTypes.find(lt => lt.code === leaveTypeCode)
    return {
      label: leaveType?.label || leaveTypeCode,
      color: sanitizeColorForStyle(leaveType?.color)
    }
  }, [leaveTypes])

  const formatDate = useCallback((dateString: string) => {
    return formatDateUtil(dateString)
  }, [])

  return (
    <div className="pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {user?.name}! Here's an overview of your shift management.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <button
          onClick={() => navigate(ROUTES.SWAP_REQUESTS_CREATE)}
          className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-left"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-medium text-slate-900 dark:text-white">New Swap Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Request to swap shifts with a colleague</p>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(ROUTES.LEAVE_REQUESTS_CREATE)}
          className="bg-white dark:bg-slate-900 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-left"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-medium text-slate-900 dark:text-white">New Leave Request</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Submit a new leave request</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Swap Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Recent Swap Requests</h2>
          <Link
            to={ROUTES.SWAP_REQUESTS}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            View All
          </Link>
        </div>
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : swapRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No swap requests found</div>
          ) : (
            /* Mobile-friendly card layout */
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {swapRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/swap-requests/${request.id}`)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {(request as SwapRequestWithUsers).requester?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        → {(request as SwapRequestWithUsers).target_user?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Recent Leave Requests</h2>
          <Link
            to={ROUTES.LEAVE_REQUESTS}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            View All
          </Link>
        </div>
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No leave requests found</div>
          ) : (
            /* Mobile-friendly card layout */
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/leave-requests/${request.id}`)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {(request as LeaveRequestWithUser).user?.name || 'Unknown'}
                      </p>
                      <span 
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border mt-1"
                        style={{
                          backgroundColor: getLeaveTypeInfo(request.leave_type).color,
                          color: '#1F2937',
                          borderColor: getLeaveTypeInfo(request.leave_type).color
                        }}
                      >
                        {getLeaveTypeInfo(request.leave_type).label}
                      </span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Created {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



