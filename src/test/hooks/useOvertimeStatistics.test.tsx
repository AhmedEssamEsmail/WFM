import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOvertimeStatistics } from '../../hooks/useOvertimeStatistics';
import { overtimeRequestsService } from '../../services/overtimeRequestsService';

vi.mock('../../services/overtimeRequestsService');

describe('useOvertimeStatistics', () => {
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

  const mockStatistics = {
    summary: {
      total: 50,
      approved: 40,
      rejected: 2,
      pending: 8,
      approval_rate: 0.8,
    },
    hours: {
      total: 120,
      approved: 100,
      pending: 15,
      rejected: 5,
    },
    by_agent: [
      { agent_id: 'a1', agent_name: 'John Doe', total_hours: 60, request_count: 25 },
      { agent_id: 'a2', agent_name: 'Jane Smith', total_hours: 60, request_count: 25 },
    ],
    by_type: [
      { type: 'regular', count: 30, hours: 70 },
      { type: 'emergency', count: 20, hours: 50 },
    ],
    trend: [
      { date: '2024-01-01', requests: 5, hours: 12 },
      { date: '2024-01-02', requests: 7, hours: 15 },
    ],
  };

  it('should fetch overtime statistics', async () => {
    vi.mocked(overtimeRequestsService.getOvertimeStatistics).mockResolvedValue(mockStatistics);

    const { result } = renderHook(() => useOvertimeStatistics(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockStatistics);
    });
  });

  it('should fetch statistics with filters', async () => {
    vi.mocked(overtimeRequestsService.getOvertimeStatistics).mockResolvedValue(mockStatistics);

    const filters = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      department: 'Sales',
    };

    const { result } = renderHook(() => useOvertimeStatistics(filters), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockStatistics);
    });

    expect(overtimeRequestsService.getOvertimeStatistics).toHaveBeenCalledWith(filters);
  });
});
