import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { SwapRequest, LeaveRequest, User } from '../types'
import { LEAVE_LABELS, getStatusColor, getStatusLabel } from '../lib/designSystem'
import { swapRequestsService, leaveRequestsService } from '../services'
import { formatDate as formatDateUtil } from '../utils'
import { ROUTES } from '../constants'
import { handleDatabaseError } from '../lib/errorHandler'

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
  const [swapRequests, setSwapRequests] = useState<SwapRequestWithUsers[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all requests using services
      const [allSwapRequests, allLeaveRequests] = await Promise.all([
        swapRequestsService.getSwapRequests(),
        leaveRequestsService.getLeaveRequests()
      ])

      // Filter and sort swap requests
      let filteredSwaps = isManager 
        ? allSwapRequests 
        : allSwapRequests.filter(r => r.requester_id === user!.id || r.target_user_id === user!.id)

      if (isManager) {
        filteredSwaps = [...filteredSwaps].sort((a, b) => {
          const aPending = a.status.startsWith('pending')
          const bPending = b.status.startsWith('pending')
          if (aPending && !bPending) return -1
          if (!aPending && bPending) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      // Map the data to match the expected interface structure
      // Service returns 'target' but interface expects 'target_user'
      const mappedSwaps = filteredSwaps.slice(0, 5).map(swap => {
        console.log('Swap request data:', swap)
        return {
          ...swap,
          requester: (swap as any).requester,
          target_user: (swap as any).target  // Map 'target' to 'target_user'
        }
      })
      setSwapRequests(mappedSwaps as SwapRequestWithUsers[])

      // Filter and sort leave requests
      let filteredLeaves = isManager
        ? allLeaveRequests
        : allLeaveRequests.filter(r => r.user_id === user!.id)

      if (isManager) {
        filteredLeaves = [...filteredLeaves].sort((a, b) => {
          const aPending = a.status.startsWith('pending')
          const bPending = b.status.startsWith('pending')
          if (aPending && !bPending) return -1
          if (!aPending && bPending) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      // Map the data to match the expected interface structure
      // Service returns 'users' (plural) but interface expects 'user' (singular)
      const mappedLeaves = filteredLeaves.slice(0, 5).map(leave => {
        console.log('Leave request data:', leave)
        return {
          ...leave,
          user: (leave as any).users  // Map 'users' to 'user'
        }
      })
      setLeaveRequests(mappedLeaves as LeaveRequestWithUser[])
    } catch (error) {
      handleDatabaseError(error, 'fetch dashboard requests')
    } finally {
      setLoading(false)
    }
  }, [user, isManager])

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, fetchRequests])

  const formatDate = useCallback((dateString: string) => {
    return formatDateUtil(dateString)
  }, [])

  return (
    <div className="pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's an overview of your shift management.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <button
          onClick={() => navigate(ROUTES.SWAP_REQUESTS_CREATE)}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-medium text-gray-900">New Swap Request</h3>
                <p className="text-xs text-gray-500">Request to swap shifts with a colleague</p>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(ROUTES.LEAVE_REQUESTS_CREATE)}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-medium text-gray-900">New Leave Request</h3>
                <p className="text-xs text-gray-500">Submit a new leave request</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Swap Requests */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Recent Swap Requests</h2>
          <Link
            to={ROUTES.SWAP_REQUESTS}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View All
          </Link>
        </div>
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : swapRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No swap requests found</div>
          ) : (
            /* Mobile-friendly card layout */
            <div className="divide-y divide-gray-200">
              {swapRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/swap-requests/${request.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(request as SwapRequestWithUsers).requester?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        → {(request as SwapRequestWithUsers).target_user?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Recent Leave Requests</h2>
          <Link
            to={ROUTES.LEAVE_REQUESTS}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View All
          </Link>
        </div>
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No leave requests found</div>
          ) : (
            /* Mobile-friendly card layout */
            <div className="divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => navigate(`/leave-requests/${request.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(request as LeaveRequestWithUser).user?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {LEAVE_LABELS[request.leave_type]}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
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
