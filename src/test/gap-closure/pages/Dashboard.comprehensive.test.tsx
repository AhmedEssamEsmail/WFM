import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../../pages/Dashboard';
import { useAuth } from '../../../hooks/useAuth';
import { useRoleCheck } from '../../../hooks/useRoleCheck';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { useCoverageData } from '../../../hooks/useCoverageData';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useRoleCheck');
vi.mock('../../../hooks/useDashboardData');
vi.mock('../../../hooks/useDashboardStats');
vi.mock('../../../hooks/useCoverageData');

// Mock child components
vi.mock('../../../components/StatCard', () => ({
  StatCard: ({ title, value, onClick }: any) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClick}>
      <div>{title}</div>
      <div>{value}</div>
    </div>
  ),
}));

vi.mock('../../../components/CoverageChart', () => ({
  CoverageChart: ({ data }: any) => (
    <div data-testid="coverage-chart">
      {data.map((item: any, idx: number) => (
        <div key={idx}>
          {item.day}: {item.count}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../../components/TypeBadge', () => ({
  TypeBadge: ({ type }: any) => <span data-testid="type-badge">{type}</span>,
}));

vi.mock('../../../components/StatusBadge', () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard Page - Comprehensive Tests', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-1',
    email: 'manager@test.com',
    name: 'Test Manager',
    role: 'wfm' as const,
  };

  const mockSwapRequests = [
    {
      id: 'swap-1',
      requester: { id: 'user-1', name: 'John Doe' },
      target_user: { id: 'user-2', name: 'Jane Smith' },
      status: 'pending_tl' as const,
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'swap-2',
      requester: { id: 'user-3', name: 'Bob Johnson' },
      target_user: { id: 'user-4', name: 'Alice Brown' },
      status: 'approved' as const,
      created_at: '2024-01-14T09:00:00Z',
    },
  ];

  const mockLeaveRequests = [
    {
      id: 'leave-1',
      user: { id: 'user-1', name: 'John Doe' },
      start_date: '2024-01-20',
      end_date: '2024-01-22',
      status: 'pending_wfm' as const,
      created_at: '2024-01-16T11:00:00Z',
    },
  ];

  const mockStats = {
    totalStaff: 50,
    activeShifts: 120,
    pendingRequests: 8,
    openSwaps: 5,
  };

  const mockCoverageData = {
    days: [
      { dayName: 'Monday', netCoverage: 10, level: 'good' as const },
      { dayName: 'Tuesday', netCoverage: 8, level: 'warning' as const },
      { dayName: 'Wednesday', netCoverage: 5, level: 'critical' as const },
    ],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    vi.mocked(useRoleCheck).mockReturnValue({
      isManager: true,
      isWFM: true,
      isTL: false,
      isAgent: false,
    });

    vi.mocked(useDashboardData).mockReturnValue({
      data: {
        swapRequests: mockSwapRequests,
        leaveRequests: mockLeaveRequests,
      },
      isLoading: false,
    } as any);

    vi.mocked(useDashboardStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any);

    vi.mocked(useCoverageData).mockReturnValue({
      data: mockCoverageData,
      isLoading: false,
    } as any);

    mockNavigate.mockClear();
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('should render page title and welcome message', () => {
      renderPage();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, Test Manager!/)).toBeInTheDocument();
    });

    it('should render welcome message with user name', () => {
      renderPage();

      expect(screen.getByText(/Here's an overview of your shift management/)).toBeInTheDocument();
    });
  });

  describe('Statistics Cards - Manager View', () => {
    it('should render all stat cards for managers', () => {
      renderPage();

      expect(screen.getByTestId('stat-card-total-staff')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-active-shifts')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-pending-requests')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-open-swaps')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      renderPage();

      expect(screen.getByText('50')).toBeInTheDocument(); // Total Staff
      expect(screen.getByText('120')).toBeInTheDocument(); // Active Shifts
      expect(screen.getByText('8')).toBeInTheDocument(); // Pending Requests
      expect(screen.getByText('5')).toBeInTheDocument(); // Open Swaps
    });

    it('should show loading skeleton when stats are loading', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { container } = renderPage();

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should navigate to leave requests when pending requests card is clicked', () => {
      renderPage();

      const pendingCard = screen.getByTestId('stat-card-pending-requests');
      fireEvent.click(pendingCard);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-requests');
    });

    it('should navigate to swap requests when open swaps card is clicked', () => {
      renderPage();

      const swapsCard = screen.getByTestId('stat-card-open-swaps');
      fireEvent.click(swapsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/swap-requests');
    });

    it('should not render stat cards for non-managers', () => {
      vi.mocked(useRoleCheck).mockReturnValue({
        isManager: false,
        isWFM: false,
        isTL: false,
        isAgent: true,
      });

      renderPage();

      expect(screen.queryByTestId('stat-card-total-staff')).not.toBeInTheDocument();
    });
  });

  describe('Coverage Chart - Manager View', () => {
    it('should render coverage chart for managers', () => {
      renderPage();

      expect(screen.getByTestId('coverage-chart')).toBeInTheDocument();
    });

    it('should display coverage data', () => {
      renderPage();

      expect(screen.getByText(/Monday: 10/)).toBeInTheDocument();
      expect(screen.getByText(/Tuesday: 8/)).toBeInTheDocument();
      expect(screen.getByText(/Wednesday: 5/)).toBeInTheDocument();
    });

    it('should show loading skeleton when coverage is loading', () => {
      vi.mocked(useCoverageData).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { container } = renderPage();

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render coverage chart when no data', () => {
      vi.mocked(useCoverageData).mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.queryByTestId('coverage-chart')).not.toBeInTheDocument();
    });

    it('should not render coverage chart for non-managers', () => {
      vi.mocked(useRoleCheck).mockReturnValue({
        isManager: false,
        isWFM: false,
        isTL: false,
        isAgent: true,
      });

      renderPage();

      expect(screen.queryByTestId('coverage-chart')).not.toBeInTheDocument();
    });
  });

  describe('Action Cards', () => {
    it('should render new swap request action card', () => {
      renderPage();

      expect(screen.getByText('New Swap Request')).toBeInTheDocument();
      expect(screen.getByText('Request to swap shifts with a colleague')).toBeInTheDocument();
    });

    it('should render new leave request action card', () => {
      renderPage();

      expect(screen.getByText('New Leave Request')).toBeInTheDocument();
      expect(screen.getByText('Submit a new leave request')).toBeInTheDocument();
    });

    it('should navigate to create swap request page', () => {
      renderPage();

      const swapButton = screen.getByText('New Swap Request').closest('button');
      fireEvent.click(swapButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/swap-requests/create');
    });

    it('should navigate to create leave request page', () => {
      renderPage();

      const leaveButton = screen.getByText('New Leave Request').closest('button');
      fireEvent.click(leaveButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-requests/create');
    });
  });

  describe('Recent Requests Section', () => {
    it('should render recent requests header', () => {
      renderPage();

      expect(screen.getByText('Recent Requests')).toBeInTheDocument();
    });

    it('should render navigation links to swaps and leave', () => {
      renderPage();

      const swapsLink = screen.getByText('Swaps');
      const leaveLink = screen.getByText('Leave');

      expect(swapsLink).toHaveAttribute('href', '/swap-requests');
      expect(leaveLink).toHaveAttribute('href', '/leave-requests');
    });

    it('should display unified list of swap and leave requests', () => {
      renderPage();

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display swap request details', () => {
      renderPage();

      expect(screen.getByText('→ Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('→ Alice Brown')).toBeInTheDocument();
    });

    it('should display leave request details with date range', () => {
      renderPage();

      // The dates are formatted, so we check for parts of the formatted date
      expect(screen.getByText(/Jan 20, 2024 - Jan 22, 2024/)).toBeInTheDocument();
    });

    it('should display type badges for each request', () => {
      renderPage();

      const typeBadges = screen.getAllByTestId('type-badge');
      expect(typeBadges.length).toBeGreaterThan(0);
    });

    it('should display status badges for each request', () => {
      renderPage();

      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('should sort requests by created_at descending', () => {
      renderPage();

      const requests = screen.getAllByText(/John Doe|Bob Johnson/);
      // Most recent first (leave-1 created on Jan 16, swap-1 on Jan 15, swap-2 on Jan 14)
      expect(requests[0]).toHaveTextContent('John Doe');
    });

    it('should limit to 10 most recent requests', () => {
      const manyRequests = Array.from({ length: 15 }, (_, i) => ({
        id: `swap-${i}`,
        requester: { id: `user-${i}`, name: `User ${i}` },
        target_user: { id: `user-${i + 100}`, name: `Target ${i}` },
        status: 'pending_tl' as const,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      vi.mocked(useDashboardData).mockReturnValue({
        data: {
          swapRequests: manyRequests,
          leaveRequests: [],
        },
        isLoading: false,
      } as any);

      renderPage();

      const requestElements = screen.getAllByText(/User \d+/);
      expect(requestElements.length).toBeLessThanOrEqual(10);
    });

    it('should navigate to swap request detail when clicked', () => {
      renderPage();

      const swapRequest = screen.getByText('→ Jane Smith').closest('div[class*="cursor-pointer"]');
      fireEvent.click(swapRequest!);

      expect(mockNavigate).toHaveBeenCalledWith('/swap-requests/swap-1');
    });

    it('should navigate to leave request detail when clicked', () => {
      renderPage();

      const leaveRequest = screen.getByText(/Jan 20, 2024/).closest('div[class*="cursor-pointer"]');
      fireEvent.click(leaveRequest!);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-requests/leave-1');
    });

    it('should show loading spinner when data is loading', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      renderPage();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show empty state when no requests', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: {
          swapRequests: [],
          leaveRequests: [],
        },
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.getByText('No recent requests found')).toBeInTheDocument();
    });
  });

  describe('Data Merging and Sorting', () => {
    it('should merge swap and leave requests correctly', () => {
      renderPage();

      // Should have 3 total requests (2 swaps + 1 leave)
      const typeBadges = screen.getAllByTestId('type-badge');
      expect(typeBadges).toHaveLength(3);
    });

    it('should handle empty swap requests', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: {
          swapRequests: [],
          leaveRequests: mockLeaveRequests,
        },
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('→ Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle empty leave requests', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: {
          swapRequests: mockSwapRequests,
          leaveRequests: [],
        },
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.getByText('→ Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText(/Jan 20, 2024/)).not.toBeInTheDocument();
    });

    it('should handle missing user data gracefully', () => {
      const requestWithoutUser = {
        id: 'swap-3',
        requester: null,
        target_user: null,
        status: 'pending_tl' as const,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.mocked(useDashboardData).mockReturnValue({
        data: {
          swapRequests: [requestWithoutUser as any],
          leaveRequests: [],
        },
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle undefined dashboard data', () => {
      vi.mocked(useDashboardData).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.getByText('No recent requests found')).toBeInTheDocument();
    });

    it('should handle undefined stats data', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderPage();

      // Should show 0 for all stats
      const statCards = screen.getAllByText('0');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should handle missing user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        isLoading: false,
      });

      renderPage();

      // Should still render but without user name
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderPage();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Dashboard');
    });

    it('should have accessible action buttons', () => {
      renderPage();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible links', () => {
      renderPage();

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
