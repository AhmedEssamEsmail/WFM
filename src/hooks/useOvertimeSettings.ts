import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeSettingsService } from '../services/overtimeSettingsService';
import type { OvertimeSettings } from '../types/overtime';
import { useToast } from '../contexts/ToastContext';
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache';

/**
 * React Query hooks for overtime settings management
 * Provides queries and mutations for retrieving and updating overtime settings
 * Follows the same pattern as other hooks in the codebase
 */

/**
 * Hook to fetch overtime settings
 * Retrieves all configurable overtime settings including limits, auto-approve, and deadlines
 * @returns Query result with overtime settings data
 */
export function useOvertimeSettings() {
  return useQuery({
    queryKey: [QUERY_KEYS.OVERTIME_SETTINGS],
    queryFn: async () => {
      return await overtimeSettingsService.getOvertimeSettings();
    },
    staleTime: STALE_TIMES.OVERTIME_SETTINGS,
  });
}

/**
 * Mutation hook to update a specific overtime setting
 * Invalidates overtime settings cache on success
 * @returns Mutation object with mutate function
 */
export function useUpdateOvertimeSetting() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: keyof OvertimeSettings;
      value: OvertimeSettings[keyof OvertimeSettings];
    }) => {
      await overtimeSettingsService.updateOvertimeSetting(key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OVERTIME_SETTINGS] });
      success('Overtime setting updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update overtime setting');
    },
  });
}
