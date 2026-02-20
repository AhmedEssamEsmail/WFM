import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache';
import { distributionSettingsService } from '../services/distributionSettingsService';
import type { DistributionSettings, DistributionSettingsUpdate, ShiftType } from '../types';

export function useDistributionSettings() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  // Fetch distribution settings
  const {
    data: settingsMap,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.DISTRIBUTION_SETTINGS],
    queryFn: () => distributionSettingsService.getSettings(),
    staleTime: STALE_TIMES.SETTINGS,
  });

  // Convert Map to array for easier UI consumption
  const settings: DistributionSettings[] = settingsMap ? Array.from(settingsMap.values()) : [];

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: (updates: DistributionSettingsUpdate[]) =>
      distributionSettingsService.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DISTRIBUTION_SETTINGS] });
      success('Distribution settings updated successfully!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update distribution settings');
    },
  });

  // Reset to defaults mutation
  const resetToDefaults = useMutation({
    mutationFn: () => distributionSettingsService.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DISTRIBUTION_SETTINGS] });
      success('Distribution settings reset to defaults!');
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to reset distribution settings');
    },
  });

  // Get settings for a specific shift type
  const getSettingsByShiftType = (shiftType: ShiftType): DistributionSettings | undefined => {
    return settingsMap?.get(shiftType);
  };

  return {
    settings,
    settingsMap,
    isLoading,
    error,
    updateSettings,
    resetToDefaults,
    getSettingsByShiftType,
  };
}
