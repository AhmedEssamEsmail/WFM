import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLeaveTypes } from '../../hooks/useLeaveTypes'
import { LeaveRequest, User } from '../../types'
import { getStatusColor, getStatusLabel } from '../../lib/designSystem'
import { leaveRequestsService } from '../../services'
import { formatDate } from '../../utils'
import { ROUTES } from '../../constants'

interface LeaveRequestWithUser extends LeaveRequest {
  user: User
  users?: User
}

export default function LeaveRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { leaveTypes, isLoading: loadingLeaveTypes } = useLeaveTypes()
  const [requests, setRequests] = useState<LeaveRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState<string>('all')

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  // Helper function to get leave type label
  function getLeaveTypeLabel(code: string): string {
    const leaveTypeConfig = leaveTypes.find(lt => lt.code === code)
    return leaveTypeConfig?.label || code
  }

  const fetchRequests = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // Use service for basic fetching, then apply filters
      let requests: LeaveRequestWithUser[]
      
      if (isManager) {
        // Managers see all requests
        requests = await leaveRequestsService.getLeaveRequests() as LeaveRequestWithUser[]
      } else {
        // Agents see only their own requests
        requests = await leaveRequestsService.getUserLeaveRequests(user.id) as LeaveRequestWithUser[]
      }

      // Apply filters
      let filteredRequests = requests
      
      if (startDate) {
        filteredRequests = filteredRequests.filter(r => r.start_date >= startDate)
      }
      if (endDate) {
        filteredRequests = filteredRequests.filter(r => r.end_date <= endDate)
      }
      if (leaveType !== 'all') {
        filteredRequests = filteredRequests.filter(r => r.leave_type === leaveType)
      }

      // For managers, sort with pending approvals first
      if (isManager) {
        filteredRequests = [...filteredRequests].sort((a, b) => {
          const aPending = a.status.startsWith('pending')
          const bPending = b.status.startsWith('pending')
          if (aPending && !bPending) return -1
          if (!aPending && bPending) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      setRequests(filteredRequests)
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }, [user, isManager, startDate, endDate, leaveType])

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, fetchRequests])

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setLeaveType('all')
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="leave-type" className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type
          </label>
          {loadingLeaveTypes ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <select
              id="leave-type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Types</option>
              {leaveTypes.filter(lt => lt.is_active).map((lt) => (
                <option key={lt.id} value={lt.code}>{lt.label}</option>
              ))}
            </select>
          )}
        </div>
        {(startDate || endDate || leaveType !== 'all') && (
          <button
            onClick={clearFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No leave requests found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {(request as LeaveRequestWithUser).users?.name || 'Unknown'}
                    </p>
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
                      {getLeaveTypeLabel(request.leave_type)}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="font-medium text-gray-700">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </p>
                  <p>Created: {formatDate(request.created_at)}</p>
                  {request.notes && (
                    <p className="text-gray-600 line-clamp-2 mt-2">Note: {request.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
