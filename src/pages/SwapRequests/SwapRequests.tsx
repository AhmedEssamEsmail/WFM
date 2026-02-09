import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { SwapRequest, User, SwapRequestStatus } from '../../types'
import { getStatusColor, getStatusLabel } from '../../lib/designSystem'
import { swapRequestsService } from '../../services'
import { formatDate } from '../../utils'
import { ROUTES } from '../../constants'

interface SwapRequestWithUsers extends SwapRequest {
  requester: User
  target_user: User
  target?: User
}

export default function SwapRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<SwapRequestWithUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState<SwapRequestStatus | ''>('')

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  const fetchRequests = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // Use service for basic fetching
      let requests: SwapRequestWithUsers[]
      
      if (isManager) {
        // Managers see all requests
        requests = await swapRequestsService.getSwapRequests() as SwapRequestWithUsers[]
      } else {
        // Agents see only their own requests (as requester or target)
        requests = await swapRequestsService.getUserSwapRequests(user.id) as SwapRequestWithUsers[]
      }

      // Apply filters
      let filteredRequests = requests
      
      if (startDate) {
        filteredRequests = filteredRequests.filter(r => r.created_at >= startDate)
      }
      if (endDate) {
        filteredRequests = filteredRequests.filter(r => r.created_at <= endDate + 'T23:59:59')
      }
      if (statusFilter) {
        filteredRequests = filteredRequests.filter(r => r.status === statusFilter)
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
      console.error('Error fetching swap requests:', error)
    } finally {
      setLoading(false)
    }
  }, [user, isManager, startDate, endDate, statusFilter])

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, fetchRequests])

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setStatusFilter('')
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Swap Requests</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SwapRequestStatus | '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending_acceptance">Pending Acceptance</option>
              <option value="pending_tl">Pending TL</option>
              <option value="pending_wfm">Pending WFM</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {(startDate || endDate || statusFilter) && (
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
            No swap requests found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {(request as SwapRequestWithUsers).requester?.name || 'Unknown'}
                      </p>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">
                        {(request as SwapRequestWithUsers).target?.name || (request as SwapRequestWithUsers).target_user?.name || 'Unknown'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(request as SwapRequestWithUsers).requester?.email || 'N/A'}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 whitespace-nowrap ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Created: {formatDate(request.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
