import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useOvertimeRequests } from '../../hooks/useOvertimeRequests'
import { OvertimeRequestCard } from '../../components/OvertimeRequests/OvertimeRequestCard'
import { Pagination } from '../../components/shared/Pagination'
import { ROUTES } from '../../constants'

/**
 * OvertimeRequests list page
 * 
 * Requirements:
 * - 4.1: Agents see only their own requests
 * - 4.2: Team Leads see their team's requests
 * - 4.3: WFM Administrators see all requests
 * - 4.7: Paginate results with 50 requests per page
 * - 5.1: Filter by status
 * - 5.2: Filter by date range
 * - 5.3: Filter by agent name (TL/WFM only)
 * - 5.4: Filter by department
 * - 5.6: Preserve filters on navigation
 */
export default function OvertimeRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'this_week' | 'last_30_days' | 'custom'>('last_30_days')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [agentSearch, setAgentSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  // Fetch overtime requests with pagination
  const { 
    overtimeRequests, 
    isLoading, 
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage 
  } = useOvertimeRequests({ 
    page: currentPage, 
    pageSize 
  })

  // Calculate date range based on preset
  const getDateRange = () => {
    if (dateRange === 'custom') {
      return { from: dateFrom, to: dateTo }
    }
    
    const today = new Date()
    const to = today.toISOString().split('T')[0]
    
    if (dateRange === 'this_week') {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return { from: weekStart.toISOString().split('T')[0], to }
    }
    
    if (dateRange === 'last_30_days') {
      const monthAgo = new Date(today)
      monthAgo.setDate(today.getDate() - 30)
      return { from: monthAgo.toISOString().split('T')[0], to }
    }
    
    return { from: '', to: '' }
  }

  // Apply filters to requests
  const filteredRequests = useMemo(() => {
    let filtered = overtimeRequests

    // Filter by user role
    if (!isManager && user) {
      filtered = filtered.filter(r => r.requester_id === user.id)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Filter by date range
    const { from, to } = getDateRange()
    if (from) {
      filtered = filtered.filter(r => r.request_date >= from)
    }
    if (to) {
      filtered = filtered.filter(r => r.request_date <= to)
    }

    // Filter by agent name (TL/WFM only)
    if (isManager && agentSearch) {
      const searchLower = agentSearch.toLowerCase()
      filtered = filtered.filter(r => 
        r.requester?.name.toLowerCase().includes(searchLower)
      )
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(r => r.requester?.department === departmentFilter)
    }

    // Sort with pending requests first for managers
    if (isManager) {
      filtered = [...filtered].sort((a, b) => {
        const aPending = a.status.startsWith('pending')
        const bPending = b.status.startsWith('pending')
        if (aPending && !bPending) return -1
        if (!aPending && bPending) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else {
      // Sort by created date for agents
      filtered = [...filtered].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return filtered
  }, [overtimeRequests, isManager, user, statusFilter, dateRange, dateFrom, dateTo, agentSearch, departmentFilter])

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(overtimeRequests.map(r => r.requester?.department).filter(Boolean))
    return Array.from(depts).sort()
  }, [overtimeRequests])

  const clearFilters = () => {
    setStatusFilter('all')
    setDateRange('last_30_days')
    setDateFrom('')
    setDateTo('')
    setAgentSearch('')
    setDepartmentFilter('all')
  }

  const hasActiveFilters = 
    statusFilter !== 'all' || 
    dateRange !== 'last_30_days' || 
    dateFrom || 
    dateTo || 
    agentSearch || 
    departmentFilter !== 'all'

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Overtime Requests</h1>
        <button
          onClick={() => navigate(ROUTES.OVERTIME_REQUESTS_CREATE)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending_tl">Pending TL</option>
              <option value="pending_wfm">Pending WFM</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="date-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'this_week' | 'last_30_days' | 'custom')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="this_week">This Week</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Department Filter */}
          {isManager && (
            <div>
              <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Agent Search (TL/WFM only) */}
        {isManager && (
          <div>
            <label htmlFor="agent-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Agent
            </label>
            <input
              id="agent-search"
              type="text"
              placeholder="Search by agent name..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
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
        {isLoading ? (
          /* Loading Skeletons */
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No overtime requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters 
                ? 'No requests match your filters. Try adjusting your search criteria.'
                : 'Get started by creating a new overtime request.'}
            </p>
            {!hasActiveFilters && (
              <div className="mt-6">
                <button
                  onClick={() => navigate(ROUTES.OVERTIME_REQUESTS_CREATE)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  New Request
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Request Cards */}
            <div className="p-4 space-y-4">
              {filteredRequests.map((request) => (
                <OvertimeRequestCard
                  key={request.id}
                  request={request}
                  onClick={() => navigate(ROUTES.OVERTIME_REQUESTS_DETAIL(request.id))}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                hasMore={hasNextPage}
                hasPrevious={hasPreviousPage}
                isLoading={isLoading}
                onNextPage={handleNextPage}
                onPrevPage={handlePrevPage}
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
