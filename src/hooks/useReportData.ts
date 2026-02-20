import { useQuery } from '@tanstack/react-query';
import { getMetrics } from '../services/reportsService';

/**
 * React Query hook for fetching report data
 * @param startDate - Start date in 'yyyy-MM-dd' format
 * @param endDate - End date in 'yyyy-MM-dd' format
 * @returns Query result with loading state, metrics, and users
 */
export function useReportData(startDate: string, endDate: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', startDate, endDate],
    queryFn: () => getMetrics({ startDate, endDate }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    loading: isLoading,
    metrics: data?.metrics ?? null,
    users: data?.users ?? [],
    error,
  };
}
