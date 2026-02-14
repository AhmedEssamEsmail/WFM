import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLeaveTypes } from '../../hooks/useLeaveTypes'
import { useLeaveRequests } from '../../hooks/useLeaveRequests'
import { LeaveRequestStatus } from '../../types'
import { TypeBadge } from '../../components/TypeBadge'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDate } from '../../utils'
import { ROUTES } from '../../constants'

export default function LeaveRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { leaveTypes, isLoading: loadingLeaveTypes } = useLeaveTypes()
  const { leaveRequests, isLoading: loading, updateLeaveRequest, deleteLeaveRequest } = useLeaveRequests()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState<string>('all')

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  // Helper function to get leave type info with color
  function getLeaveTypeInfo(code: string): { label: string; color: string } {
    const leaveTypeConfig = leaveTypes.find(lt => lt.code === code)
    return {
      label: leaveTypeConfig?.label || code,
      color: leaveTypeConfig?.color || '#E5E7EB'
    }
  }

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to determine available actions for a request
  const getRequestActions = (request: typeof leaveRequests[0]): ('approve' | 'reject' | 'revoke')[] => {
    const actions: ('approve' | 'reject' | 'revoke')[] = []
    
    // Managers can approve/reject pending requests
    if (isManager && (request.status === 'pending_tl' || request.status === 'pending_wfm')) {
      actions.push('approve', 'reject')
    }
    
    // Requesters can revoke their own pending requests
    if (user?.id === request.user_id && request.status.startsWith('pending')) {
      actions.push('revoke')
    }
    
    return actions
  }

  // Handle action button clicks
  const handleAction = async (id: string, action: 'approve' | 'reject' | 'revoke') => {
    try {
      if (action === 'revoke') {
        await deleteLeaveRequest.mutateAsync(id)
      } else if (action === 'approve') {
        const request = leaveRequests.find((r) => r.id === id)
        if (!request) return

        let newStatus: LeaveRequestStatus
        if (request.status === 'pending_tl') {
          newStatus = user?.role === 'wfm' ? 'approved' : 'pending_wfm'
        } else if (request.status === 'pending_wfm') {
          newStatus = 'approved'
        } else {
          return
        }

        await updateLeaveRequest.mutateAsync({
          id,
          updates: { status: newStatus },
        })
      } else if (action === 'reject') {
        await updateLeaveRequest.mutateAsync({
          id,
          updates: { status: 'rejected' },
        })
      }
    } catch (error) {
      console.error(`Error performing ${action} action:`, error)
    }
  }

  const getActionButtonStyles = (action: 'approve' | 'reject' | 'revoke') => {
    switch (action) {
      case 'approve':
        return 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
      case 'reject':
        return 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
      case 'revoke':
        return 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
    }
  }

  const getActionButtonLabel = (action: 'approve' | 'reject' | 'revoke') => {
    return action.charAt(0).toUpperCase() + action.slice(1)
  }

  // Apply filters to requests
  const filteredRequests = useMemo(() => {
    let filtered = leaveRequests

    // Filter by user role
    if (!isManager && user) {
      filtered = filtered.filter(r => r.user_id === user.id)
    }

    // Apply date filters
    if (startDate) {
      filtered = filtered.filter(r => r.start_date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(r => r.end_date <= endDate)
    }

    // Apply leave type filter
    if (leaveType !== 'all') {
      filtered = filtered.filter(r => r.leave_type === leaveType)
    }

    // Sort with pending approvals first for managers
    if (isManager) {
      filtered = [...filtered].sort((a, b) => {
        const aPending = a.status.startsWith('pending')
        const bPending = b.status.startsWith('pending')
        if (aPending && !bPending) return -1
        if (!aPending && bPending) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }

    return filtered
  }, [leaveRequests, isManager, user, startDate, endDate, leaveType])

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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No leave requests found</p>
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
                      aria-label="Actions column"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const actions = getRequestActions(request)
                    const requesterName = request.user?.name || 'Unknown'
                    const dateRange = `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`
                    
                    return (
                      <tr
                        key={request.id}
                        onClick={() => navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)
                          }
                        }}
                        aria-label={`View leave request from ${requesterName}`}
                      >
                        {/* Requester column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div 
                              className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0"
                              aria-hidden="true"
                            >
                              {getInitials(requesterName)}
                            </div>
                            {/* Name */}
                            <span className="text-sm font-medium text-gray-900">
                              {requesterName}
                            </span>
                          </div>
                        </td>

                        {/* Type column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TypeBadge type="leave" />
                        </td>

                        {/* Details column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="text-sm text-gray-900 block">{dateRange}</span>
                            <span 
                              className="inline-flex px-2 py-0.5 text-xs font-medium rounded border"
                              style={{
                                backgroundColor: getLeaveTypeInfo(request.leave_type).color,
                                color: '#1F2937',
                                borderColor: getLeaveTypeInfo(request.leave_type).color
                              }}
                            >
                              {getLeaveTypeInfo(request.leave_type).label}
                            </span>
                          </div>
                        </td>

                        {/* Status column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>

                        {/* Actions column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {actions.map((action) => (
                              <button
                                key={action}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAction(request.id, action)
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${getActionButtonStyles(action)}`}
                                aria-label={`${getActionButtonLabel(action)} request from ${requesterName}`}
                              >
                                {getActionButtonLabel(action)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-4 p-4">
              {filteredRequests.map((request) => {
                const actions = getRequestActions(request)
                const requesterName = request.user?.name || 'Unknown'
                const dateRange = `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`
                
                return (
                  <div
                    key={request.id}
                    onClick={() => navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)}
                    className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`${ROUTES.LEAVE_REQUESTS}/${request.id}`)
                      }
                    }}
                    aria-label={`View leave request from ${requesterName}`}
                  >
                    {/* Header with requester and type */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div 
                          className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm flex-shrink-0"
                          aria-hidden="true"
                        >
                          {getInitials(requesterName)}
                        </div>
                        {/* Name */}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {requesterName}
                        </span>
                      </div>
                      {/* Type badge */}
                      <TypeBadge type="leave" />
                    </div>

                    {/* Details */}
                    <div className="mb-3 space-y-2">
                      <p className="text-sm text-gray-900">{dateRange}</p>
                      <span 
                        className="inline-flex px-2 py-0.5 text-xs font-medium rounded border"
                        style={{
                          backgroundColor: getLeaveTypeInfo(request.leave_type).color,
                          color: '#1F2937',
                          borderColor: getLeaveTypeInfo(request.leave_type).color
                        }}
                      >
                        {getLeaveTypeInfo(request.leave_type).label}
                      </span>
                      {request.notes && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-2">Note: {request.notes}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="mb-3">
                      <StatusBadge status={request.status} />
                    </div>

                    {/* Actions */}
                    {actions.length > 0 && (
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {actions.map((action) => (
                          <button
                            key={action}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction(request.id, action)
                            }}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${getActionButtonStyles(action)}`}
                            aria-label={`${getActionButtonLabel(action)} request from ${requesterName}`}
                          >
                            {getActionButtonLabel(action)}
                          </button>
                        ))}
                      </div>
                    )}
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
