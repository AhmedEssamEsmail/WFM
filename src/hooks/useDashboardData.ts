import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { useAuth } from './useAuth'
import { queryKeys } from '../lib/queryClient'

/**
 * React Query hook for fetching dashboard data
 * Wraps dashboardService.getPendingItems with React Query for caching and state management
 * 
 * @returns Query result with dashboard data (swap requests and leave requests)
 */
export function useDashboardData() {
  const { user } = useAuth()
  const isManager = user?.role === 'tl' || user?.role === 'wfm'

  return useQuery({
    queryKey: [...queryKeys.settings(), 'dashboard', user?.id, isManager],
    queryFn: () => {
      if (!user) {
        throw new Error('User not authenticated')
      }
      return dashboardService.getPendingItems(user.id, isManager)
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - dashboard data should be relatively fresh
  })
}
