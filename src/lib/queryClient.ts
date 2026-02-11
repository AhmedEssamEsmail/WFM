import { QueryClient } from '@tanstack/react-query'
import { CACHE_TIMES } from '../constants/cache'

/**
 * React Query client with optimized cache configuration
 * 
 * Cache Strategy:
 * - Stale-while-revalidate: Show cached data immediately while fetching fresh data
 * - Different stale times per data type (configured in individual queries)
 * - Automatic garbage collection after data becomes unused
 * - Retry failed requests once before showing error
 * - Refetch on reconnect to ensure data freshness
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time - data is considered fresh for 5 minutes
      // Individual queries can override this with their own staleTime
      staleTime: CACHE_TIMES.DEFAULT,
      
      // Garbage collection time - keep unused data in cache for 10 minutes
      // This allows quick navigation back to previously viewed pages
      gcTime: CACHE_TIMES.DEFAULT * 2,
      
      // Retry failed requests once before showing error
      // Helps with transient network issues
      retry: 1,
      
      // Don't refetch on window focus to reduce unnecessary requests
      // Users can manually refresh if needed
      refetchOnWindowFocus: false,
      
      // Refetch when network reconnects to ensure data is current
      refetchOnReconnect: true,
      
      // Stale-while-revalidate: Show cached data immediately while fetching
      // This provides instant UI updates with eventual consistency
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Mutations should invalidate related queries to trigger refetch
      // This is handled in individual mutation configurations
    },
  },
})

/**
 * Query key factory for consistent cache management
 * Use these functions to generate query keys for better type safety
 */
export const queryKeys = {
  // Settings
  settings: () => ['settings'] as const,
  
  // Users
  users: () => ['users'] as const,
  user: (id: string) => ['users', id] as const,
  userProfile: () => ['userProfile'] as const,
  
  // Shifts
  shifts: () => ['shifts'] as const,
  shift: (id: string) => ['shifts', id] as const,
  
  // Swap Requests
  swapRequests: () => ['swapRequests'] as const,
  swapRequest: (id: string) => ['swapRequests', id] as const,
  swapRequestsPaginated: (cursor?: string, limit?: number) => 
    ['swapRequests', 'paginated', cursor, limit] as const,
  
  // Leave Requests
  leaveRequests: () => ['leaveRequests'] as const,
  leaveRequest: (id: string) => ['leaveRequests', id] as const,
  leaveRequestsPaginated: (cursor?: string, limit?: number) => 
    ['leaveRequests', 'paginated', cursor, limit] as const,
  
  // Leave Balances
  leaveBalances: () => ['leaveBalances'] as const,
  leaveBalance: (userId: string) => ['leaveBalances', userId] as const,
  leaveTypes: () => ['leaveTypes'] as const,
  
  // Headcount
  employees: () => ['employees'] as const,
  employee: (id: string) => ['employees', id] as const,
  employeesPaginated: (cursor?: string, limit?: number) => 
    ['employees', 'paginated', cursor, limit] as const,
  departments: () => ['departments'] as const,
  
  // Comments
  comments: (entityType: string, entityId: string) => 
    ['comments', entityType, entityId] as const,
}

