import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { overtimeRequestsService } from '../services/overtimeRequestsService'
import type { OvertimeRequestFilters, CreateOvertimeRequestInput } from '../types/overtime'
import { useToast } from '../contexts/ToastContext'
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache'

export function useOvertimeRequests(filters?: OvertimeRequestFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, filters],
    queryFn: () => overtimeRequestsService.getOvertimeRequests(filters || {}),
    staleTime: STALE_TIMES.OVERTIME_REQUESTS,
  })
}

export function useOvertimeRequest(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, id],
    queryFn: () => overtimeRequestsService.getOvertimeRequestById(id),
    enabled: !!id,
    staleTime: STALE_TIMES.OVERTIME_REQUESTS,
  })
}

export function useCreateOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: (input: CreateOvertimeRequestInput) =>
      overtimeRequestsService.createOvertimeRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      success('Overtime request created successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create overtime request')
    },
  })
}

export function useApproveOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      overtimeRequestsService.approveOvertimeRequest(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, data.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      success('Overtime request approved successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to approve overtime request')
    },
  })
}

export function useRejectOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      overtimeRequestsService.rejectOvertimeRequest(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, data.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      success('Overtime request rejected successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to reject overtime request')
    },
  })
}

export function useCancelOvertimeRequest() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useMutation({
    mutationFn: (id: string) => overtimeRequestsService.cancelOvertimeRequest(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS, data.id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_REQUESTS] })
      success('Overtime request cancelled successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to cancel overtime request')
    },
  })
}
