import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../lib/ToastContext'
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache'
import { breakSchedulesService } from '../services/breakSchedulesService'
import type { BreakScheduleUpdateRequest, AutoDistributeRequest } from '../types'

export function useBreakSchedules(date: string) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  // Fetch schedule for date
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.BREAK_SCHEDULES, date],
    queryFn: () => breakSchedulesService.getScheduleForDate(date),
    staleTime: STALE_TIMES.BREAK_SCHEDULES,
  })

  // Fetch warnings
  const { data: warnings } = useQuery({
    queryKey: [QUERY_KEYS.BREAK_WARNINGS, date],
    queryFn: () => breakSchedulesService.getWarnings(date),
    staleTime: STALE_TIMES.BREAK_WARNINGS,
  })

  // Update break schedules mutation
  const updateBreakSchedules = useMutation({
    mutationFn: (updates: BreakScheduleUpdateRequest[]) =>
      breakSchedulesService.bulkUpdateBreakSchedules(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREAK_SCHEDULES] })
      success('Break schedules updated successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update break schedules')
    },
  })

  // Dismiss warning mutation
  const dismissWarning = useMutation({
    mutationFn: (warningId: string) => breakSchedulesService.dismissWarning(warningId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREAK_WARNINGS] })
      success('Warning dismissed')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to dismiss warning')
    },
  })

  // Auto-distribute mutation
  const autoDistribute = useMutation({
    mutationFn: (request: AutoDistributeRequest) =>
      breakSchedulesService.autoDistribute(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREAK_SCHEDULES] })
      success('Breaks auto-distributed successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to auto-distribute breaks')
    },
  })

  return {
    schedules: scheduleData?.agents || [],
    intervals: [], // Will be generated from shift types
    coverageSummary: scheduleData?.summary || {},
    warnings: warnings || [],
    isLoading,
    error,
    updateBreakSchedules,
    dismissWarning,
    autoDistribute,
  }
}
