import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { SwapRequest, LeaveRequest, User, LeaveType, SwapRequestStatus, LeaveRequestStatus } from '../types'

interface SwapRequestWithUsers extends SwapRequest {
  requester: User
  target_user: User
}

interface LeaveRequestWithUser extends LeaveRequest {
  user: User
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: 'Sick',
  annual: 'Annual',
  casual: 'Casual',
  public_holiday: 'Public Holiday',
  bereavement: 'Bereavement'
}

const STATUS_COLORS: Record<SwapRequestStatus | LeaveRequestStatus, string> = {
  pending_acceptance: 'bg-yellow-100 text-yellow-800',
  pending_tl: 'bg-blue-100 text-blue-800',
  pending_wfm: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  denied: 'bg-orange-100 text-orange-800'
}

const STATUS_LABELS: Record<SwapRequestStatus | LeaveRequestStatus, string> = {
  pending_acceptance: 'Pending Acceptance',
  pending_tl: 'Pending TL',
  pending_wfm: 'Pending WFM',
  approved: 'Approved',
  rejected: 'Rejected',
  denied: 'Denied (Insufficient Balance)'
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [swapRequests, setSwapRequests] = useState<SwapRequestWithUsers[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      // Fetch swap requests
      let swapQuery = supabase
        .from('swap_requests')
        .select(`
          *,
          requester:users!swap_requests_requester_id_fkey(*),
          target_user:users!swap_requests_target_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!isManager) {
        swapQuery = swapQuery.or(`requester_id.eq.${user!.id},target_user_id.eq.${user!.id}`)
      }

      const { data: swapData, error: swapError } = await swapQuery

      if (swapError) throw swapError

      // For managers, sort with pending approvals first
      let sortedSwapData = swapData || []
      if (isManager) {
        sortedSwapData = [...sortedSwapData].sort((a, b) => {
          const aPending = a.status.startsWith('pending')
          const bPending = b.status.startsWith('pending')
          if (aPending && !bPending) return -1
          if (!aPending && bPending) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      setSwapRequests(sortedSwapData as SwapRequestWithUsers[])

      // Fetch leave requests
      let leaveQuery = supabase
        .from('leave_requests')
        .select(`
          *,
          user:users!leave_requests_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!isManager) {
        leaveQuery = leaveQuery.eq('user_id', user!.id)
      }

      const { data: leaveData, error: leaveError } = await leaveQuery

      if (leaveError) throw leaveError

      // For managers, sort with pending approvals first
      let sortedLeaveData = leaveData || []
      if (isManager) {
        sortedLeaveData = [...sortedLeaveData].sort((a, b) => {
          const aPending = a.status.startsWith('pending')
          const bPending = b.status.startsWith('pending')
          if (aPending && !bPending) return -1
          if (!aPending && bPending) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      setLeaveRequests(sortedLeaveData as LeaveRequestWithUser[])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's an overview of your shift management.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
        <button
          onClick={() => navigate('/swap-requests/create')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">New Swap Request</h3>
                <p className="text-sm text-gray-500">Request to swap shifts with a colleague</p>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/leave-requests/create')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">New Leave Request</h3>
                <p className="text-sm text-gray-500">Submit a new leave request</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Swap Requests */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Swap Requests</h2>
          <Link
            to="/swap-requests"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : swapRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No swap requests found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {swapRequests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => navigate(`/swap-requests/${request.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requester?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.target_user?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Swap pending
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Leave Requests</h2>
          <Link
            to="/leave-requests"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leave requests found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveRequests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => navigate(`/leave-requests/${request.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.user?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {LEAVE_TYPE_LABELS[request.leave_type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
