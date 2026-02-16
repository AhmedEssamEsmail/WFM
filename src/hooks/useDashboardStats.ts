import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import { format } from 'date-fns'

/**
 * Dashboard statistics interface
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */
export interface DashboardStats {
  totalStaff: number
  activeShifts: number
  pendingRequests: number
  openSwaps: number
}

/**
 * Hook to calculate dashboard statistics
 * 
 * Calculation Logic:
 * - totalStaff: Count of users with role 'agent' (active employees)
 * - activeShifts: Count of shifts where date = today
 * - pendingRequests: Count of leave_requests where status starts with 'pending'
 * - openSwaps: Count of swap_requests where status = 'pending_acceptance' or starts with 'pending'
 * 
 * Requirements:
 * - 2.2: Display "Total Staff" stat card showing count of active employees
 * - 2.3: Display "Active Shifts" stat card showing count of shifts scheduled for current day
 * - 2.4: Display "Pending Requests" stat card showing count of leave requests awaiting approval
 * - 2.5: Display "Open Swaps" stat card showing count of swap requests awaiting acceptance or approval
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: [...queryKeys.settings(), 'dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Fetch all data in parallel
      const [usersResult, shiftsResult, leaveRequestsResult, swapRequestsResult] = await Promise.all([
        // Total Staff: Count users with role 'agent'
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'agent'),
        
        // Active Shifts: Count shifts for today
        supabase
          .from('shifts')
          .select('id', { count: 'exact', head: true })
          .eq('date', today),
        
        // Pending Requests: Count leave requests with pending status
        supabase
          .from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .or('status.eq.pending_tl,status.eq.pending_wfm'),
        
        // Open Swaps: Count swap requests with pending statuses
        supabase
          .from('swap_requests')
          .select('id', { count: 'exact', head: true })
          .or('status.eq.pending_acceptance,status.eq.pending_tl,status.eq.pending_wfm')
      ])

      // Handle errors
      if (usersResult.error) throw usersResult.error
      if (shiftsResult.error) throw shiftsResult.error
      if (leaveRequestsResult.error) throw leaveRequestsResult.error
      if (swapRequestsResult.error) throw swapRequestsResult.error

      return {
        totalStaff: usersResult.count || 0,
        activeShifts: shiftsResult.count || 0,
        pendingRequests: leaveRequestsResult.count || 0,
        openSwaps: swapRequestsResult.count || 0
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - dashboard stats should be relatively fresh
  })
}
