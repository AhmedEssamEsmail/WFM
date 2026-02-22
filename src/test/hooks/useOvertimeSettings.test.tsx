import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOvertimeSettings, useUpdateOvertimeSetting } from '../../hooks/useOvertimeSettings';
import { overtimeSettingsService } from '../../services/overtimeSettingsService';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock services
vi.mock('../../services/overtimeSettingsService', () => ({
  overtimeSettingsService: {
    getOvertimeSettings: vi.fn(),
    updateOvertimeSetting: vi.fn(),
  },
}));

describe('useOvertimeSettings', () => {
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

  const mockSettings = {
    max_overtime_hours_per_month: 40,
    auto_approve_threshold: 8,
    request_deadline_days: 3,
  };

  it('should fetch overtime settings', async () => {
    vi.mocked(overtimeSettingsService.getOvertimeSettings).mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useOvertimeSettings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSettings);
    expect(overtimeSettingsService.getOvertimeSettings).toHaveBeenCalledOnce();
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch settings');
    vi.mocked(overtimeSettingsService.getOvertimeSettings).mockRejectedValue(mockError);

    const { result } = renderHook(() => useOvertimeSettings(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle empty settings', async () => {
    vi.mocked(overtimeSettingsService.getOvertimeSettings).mockResolvedValue({} as any);

    const { result } = renderHook(() => useOvertimeSettings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({});
  });
});

describe('useUpdateOvertimeSetting', () => {
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

  it('should update overtime setting successfully', async () => {
    vi.mocked(overtimeSettingsService.updateOvertimeSetting).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateOvertimeSetting(), { wrapper });

    result.current.mutate({ key: 'max_overtime_hours_per_month', value: 50 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(overtimeSettingsService.updateOvertimeSetting).toHaveBeenCalledWith(
      'max_overtime_hours_per_month',
      50
    );
  });

  it('should handle update errors', async () => {
    const mockError = new Error('Update failed');
    vi.mocked(overtimeSettingsService.updateOvertimeSetting).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUpdateOvertimeSetting(), { wrapper });

    result.current.mutate({ key: 'auto_approve_threshold', value: 10 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(mockError);
  });

  it('should invalidate cache after successful update', async () => {
    vi.mocked(overtimeSettingsService.updateOvertimeSetting).mockResolvedValue(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateOvertimeSetting(), { wrapper });

    result.current.mutate({ key: 'request_deadline_days', value: 5 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should handle validation errors', async () => {
    const validationError = new Error('Invalid value');
    vi.mocked(overtimeSettingsService.updateOvertimeSetting).mockRejectedValue(validationError);

    const { result } = renderHook(() => useUpdateOvertimeSetting(), { wrapper });

    result.current.mutate({ key: 'max_overtime_hours_per_month', value: -10 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(validationError);
  });
});
