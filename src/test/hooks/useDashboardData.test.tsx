import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '../../hooks/useDashboardData';
import { AuthContext } from '../../contexts/AuthContext';
import { dashboardService, type DashboardData } from '../../services/dashboardService';
import type { User } from '../../types';
import { MOCK_USERS, MOCK_SWAP_REQUESTS, MOCK_LEAVE_REQUESTS } from '../fixtures/testData';

// Mock the dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getPendingItems: vi.fn(),
  },
}));

describe('useDashboardData Hook', () => {
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

  afterEach(() => {
    queryClient.clear();
  });

  const createQueryWrapper = (user: User | null) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user,
            supabaseUser: null,
            session: null,
            loading: false,
            isAuthenticated: !!user,
            signUp: async () => ({ error: null }),
            signIn: async () => ({ error: null, session: null }),
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  describe('Dashboard data aggregation', () => {
    it('should fetch dashboard data for authenticated user', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(dashboardService.getPendingItems).toHaveBeenCalledWith(MOCK_USERS.agent.id, false);
    });

    it('should aggregate swap and leave requests together', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any, MOCK_SWAP_REQUESTS.approved as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any, MOCK_LEAVE_REQUESTS.approved as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.wfm),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.swapRequests).toHaveLength(2);
      expect(result.current.data?.leaveRequests).toHaveLength(2);
    });

    it('should handle empty dashboard data', async () => {
      const mockData: DashboardData = {
        swapRequests: [],
        leaveRequests: [],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.swapRequests).toEqual([]);
      expect(result.current.data?.leaveRequests).toEqual([]);
    });
  });

  describe('Filtering operations', () => {
    it('should filter data for agent users (non-managers)', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify service was called with isManager=false for agent
      expect(dashboardService.getPendingItems).toHaveBeenCalledWith(MOCK_USERS.agent.id, false);
    });

    it('should filter data for TL users (managers)', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any, MOCK_SWAP_REQUESTS.approved as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any, MOCK_LEAVE_REQUESTS.approved as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.teamLead),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify service was called with isManager=true for TL
      expect(dashboardService.getPendingItems).toHaveBeenCalledWith(MOCK_USERS.teamLead.id, true);
    });

    it('should filter data for WFM users (managers)', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any, MOCK_SWAP_REQUESTS.approved as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any, MOCK_LEAVE_REQUESTS.approved as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.wfm),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify service was called with isManager=true for WFM
      expect(dashboardService.getPendingItems).toHaveBeenCalledWith(MOCK_USERS.wfm.id, true);
    });
  });

  describe('Sorting operations', () => {
    it('should maintain sorting order from service', async () => {
      // Create requests with different timestamps
      const olderRequest = {
        ...MOCK_SWAP_REQUESTS.approved,
        created_at: '2024-01-10T10:00:00Z',
      };
      const newerRequest = {
        ...MOCK_SWAP_REQUESTS.pending,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockData: DashboardData = {
        swapRequests: [newerRequest as any, olderRequest as any],
        leaveRequests: [],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.wfm),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify order is maintained from service
      expect(result.current.data?.swapRequests[0].created_at).toBe('2024-01-15T10:00:00Z');
      expect(result.current.data?.swapRequests[1].created_at).toBe('2024-01-10T10:00:00Z');
    });

    it('should handle sorting for leave requests', async () => {
      const olderLeave = {
        ...MOCK_LEAVE_REQUESTS.approved,
        created_at: '2024-01-10T10:00:00Z',
      };
      const newerLeave = {
        ...MOCK_LEAVE_REQUESTS.pending,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockData: DashboardData = {
        swapRequests: [],
        leaveRequests: [newerLeave as any, olderLeave as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.wfm),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify order is maintained from service
      expect(result.current.data?.leaveRequests[0].created_at).toBe('2024-01-15T10:00:00Z');
      expect(result.current.data?.leaveRequests[1].created_at).toBe('2024-01-10T10:00:00Z');
    });
  });

  describe('Data caching behavior', () => {
    it('should cache results for 2 minutes', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result, rerender } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstData = result.current.data;
      expect(dashboardService.getPendingItems).toHaveBeenCalledTimes(1);

      // Rerender should use cached data
      rerender();

      expect(result.current.data).toBe(firstData);
      expect(result.current.isLoading).toBe(false);
      // Should not call service again due to caching
      expect(dashboardService.getPendingItems).toHaveBeenCalledTimes(1);
    });

    it('should use separate cache keys for different users', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      // Render for agent
      const { result: agentResult } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(agentResult.current.isLoading).toBe(false);
      });

      expect(dashboardService.getPendingItems).toHaveBeenCalledWith(MOCK_USERS.agent.id, false);

      // Render for WFM - should trigger new fetch
      const { result: wfmResult } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.wfm),
      });

      await waitFor(() => {
        expect(wfmResult.current.isLoading).toBe(false);
      });

      expect(dashboardService.getPendingItems).toHaveBeenCalledWith(MOCK_USERS.wfm.id, true);

      // Should have been called twice - once for each user
      expect(dashboardService.getPendingItems).toHaveBeenCalledTimes(2);
    });

    it('should use separate cache keys for manager vs non-manager', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      // Render for agent (non-manager)
      const { result: agentResult } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(agentResult.current.isLoading).toBe(false);
      });

      // Render for TL (manager)
      const { result: tlResult } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.teamLead),
      });

      await waitFor(() => {
        expect(tlResult.current.isLoading).toBe(false);
      });

      // Should have separate cache entries
      expect(dashboardService.getPendingItems).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors', async () => {
      const mockError = new Error('Service error');
      vi.mocked(dashboardService.getPendingItems).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should throw error when user is not authenticated', async () => {
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(null),
      });

      // Query should be disabled when no user
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch data when user is null', async () => {
      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(null),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Service should not be called when user is null
      expect(dashboardService.getPendingItems).not.toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      vi.mocked(dashboardService.getPendingItems).mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.wfm),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      let callCount = 0;
      vi.mocked(dashboardService.getPendingItems).mockImplementation(async () => {
        callCount++;
        return {
          swapRequests: callCount === 1 ? [MOCK_SWAP_REQUESTS.pending as any] : [],
          leaveRequests: callCount === 1 ? [MOCK_LEAVE_REQUESTS.pending as any] : [],
        };
      });

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial data should have requests
      expect(result.current.data?.swapRequests).toHaveLength(1);
      expect(result.current.data?.leaveRequests).toHaveLength(1);

      // Refetch data
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After refetch, should have empty arrays
      expect(result.current.data?.swapRequests).toHaveLength(0);
      expect(result.current.data?.leaveRequests).toHaveLength(0);
      expect(dashboardService.getPendingItems).toHaveBeenCalledTimes(2);
    });

    it('should handle refetch errors', async () => {
      let callCount = 0;
      vi.mocked(dashboardService.getPendingItems).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
            leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
          };
        }
        throw new Error('Refetch failed');
      });

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();

      // Refetch should trigger error
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle null data from service', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: [],
      });

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.swapRequests).toEqual([]);
      expect(result.current.data?.leaveRequests).toEqual([]);
    });

    it('should handle service returning only swap requests', async () => {
      const mockData: DashboardData = {
        swapRequests: [MOCK_SWAP_REQUESTS.pending as any],
        leaveRequests: [],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.swapRequests).toHaveLength(1);
      expect(result.current.data?.leaveRequests).toHaveLength(0);
    });

    it('should handle service returning only leave requests', async () => {
      const mockData: DashboardData = {
        swapRequests: [],
        leaveRequests: [MOCK_LEAVE_REQUESTS.pending as any],
      };

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createQueryWrapper(MOCK_USERS.agent),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.swapRequests).toHaveLength(0);
      expect(result.current.data?.leaveRequests).toHaveLength(1);
    });
  });
});
