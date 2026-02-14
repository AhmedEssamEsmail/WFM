import { useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDashboardData } from '../hooks/useDashboardData'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useCoverageData } from '../hooks/useCoverageData'
import { StatCard } from '../components/StatCard'
import { CoverageChart } from '../components/CoverageChart'
import { TypeBadge } from '../components/TypeBadge'
import { StatusBadge } from '../components/StatusBadge'
import type { SwapRequest, LeaveRequest, User } from '../types'
import { formatDate as formatDateUtil } from '../utils'
import { ROUTES } from '../constants'

interface SwapRequestWithUsers extends SwapRequest {
  requester: User
  target_user: User
}

interface LeaveRequestWithUser extends LeaveRequest {
  user: User
}

// Unified request interface for Recent Requests section
interface UnifiedRequest {
  id: string
  type: 'swap' | 'leave'
  requesterName: string
  status: string
  details: string
  createdAt: string
  navigateTo: string
}

// Icon components for stat cards
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SwapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading: loading } = useDashboardData()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: coverageData, isLoading: coverageLoading } = useCoverageData()

  const swapRequests = data?.swapRequests || []
  const leaveRequests = data?.leaveRequests || []
  
  // Check if user is TL or WFM for coverage overview visibility
  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  const formatDate = useCallback((dateString: string) => {
    return formatDateUtil(dateString)
  }, [])

  // Merge and sort swap and leave requests - Requirements 3.2, 3.8
  const recentRequests = useMemo<UnifiedRequest[]>(() => {
    const swapUnified: UnifiedRequest[] = swapRequests.map((req) => ({
      id: req.id,
      type: 'swap' as const,
      requesterName: (req as SwapRequestWithUsers).requester?.name || 'Unknown',
      status: req.status,
      details: `→ ${(req as SwapRequestWithUsers).target_user?.name || 'Unknown'}`,
      createdAt: req.created_at,
      navigateTo: `/swap-requests/${req.id}`
    }))

    const leaveUnified: UnifiedRequest[] = leaveRequests.map((req) => ({
      id: req.id,
      type: 'leave' as const,
      requesterName: (req as LeaveRequestWithUser).user?.name || 'Unknown',
      status: req.status,
      details: `${formatDate(req.start_date)} - ${formatDate(req.end_date)}`,
      createdAt: req.created_at,
      navigateTo: `/leave-requests/${req.id}`
    }))

    // Merge and sort by created_at descending, limit to 10
    return [...swapUnified, ...leaveUnified]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [swapRequests, leaveRequests, formatDate])

  return (
    <div className="pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's an overview of your shift management.
        </p>
      </div>

      {/* Statistics Cards - Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsLoading ? (
          // Loading skeleton
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="bg-gray-200 rounded-lg p-3 w-14 h-14"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Staff"
              value={stats?.totalStaff || 0}
              icon={UsersIcon}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Active Shifts"
              value={stats?.activeShifts || 0}
              icon={CalendarIcon}
              bgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Pending Requests"
              value={stats?.pendingRequests || 0}
              icon={ClockIcon}
              bgColor="bg-yellow-100"
              iconColor="text-yellow-600"
              onClick={() => navigate(ROUTES.LEAVE_REQUESTS)}
            />
            <StatCard
              title="Open Swaps"
              value={stats?.openSwaps || 0}
              icon={SwapIcon}
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
              onClick={() => navigate(ROUTES.SWAP_REQUESTS)}
            />
          </>
        )}
      </div>

      {/* Coverage Overview - Requirements 4.1, 4.2, 4.3, 4.4, 4.5 */}
      {isManager && (
        <div className="mb-6">
          {coverageLoading ? (
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          ) : coverageData ? (
            <CoverageChart 
              data={coverageData.days.map(day => ({
                day: day.dayName,
                count: day.netCoverage,
                level: day.level
              }))} 
            />
          ) : null}
        </div>
      )}

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
          <h2 className="text-base font-medium text-gray-900">Recent Requests</h2>
          <div className="flex gap-3">
            <Link
              to={ROUTES.SWAP_REQUESTS}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Swaps
            </Link>
            <Link
              to={ROUTES.LEAVE_REQUESTS}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Leave
            </Link>
          </div>
        </div>
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No recent requests found</div>
          ) : (
            /* Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8 - Unified request list */
            <div className="divide-y divide-gray-200">
              {recentRequests.map((request) => (
                <div
                  key={`${request.type}-${request.id}`}
                  onClick={() => navigate(request.navigateTo)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      {/* Requirement 3.3 - Show requester name */}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.requesterName}
                      </p>
                      {/* Requirement 3.6 (swap) / 3.7 (leave) - Show type-specific details */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {request.details}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {/* Requirement 3.4 - Show Type Badge */}
                      <TypeBadge type={request.type} />
                      {/* Requirement 3.5 - Show Status Badge */}
                      <StatusBadge status={request.status as any} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(request.createdAt)}
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
