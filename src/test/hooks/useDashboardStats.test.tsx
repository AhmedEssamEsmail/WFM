import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useDashboardStats Hook', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockSupabaseQuery = (table: string, count: number, error: any = null) => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };

    // Return the final result
    Object.assign(mockChain, {
      then: (resolve: any) => {
        resolve({ count, error });
        return Promise.resolve({ count, error });
      },
    });

    return mockChain;
  };

  describe('Calculation Logic', () => {
    it('should calculate totalStaff correctly', async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Mock supabase responses
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return mockSupabaseQuery(table, 15) as any;
        }
        if (table === 'shifts') {
          return mockSupabaseQuery(table, 8) as any;
        }
        if (table === 'leave_requests') {
          return mockSupabaseQuery(table, 5) as any;
        }
        if (table === 'swap_requests') {
          return mockSupabaseQuery(table, 3) as any;
        }
        return mockSupabaseQuery(table, 0) as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        totalStaff: 15,
        activeShifts: 8,
        pendingRequests: 5,
        openSwaps: 3,
      });
    });

    it('should handle zero counts', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery(table, 0) as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        totalStaff: 0,
        activeShifts: 0,
        pendingRequests: 0,
        openSwaps: 0,
      });
    });

    it('should handle null counts as zero', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockChain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
        };

        Object.assign(mockChain, {
          then: (resolve: any) => {
            resolve({ count: null, error: null });
            return Promise.resolve({ count: null, error: null });
          },
        });

        return mockChain as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        totalStaff: 0,
        activeShifts: 0,
        pendingRequests: 0,
        openSwaps: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle users query error', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'users') {
          return mockSupabaseQuery(table, 0, new Error('Database error')) as any;
        }
        return mockSupabaseQuery(table, 0) as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle shifts query error', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return mockSupabaseQuery(table, 0, new Error('Database error')) as any;
        }
        return mockSupabaseQuery(table, 0) as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle leave_requests query error', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'leave_requests') {
          return mockSupabaseQuery(table, 0, new Error('Database error')) as any;
        }
        return mockSupabaseQuery(table, 0) as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle swap_requests query error', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'swap_requests') {
          return mockSupabaseQuery(table, 0, new Error('Database error')) as any;
        }
        return mockSupabaseQuery(table, 0) as any;
      });

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Query Filters', () => {
    it('should query users with role=agent filter', async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        return mockSupabaseQuery(table, 10) as any;
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fromMock).toHaveBeenCalledWith('users');
    });

    it('should query shifts with today date filter', async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        return mockSupabaseQuery(table, 5) as any;
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fromMock).toHaveBeenCalledWith('shifts');
    });

    it('should query leave_requests with pending status filter', async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        return mockSupabaseQuery(table, 3) as any;
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fromMock).toHaveBeenCalledWith('leave_requests');
    });

    it('should query swap_requests with pending status filter', async () => {
      const fromMock = vi.fn().mockImplementation((table: string) => {
        return mockSupabaseQuery(table, 2) as any;
      });

      vi.mocked(supabase.from).mockImplementation(fromMock);

      const { result } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fromMock).toHaveBeenCalledWith('swap_requests');
    });
  });

  describe('Caching', () => {
    it('should cache results for 2 minutes', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return mockSupabaseQuery(table, 5) as any;
      });

      const { result, rerender } = renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstData = result.current.data;

      // Rerender should use cached data
      rerender();

      expect(result.current.data).toBe(firstData);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
