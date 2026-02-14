import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { RequestTable, type RequestTableRow, type RequestAction } from '../components/RequestTable'
import { useSwapRequests } from '../hooks/useSwapRequests'
import { useLeaveRequests } from '../hooks/useLeaveRequests'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'
import { formatDateShort } from '../utils/dateHelpers'
import type { RequestStatus } from '../components/StatusBadge'
import type { SwapRequestStatus, LeaveRequestStatus } from '../types'

/**
 * RequestManagement page - Unified view of swap and leave requests
 * 
 * Requirements:
 * - 8.1: Provide Request_Management_Page accessible via navigation
 * - 8.2: Display both swap and leave requests in unified table
 * - 8.9: Preserve existing filter functionality for both request types
 * - 11.3-11.7: Implement action handlers (Approve, Reject, Revoke)
 */
export default function RequestManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'swap' | 'leave'>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Fetch data
  const { swapRequests, isLoading: swapLoading, updateSwapRequest, deleteSwapRequest } = useSwapRequests()
  const { leaveRequests, isLoading: leaveLoading, updateLeaveRequest, deleteLeaveRequest } = useLeaveRequests()

  // Map swap request status to RequestStatus
  const mapSwapStatus = (status: SwapRequestStatus): RequestStatus => {
    const statusMap: Record<SwapRequestStatus, RequestStatus> = {
      'pending_acceptance': 'pending_acceptance',
      'pending_tl': 'pending_tl',
      'pending_wfm': 'pending_wfm',
      'approved': 'approved',
      'rejected': 'rejected',
    }
    return statusMap[status]
  }

  // Map leave request status to RequestStatus
  const mapLeaveStatus = (status: LeaveRequestStatus): RequestStatus => {
    const statusMap: Record<LeaveRequestStatus, RequestStatus> = {
      'pending_tl': 'pending_tl',
      'pending_wfm': 'pending_wfm',
      'approved': 'approved',
      'rejected': 'rejected',
      'denied': 'rejected', // Map denied to rejected for display
    }
    return statusMap[status]
  }

  // Determine available actions based on user role and request status
  const getAvailableActions = (
    status: SwapRequestStatus | LeaveRequestStatus,
    requesterId: string
  ): RequestAction[] => {
    const actions: RequestAction[] = []

    // Requirement 11.1: Approve/Reject for TL/WFM on pending requests
    if (user && (user.role === 'tl' || user.role === 'wfm')) {
      if (status === 'pending_tl' || status === 'pending_wfm') {
        actions.push('approve', 'reject')
      }
    }

    // Requirement 11.2: Revoke for requester on pending requests
    if (user && user.id === requesterId) {
      if (
        status === 'pending_acceptance' ||
        status === 'pending_tl' ||
        status === 'pending_wfm'
      ) {
        actions.push('revoke')
      }
    }

    return actions
  }

  // Merge and transform requests
  const unifiedRequests: RequestTableRow[] = useMemo(() => {
    const swapRows: RequestTableRow[] = swapRequests.map((req) => ({
      id: req.id,
      type: 'swap' as const,
      requester: {
        id: req.requester.id,
        name: req.requester.name,
      },
      details: `→ ${req.target.name}`,
      status: mapSwapStatus(req.status),
      actions: getAvailableActions(req.status, req.requester.id),
    }))

    const leaveRows: RequestTableRow[] = leaveRequests.map((req) => ({
      id: req.id,
      type: 'leave' as const,
      requester: {
        id: req.user.id,
        name: req.user.name,
      },
      details: `${formatDateShort(req.start_date)} - ${formatDateShort(req.end_date)}`,
      status: mapLeaveStatus(req.status),
      actions: getAvailableActions(req.status, req.user.id),
    }))

    return [...swapRows, ...leaveRows]
  }, [swapRequests, leaveRequests, user])

  // Apply filters
  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter((req) => {
      // Type filter
      if (typeFilter !== 'all' && req.type !== typeFilter) return false

      // Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) return false

      // Date range filter (for leave requests)
      if (dateRangeFilter.start && dateRangeFilter.end && req.type === 'leave') {
        const leaveReq = leaveRequests.find((lr) => lr.id === req.id)
        if (leaveReq) {
          const startDate = new Date(leaveReq.start_date)
          const endDate = new Date(leaveReq.end_date)
          const filterStart = new Date(dateRangeFilter.start)
          const filterEnd = new Date(dateRangeFilter.end)

          if (startDate < filterStart || endDate > filterEnd) return false
        }
      }

      return true
    })
  }, [unifiedRequests, statusFilter, typeFilter, dateRangeFilter, leaveRequests])

  // Handle row click - navigate to detail page
  const handleRowClick = (id: string, type: 'swap' | 'leave') => {
    if (type === 'swap') {
      navigate(`/swap-requests/${id}`)
    } else {
      navigate(`/leave-requests/${id}`)
    }
  }

  // Handle actions
  const handleAction = async (id: string, action: RequestAction) => {
    try {
      const request = unifiedRequests.find((r) => r.id === id)
      if (!request) return

      if (action === 'revoke') {
        // Requirement 11.5: Revoke deletes the request
        if (request.type === 'swap') {
          await deleteSwapRequest.mutateAsync(id)
        } else {
          await deleteLeaveRequest.mutateAsync(id)
        }
        success('Request revoked successfully')
      } else if (action === 'approve') {
        // Requirement 11.3: Approve updates status according to workflow
        if (request.type === 'swap') {
          const swapReq = swapRequests.find((sr) => sr.id === id)
          if (!swapReq) return

          let newStatus: SwapRequestStatus
          if (swapReq.status === 'pending_tl') {
            newStatus = user?.role === 'wfm' ? 'approved' : 'pending_wfm'
          } else if (swapReq.status === 'pending_wfm') {
            newStatus = 'approved'
          } else {
            return
          }

          await updateSwapRequest.mutateAsync({
            id,
            updates: { status: newStatus },
          })
        } else {
          const leaveReq = leaveRequests.find((lr) => lr.id === id)
          if (!leaveReq) return

          let newStatus: LeaveRequestStatus
          if (leaveReq.status === 'pending_tl') {
            newStatus = user?.role === 'wfm' ? 'approved' : 'pending_wfm'
          } else if (leaveReq.status === 'pending_wfm') {
            newStatus = 'approved'
          } else {
            return
          }

          await updateLeaveRequest.mutateAsync({
            id,
            updates: { status: newStatus },
          })
        }
        success('Request approved successfully')
      } else if (action === 'reject') {
        // Requirement 11.4: Reject updates status to rejected
        if (request.type === 'swap') {
          await updateSwapRequest.mutateAsync({
            id,
            updates: { status: 'rejected' },
          })
        } else {
          await updateLeaveRequest.mutateAsync({
            id,
            updates: { status: 'rejected' },
          })
        }
        success('Request rejected successfully')
      }
    } catch (error) {
      // Requirement 11.7: Display error message on failure
      showError(error instanceof Error ? error.message : 'Failed to process request')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all swap and leave requests in one place
          </p>
        </div>

        {/* Filters - Requirement 8.9 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Request Type
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'swap' | 'leave')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="swap">Swap Requests</option>
                <option value="leave">Leave Requests</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending_acceptance">Pending Acceptance</option>
                <option value="pending_tl">Pending TL</option>
                <option value="pending_wfm">Pending WFM</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label htmlFor="date-start" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="date-start"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label htmlFor="date-end" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="date-end"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter.start || dateRangeFilter.end) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setTypeFilter('all')
                  setDateRangeFilter({ start: '', end: '' })
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Request Table */}
        <div className="bg-white rounded-lg shadow">
          <RequestTable
            requests={filteredRequests}
            onRowClick={handleRowClick}
            onAction={handleAction}
            loading={swapLoading || leaveLoading}
          />
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredRequests.length} of {unifiedRequests.length} requests
        </div>
      </div>
    </Layout>
  )
}
