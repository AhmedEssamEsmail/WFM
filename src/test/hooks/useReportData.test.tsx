import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReportData } from '../../hooks/useReportData';
import { getMetrics } from '../../services/reportsService';

vi.mock('../../services/reportsService');

describe('useReportData', () => {
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

  const mockReportData = {
    metrics: {
      total_leave_requests: 25,
      total_swap_requests: 15,
      total_overtime_requests: 10,
      approved_leave: 20,
      approved_swaps: 12,
      approved_overtime: 8,
    },
    users: [
      { id: 'u1', name: 'John Doe', department: 'Sales' },
      { id: 'u2', name: 'Jane Smith', department: 'Support' },
    ],
  };

  it('should fetch report data for date range', async () => {
    vi.mocked(getMetrics).mockResolvedValue(mockReportData);

    const { result } = renderHook(() => useReportData('2024-01-01', '2024-01-31'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockReportData.metrics);
    expect(result.current.users).toEqual(mockReportData.users);
    expect(getMetrics).toHaveBeenCalledWith({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch metrics');
    vi.mocked(getMetrics).mockRejectedValue(error);

    const { result } = renderHook(() => useReportData('2024-01-01', '2024-01-31'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  it('should return null metrics when no data', async () => {
    vi.mocked(getMetrics).mockResolvedValue({ metrics: null, users: [] });

    const { result } = renderHook(() => useReportData('2024-01-01', '2024-01-31'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeNull();
    expect(result.current.users).toEqual([]);
  });
});
