import { useQuery } from '@tanstack/react-query'
import { overtimeRequestsService } from '../services/overtimeRequestsService'
import type { OvertimeRequestFilters, OvertimeStatistics } from '../types/overtime'

/**
 * Hook to fetch overtime statistics
 */
export function useOvertimeStatistics(filters: OvertimeRequestFilters = {}) {
  return useQuery<OvertimeStatistics>({
    queryKey: ['overtime-statistics', filters],
    queryFn: () => overtimeRequestsService.getOvertimeStatistics(filters),
  })
}
