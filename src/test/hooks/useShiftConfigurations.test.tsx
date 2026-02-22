import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useShiftConfigurations } from '../../hooks/useShiftConfigurations';
import { shiftConfigurationsService } from '../../services/shiftConfigurationsService';

vi.mock('../../services/shiftConfigurationsService');

describe('useShiftConfigurations', () => {
  const mockConfigurations = [
    {
      id: '1',
      shift_code: 'AM',
      shift_label: 'Morning',
      start_time: '08:00:00',
      end_time: '16:00:00',
      active: true,
    },
    {
      id: '2',
      shift_code: 'PM',
      shift_label: 'Evening',
      start_time: '16:00:00',
      end_time: '00:00:00',
      active: true,
    },
    {
      id: '3',
      shift_code: 'OFF',
      shift_label: 'Off',
      start_time: '00:00:00',
      end_time: '00:00:00',
      active: true,
    },
  ];

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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch shift configurations', async () => {
    vi.mocked(shiftConfigurationsService.getActiveShiftConfigurations).mockResolvedValue(
      mockConfigurations
    );

    const { result } = renderHook(() => useShiftConfigurations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shiftConfigurations).toEqual(mockConfigurations);
  });

  it('should get shift display for AM shift', async () => {
    vi.mocked(shiftConfigurationsService.getActiveShiftConfigurations).mockResolvedValue(
      mockConfigurations
    );

    const { result } = renderHook(() => useShiftConfigurations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const display = result.current.getShiftDisplay('AM');
    expect(display.name).toBe('Morning');
    expect(display.timeRange).toBe('8:00 AM - 4:00 PM');
    expect(display.color).toBe('bg-sky-100 text-sky-900 border-sky-200');
  });

  it('should get shift display for PM shift', async () => {
    vi.mocked(shiftConfigurationsService.getActiveShiftConfigurations).mockResolvedValue(
      mockConfigurations
    );

    const { result } = renderHook(() => useShiftConfigurations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const display = result.current.getShiftDisplay('PM');
    expect(display.name).toBe('Evening');
    expect(display.timeRange).toBe('4:00 PM - 12:00 AM');
    expect(display.color).toBe('bg-purple-100 text-purple-900 border-purple-200');
  });

  it('should get shift display for OFF shift without time range', async () => {
    vi.mocked(shiftConfigurationsService.getActiveShiftConfigurations).mockResolvedValue(
      mockConfigurations
    );

    const { result } = renderHook(() => useShiftConfigurations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const display = result.current.getShiftDisplay('OFF');
    expect(display.name).toBe('Off');
    expect(display.timeRange).toBe('');
    expect(display.color).toBe('bg-gray-200 text-gray-900 border-gray-300');
  });

  it('should return fallback display for unknown shift', async () => {
    vi.mocked(shiftConfigurationsService.getActiveShiftConfigurations).mockResolvedValue(
      mockConfigurations
    );

    const { result } = renderHook(() => useShiftConfigurations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const display = result.current.getShiftDisplay('UNKNOWN' as any);
    expect(display.name).toBe('UNKNOWN');
    expect(display.timeRange).toBe('');
    expect(display.color).toBe('bg-gray-100 text-gray-900');
  });
});
