import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { OvertimeRequest, CreateOvertimeRequestInput } from '../types/overtime'
import { useToast } from '../contexts/ToastContext'
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache'
import type { PaginationParams, PaginatedResult } from '../types/pagination'
import { DEFAULT_PAGINATION_PARAMS, calculateOffset, calculatePagination } from '../types/pagination'

/**
 * React Query hooks for overtime request management
 * Provides queries and mutations for CRUD operations on overtime requests
 * Follows the same pattern as useLeaveRequests and useSwapRequests
 */

export function useOvertimeRequests(params: PaginationParams = {}) {
  const queryClient = useQueryClient()
  const mergedParams = { ...DEFAULT_PAGINATION_PARAMS, ...params }

  // Fetch paginated overtime requests
  const { data: paginatedData, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, mergedParams],
    queryFn: async (): Promise<PaginatedResult<OvertimeRequest & {
      requester: { id: string; name: string; department: string; employee_id: string }
    }>> => {
      const offset = calculateOffset(mergedParams)
      const { data, error, count } = await supabase
        .from('overtime_requests')
        .select(`
          *,
          requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
        `, { count: 'exact' })
        .order('created_at', { ascending: mergedParams.sortOrder === 'asc' })
        .range(offset, offset + (mergedParams.pageSize ?? 10) - 1)

      if (error) throw error

      const pagination = calculatePagination(mergedParams, count || 0)

      return {
        data: data || [],
        ...pagination,
      }
    },
    staleTime: STALE_TIMES.OVERTIME_REQUESTS,
  })

  // Computed values for convenience
  const overtimeRequests = paginatedData?.data ?? []
  const totalItems = paginatedData?.total ?? 0
  const totalPages = paginatedData?.totalPages ?? 0
  const currentPage = paginatedData?.page ?? 1
  const hasNextPage = paginatedData?.hasNextPage ?? false
  const hasPreviousPage = paginatedData?.hasPreviousPage ?? false

  // Pagination actions
  const nextPage = () => {
    if (hasNextPage) {
      queryClient.setQueryData([QUERY_KEYS.OVERTIME_REQUESTS, mergedParams], (old: PaginatedResult<OvertimeRequest> | undefined) => {
        if (!old) return old
        return {
          ...old,
          page: old.page + 1,
          hasPreviousPage: true,
          hasNextPage: old.page + 1 < old.totalPages,
        }
      })
    }
  }

  const prevPage = () => {
    if (hasPreviousPage) {
      queryClient.setQueryData([QUERY_KEYS.OVERTIME_REQUESTS, mergedParams], (old: PaginatedResult<OvertimeRequest> | undefined) => {
        if (!old) return old
        return {
          ...old,
          page: old.page - 1,
          hasPreviousPage: old.page - 1 > 1,
          hasNextPage: true,
        }
      })
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      queryClient.setQueryData([QUERY_KEYS.OVERTIME_REQUESTS, mergedParams], (old: PaginatedResult<OvertimeRequest> | undefined) => {
        if (!old) return old
        return {
          ...old,
          page,
          hasPreviousPage: page > 1,
          hasNextPage: page < old.totalPages,
        }
      })
    }
  }

  return {
    overtimeRequests,
    isLoading,
    error,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    prevPage,
    goToPage,
  }
}

/**
 * Hook to fetch a single overtime request by ID
 * @param id - The overtime request ID
 * @returns Query result with overtime request data
 */
export function useOvertimeRequest(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('overtime_requests')
        .select(`
          *,
          requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: STALE_TIMES.OVERTIME_REQUESTS,
  })
}

/**
 * Mutation hook to create a new overtime request
 * Invalidates overtime requests cache on success
 * @returns Mutation object with mutate function
 */
export function useCreateOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: async (newRequest: CreateOvertimeRequestInput) => {
      const { data, error } = await supabase
        .from('overtime_requests')
        .insert({
          ...newRequest,
          requester_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      success('Overtime request created successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create overtime request')
    },
  })
}

/**
 * Mutation hook to approve an overtime request
 * Updates status based on user role and auto-approve settings
 * Invalidates overtime requests cache on success
 * @returns Mutation object with mutate function
 */
export function useApproveOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      // Get current user to determine role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Get current request to determine status
      const { data: request, error: requestError } = await supabase
        .from('overtime_requests')
        .select('status')
        .eq('id', id)
        .single()

      if (requestError) throw requestError

      // Determine update based on role and current status
      let updates: Record<string, unknown> = {}

      if (userData.role === 'tl' && request.status === 'pending_tl') {
        // Team Lead approval
        updates = {
          tl_reviewed_by: user.id,
          tl_reviewed_at: new Date().toISOString(),
          tl_decision: 'approved',
          tl_notes: notes,
          // Status will be updated by database trigger based on auto_approve setting
          status: 'pending_wfm',
        }
      } else if (userData.role === 'wfm' && request.status === 'pending_wfm') {
        // WFM Administrator approval
        updates = {
          wfm_reviewed_by: user.id,
          wfm_reviewed_at: new Date().toISOString(),
          wfm_decision: 'approved',
          wfm_notes: notes,
          status: 'approved',
        }
      } else if (userData.role === 'wfm' && request.status === 'pending_tl') {
        // WFM can approve at any stage
        updates = {
          tl_reviewed_by: user.id,
          tl_reviewed_at: new Date().toISOString(),
          tl_decision: 'approved',
          tl_notes: notes,
          wfm_reviewed_by: user.id,
          wfm_reviewed_at: new Date().toISOString(),
          wfm_decision: 'approved',
          wfm_notes: notes,
          status: 'approved',
        }
      } else {
        throw new Error('Unauthorized to approve this request')
      }

      const { data, error } = await supabase
        .from('overtime_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, data.id] })
      success('Overtime request approved successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to approve overtime request')
    },
  })
}

/**
 * Mutation hook to reject an overtime request
 * Can be called by Team Lead or WFM Administrator
 * Invalidates overtime requests cache on success
 * @returns Mutation object with mutate function
 */
export function useRejectOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      // Get current user to determine role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Get current request to determine status
      const { data: request, error: requestError } = await supabase
        .from('overtime_requests')
        .select('status')
        .eq('id', id)
        .single()

      if (requestError) throw requestError

      // Determine update based on role and current status
      let updates: Record<string, unknown> = {}

      if (userData.role === 'tl' && request.status === 'pending_tl') {
        // Team Lead rejection
        updates = {
          tl_reviewed_by: user.id,
          tl_reviewed_at: new Date().toISOString(),
          tl_decision: 'rejected',
          tl_notes: notes,
          status: 'rejected',
        }
      } else if (userData.role === 'wfm' && (request.status === 'pending_tl' || request.status === 'pending_wfm')) {
        // WFM Administrator rejection
        updates = {
          wfm_reviewed_by: user.id,
          wfm_reviewed_at: new Date().toISOString(),
          wfm_decision: 'rejected',
          wfm_notes: notes,
          status: 'rejected',
        }
      } else {
        throw new Error('Unauthorized to reject this request')
      }

      const { data, error } = await supabase
        .from('overtime_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, data.id] })
      success('Overtime request rejected')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to reject overtime request')
    },
  })
}

/**
 * Mutation hook to cancel an overtime request
 * Can only be called by the requesting agent on pending requests
 * Invalidates overtime requests cache on success
 * @returns Mutation object with mutate function
 */
export function useCancelOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('overtime_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, data.id] })
      success('Overtime request cancelled')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to cancel overtime request')
    },
  })
}
