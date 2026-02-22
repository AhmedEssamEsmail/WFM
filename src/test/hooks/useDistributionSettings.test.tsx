import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDistributionSettings } from '../../hooks/useDistributionSettings';
import { distributionSettingsService } from '../../services/distributionSettingsService';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock services
vi.mock('../../services/distributionSettingsService', () => ({
  distributionSettingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    resetToDefaults: vi.fn(),
  },
}));

describe('useDistributionSettings', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );

  const mockSettingsMap = new Map([
    ['AM', { shift_type: 'AM', min_agents: 5, max_agents: 10, priority: 1 }],
    ['PM', { shift_type: 'PM', min_agents: 4, max_agents: 8, priority: 2 }],
  ]);

  it('should fetch distribution settings', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toHaveLength(2);
    expect(result.current.settingsMap).toEqual(mockSettingsMap);
    expect(distributionSettingsService.getSettings).toHaveBeenCalledOnce();
  });

  it('should convert settings map to array', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Array.isArray(result.current.settings)).toBe(true);
    expect(result.current.settings).toContainEqual({
      shift_type: 'AM',
      min_agents: 5,
      max_agents: 10,
      priority: 1,
    });
  });

  it('should handle empty settings', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(new Map());

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toEqual([]);
    expect(result.current.settingsMap?.size).toBe(0);
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch settings');
    vi.mocked(distributionSettingsService.getSettings).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.settings).toEqual([]);
  });

  it('should update settings successfully', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);
    vi.mocked(distributionSettingsService.updateSettings).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updates = [{ shift_type: 'AM' as const, min_agents: 6 }];
    result.current.updateSettings.mutate(updates);

    await waitFor(() => expect(result.current.updateSettings.isSuccess).toBe(true));

    expect(distributionSettingsService.updateSettings).toHaveBeenCalledWith(updates);
  });

  it('should handle update errors', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);
    const mockError = new Error('Update failed');
    vi.mocked(distributionSettingsService.updateSettings).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateSettings.mutate([{ shift_type: 'AM' as const, min_agents: 6 }]);

    await waitFor(() => expect(result.current.updateSettings.isError).toBe(true));

    expect(result.current.updateSettings.error).toEqual(mockError);
  });

  it('should reset to defaults successfully', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);
    vi.mocked(distributionSettingsService.resetToDefaults).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.resetToDefaults.mutate();

    await waitFor(() => expect(result.current.resetToDefaults.isSuccess).toBe(true));

    expect(distributionSettingsService.resetToDefaults).toHaveBeenCalledOnce();
  });

  it('should handle reset errors', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);
    const mockError = new Error('Reset failed');
    vi.mocked(distributionSettingsService.resetToDefaults).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.resetToDefaults.mutate();

    await waitFor(() => expect(result.current.resetToDefaults.isError).toBe(true));

    expect(result.current.resetToDefaults.error).toEqual(mockError);
  });

  it('should get settings by shift type', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const amSettings = result.current.getSettingsByShiftType('AM' as any);
    expect(amSettings).toEqual({
      shift_type: 'AM',
      min_agents: 5,
      max_agents: 10,
      priority: 1,
    });

    const betSettings = result.current.getSettingsByShiftType('BET' as any);
    expect(betSettings).toBeUndefined();
  });

  it('should invalidate cache after successful update', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);
    vi.mocked(distributionSettingsService.updateSettings).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateSettings.mutate([{ shift_type: 'AM' as const, min_agents: 6 }]);

    await waitFor(() => expect(result.current.updateSettings.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should invalidate cache after successful reset', async () => {
    vi.mocked(distributionSettingsService.getSettings).mockResolvedValue(mockSettingsMap);
    vi.mocked(distributionSettingsService.resetToDefaults).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDistributionSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.resetToDefaults.mutate();

    await waitFor(() => expect(result.current.resetToDefaults.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
