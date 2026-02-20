import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../pages/Dashboard';
import { AuthContext } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { dashboardService } from '../../services/dashboardService';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import type { User, SwapRequest, LeaveRequest } from '../../types';

// Mock dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getPendingItems: vi.fn(),
  },
}));

// Mock useDashboardStats hook
vi.mock('../../hooks/useDashboardStats', () => ({
  useDashboardStats: vi.fn(),
}));

// Mock useLeaveTypes hook
vi.mock('../../hooks/useLeaveTypes', () => ({
  useLeaveTypes: () => ({
    leaveTypes: [
      { code: 'AL', label: 'Annual Leave', color: '#3B82F6' },
      { code: 'SL', label: 'Sick Leave', color: '#EF4444' },
    ],
  }),
}));

describe('Dashboard Component', () => {
  let queryClient: QueryClient;
  let mockUser: User;

  const mockSwapRequests: SwapRequest[] = [
    {
      id: 'swap-1',
      requester_id: 'user-1',
      target_user_id: 'user-2',
      requester_shift_id: 'shift-1',
      target_shift_id: 'shift-2',
      status: 'pending_acceptance',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      requester: {
        id: 'user-1',
        email: 'requester@dabdoob.com',
        name: 'John Requester',
        role: 'agent',
        created_at: '2024-01-01T00:00:00Z',
      },
      target_user: {
        id: 'user-2',
        email: 'target@dabdoob.com',
        name: 'Jane Target',
        role: 'agent',
        created_at: '2024-01-01T00:00:00Z',
      },
    } as any,
  ];

  const mockLeaveRequests: LeaveRequest[] = [
    {
      id: 'leave-1',
      user_id: 'user-1',
      leave_type: 'AL',
      start_date: '2024-02-01',
      end_date: '2024-02-05',
      status: 'pending_tl',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      user: {
        id: 'user-1',
        email: 'user@dabdoob.com',
        name: 'John Doe',
        role: 'agent',
        created_at: '2024-01-01T00:00:00Z',
      },
    } as any,
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUser = {
      id: 'user-1',
      email: 'user@dabdoob.com',
      name: 'John Doe',
      role: 'wfm', // Changed to wfm so stat cards are visible
      created_at: '2024-01-01T00:00:00Z',
    };

    // Mock useDashboardStats to return default stats
    vi.mocked(useDashboardStats).mockReturnValue({
      data: {
        totalStaff: 10,
        activeShifts: 5,
        pendingRequests: 3,
        openSwaps: 2,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.clearAllMocks();
  });

  const renderDashboard = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <ToastProvider>
              <Dashboard />
            </ToastProvider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Rendering with data', () => {
    it('should render dashboard with user name', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: mockSwapRequests as any,
        leaveRequests: mockLeaveRequests as any,
      });

      renderDashboard();

      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    });

    it('should render stat cards with correct values', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: [],
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Staff')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Active Shifts')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Pending Requests')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Open Swaps')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should show loading skeleton for stat cards when loading', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: [],
      });

      renderDashboard();

      // Check for loading skeleton by class name
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render action cards', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: [],
      });

      renderDashboard();

      expect(screen.getByText('New Swap Request')).toBeInTheDocument();
      expect(screen.getByText('New Leave Request')).toBeInTheDocument();
    });

    it('should render swap requests when data is available', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: mockSwapRequests as any,
        leaveRequests: [],
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Requester')).toBeInTheDocument();
        expect(screen.getByText('→ Jane Target')).toBeInTheDocument();
        // Check for TypeBadge and StatusBadge
        expect(screen.getByText('Swap')).toBeInTheDocument();
      });
    });

    it('should render leave requests when data is available', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: mockLeaveRequests as any,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Check for TypeBadge using aria-label
        expect(screen.getByLabelText('Request type: Leave')).toBeInTheDocument();
      });
    });

    it('should render unified recent requests with both swap and leave requests', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: mockSwapRequests as any,
        leaveRequests: mockLeaveRequests as any,
      });

      renderDashboard();

      await waitFor(() => {
        // Check for unified section title
        expect(screen.getByText('Recent Requests')).toBeInTheDocument();
        // Check both request types are displayed
        expect(screen.getByText('John Requester')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Check for type badges using aria-labels
        expect(screen.getByLabelText('Request type: Swap')).toBeInTheDocument();
        expect(screen.getByLabelText('Request type: Leave')).toBeInTheDocument();
      });
    });

    it('should limit recent requests to 10 items', async () => {
      // Create 15 swap requests
      const manySwapRequests = Array.from({ length: 15 }, (_, i) => ({
        id: `swap-${i}`,
        requester_id: 'user-1',
        target_user_id: 'user-2',
        requester_shift_id: 'shift-1',
        target_shift_id: 'shift-2',
        status: 'pending_acceptance',
        created_at: new Date(2024, 0, i + 1).toISOString(),
        updated_at: new Date(2024, 0, i + 1).toISOString(),
        requester: {
          id: 'user-1',
          email: 'requester@dabdoob.com',
          name: `Requester ${i}`,
          role: 'agent',
          created_at: '2024-01-01T00:00:00Z',
        },
        target_user: {
          id: 'user-2',
          email: 'target@dabdoob.com',
          name: 'Jane Target',
          role: 'agent',
          created_at: '2024-01-01T00:00:00Z',
        },
      }));

      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: manySwapRequests as any,
        leaveRequests: [],
      });

      renderDashboard();

      await waitFor(() => {
        // Count the number of request items (each has a unique requester name)
        const requestItems = document.querySelectorAll('[class*="hover:bg-gray-50"]');
        // Should be 10 or fewer (10 requests + action cards)
        expect(requestItems.length).toBeLessThanOrEqual(12); // 10 requests + 2 action cards
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading spinner for swap requests', () => {
      vi.mocked(dashboardService.getPendingItems).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderDashboard();

      // Check for loading spinner by class name
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should hide loading spinner after data loads', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: [],
      });

      renderDashboard();

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBe(0);
      });
    });
  });

  describe('Error states', () => {
    it('should handle swap requests fetch error gracefully', async () => {
      vi.mocked(dashboardService.getPendingItems).mockRejectedValue(
        new Error('Failed to fetch dashboard data')
      );

      renderDashboard();

      await waitFor(() => {
        expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
      });

      // Dashboard should still render even with error
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    });

    it('should handle leave requests fetch error gracefully', async () => {
      vi.mocked(dashboardService.getPendingItems).mockRejectedValue(
        new Error('Failed to fetch dashboard data')
      );

      renderDashboard();

      await waitFor(() => {
        expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
      });

      // Dashboard should still render even with error
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    });

    it('should show empty state when no requests', async () => {
      vi.mocked(dashboardService.getPendingItems).mockResolvedValue({
        swapRequests: [],
        leaveRequests: [],
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('No recent requests found')).toBeInTheDocument();
      });
    });
  });
});
