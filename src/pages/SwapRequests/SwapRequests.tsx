import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { SwapRequest, User, SwapRequestStatus } from '../../types'
import { swapRequestsService } from '../../services'
import { formatDate } from '../../utils'
import { ROUTES } from '../../constants'
import { TypeBadge } from '../../components/TypeBadge'
import { StatusBadge } from '../../components/StatusBadge'

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No swap requests found</p>
          </div>
        ) : (
          <>
            {/* Desktop table view - hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      aria-label="Requester column"
                    >
                      Requester
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      aria-label="Type column"
                    >
                      Type
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      aria-label="Details column"
                    >
                      Details
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      aria-label="Status column"
                    >
                      Status
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      aria-label="Created column"
                    >
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => {
                    const targetName = (request as SwapRequestWithUsers).target?.name || (request as SwapRequestWithUsers).target_user?.name || 'Unknown'
                    return (
                      <tr
                        key={request.id}
                        onClick={() => navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)
                          }
                        }}
                        aria-label={`View swap request from ${(request as SwapRequestWithUsers).requester?.name || 'Unknown'}`}
                      >
                        {/* Requester column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div 
                              className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0"
                              aria-hidden="true"
                            >
                              {getInitials((request as SwapRequestWithUsers).requester?.name || 'Unknown')}
                            </div>
                            {/* Name */}
                            <span className="text-sm font-medium text-gray-900">
                              {(request as SwapRequestWithUsers).requester?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        {/* Type column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TypeBadge type="swap" />
                        </td>

                        {/* Details column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">→ {targetName}</span>
                        </td>

                        {/* Status column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>

                        {/* Created column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{formatDate(request.created_at)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-4 p-4">
              {requests.map((request) => {
                const targetName = (request as SwapRequestWithUsers).target?.name || (request as SwapRequestWithUsers).target_user?.name || 'Unknown'
                return (
                  <div
                    key={request.id}
                    onClick={() => navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`${ROUTES.SWAP_REQUESTS}/${request.id}`)
                      }
                    }}
                    aria-label={`View swap request from ${(request as SwapRequestWithUsers).requester?.name || 'Unknown'}`}
                  >
                    {/* Header with requester and type */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div 
                          className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0"
                          aria-hidden="true"
                        >
                          {getInitials((request as SwapRequestWithUsers).requester?.name || 'Unknown')}
                        </div>
                        {/* Name */}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {(request as SwapRequestWithUsers).requester?.name || 'Unknown'}
                        </span>
                      </div>
                      {/* Type badge */}
                      <TypeBadge type="swap" />
                    </div>

                    {/* Details */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">→ {targetName}</p>
                    </div>

                    {/* Status */}
                    <div className="mb-3">
                      <StatusBadge status={request.status} />
                    </div>

                    {/* Created date */}
                    <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                      Created: {formatDate(request.created_at)}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
