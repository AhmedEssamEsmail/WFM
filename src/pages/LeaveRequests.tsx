import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { LeaveRequest, User, LeaveType, LeaveRequestStatus } from '../types'

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

const LEAVE_TYPES: LeaveType[] = ['sick', 'annual', 'casual', 'public_holiday', 'bereavement']

const STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  pending_tl: 'bg-blue-100 text-blue-800',
  pending_wfm: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  denied: 'bg-orange-100 text-orange-800'
}

const STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending_tl: 'Pending TL',
  pending_wfm: 'Pending WFM',
  approved: 'Approved',
  rejected: 'Rejected',
  denied: 'Denied (Insufficient Balance)'
}

const ITEMS_PER_PAGE = 10

export default function LeaveRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<LeaveRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<LeaveType | ''>('')

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, page, startDate, endDate, leaveTypeFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      // Build the query
      let query = supabase
        .from('leave_requests')
        .select('*, user:users!leave_requests_user_id_fkey(*)', { count: 'exact' })

      // If not a manager, only show own requests
      if (!isManager) {
        query = query.eq('user_id', user!.id)
      }

      // Apply date filters
      if (startDate) {
        query = query.gte('start_date', startDate)
      }
      if (endDate) {
        query = query.lte('end_date', endDate)
      }

      // Apply leave type filter
      if (leaveTypeFilter) {
        query = query.eq('leave_type', leaveTypeFilter)
      }

      // Apply pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setRequests(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching leave requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setLeaveTypeFilter('')
    setPage(1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
        <button
          onClick={() => navigate('/leave/new')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={leaveTypeFilter}
              onChange={(e) => { setLeaveTypeFilter(e.target.value as LeaveType | ''); setPage(1) }}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">All Types</option>
              {LEAVE_TYPES.map(type => (
                <option key={type} value={type}>{LEAVE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No leave requests found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isManager && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} onClick={() => navigate(`/leave-requests/${request.id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    {isManager && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.user?.name}</div>
                        <div className="text-sm text-gray-500">{request.user?.email}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{LEAVE_TYPE_LABELS[request.leave_type]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {calculateDays(request.start_date, request.end_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[request.status]}`}>
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-700">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
