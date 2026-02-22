import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OvertimeRequests from '../../../../pages/OvertimeRequests/OvertimeRequests';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../contexts/ToastContext';
import * as useAuthModule from '../../../../hooks/useAuth';
import * as useOvertimeRequestsModule from '../../../../hooks/useOvertimeRequests';

// Mock hooks
vi.mock('../../../../hooks/useAuth');
vi.mock('../../../../hooks/useOvertimeRequests');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OvertimeRequests List Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Use recent dates to pass the default "last 30 days" filter
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  const mockOvertimeRequests = [
    {
      id: 'ot-1',
      requester_id: 'user-1',
      requester: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'agent' as const,
        department: 'Sales',
      },
      request_date: yesterday.toISOString().split('T')[0],
      start_time: '18:00:00',
      end_time: '22:00:00',
      total_hours: 4,
      overtime_type: 'regular' as const,
      reason: 'Project deadline',
      status: 'pending_tl' as const,
      created_at: yesterday.toISOString(),
      updated_at: yesterday.toISOString(),
      tl_reviewed_by: null,
      wfm_reviewed_by: null,
      tl_reviewed_at: null,
      wfm_reviewed_at: null,
    },
    {
      id: 'ot-2',
      requester_id: 'user-2',
      requester: {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'agent' as const,
        department: 'Support',
      },
      request_date: twoDaysAgo.toISOString().split('T')[0],
      start_time: '06:00:00',
      end_time: '10:00:00',
      total_hours: 4,
      overtime_type: 'double' as const,
      reason: 'Emergency support',
      status: 'approved' as const,
      created_at: twoDaysAgo.toISOString(),
      updated_at: twoDaysAgo.toISOString(),
      tl_reviewed_by: 'tl-1',
      wfm_reviewed_by: 'wfm-1',
      tl_reviewed_at: twoDaysAgo.toISOString(),
      wfm_reviewed_at: twoDaysAgo.toISOString(),
    },
    {
      id: 'ot-3',
      requester_id: 'user-3',
      requester: {
        id: 'user-3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'agent' as const,
        department: 'Sales',
      },
      request_date: threeDaysAgo.toISOString().split('T')[0],
      start_time: '17:00:00',
      end_time: '20:00:00',
      total_hours: 3,
      overtime_type: 'regular' as const,
      reason: 'Client meeting',
      status: 'pending_wfm' as const,
      created_at: threeDaysAgo.toISOString(),
      updated_at: threeDaysAgo.toISOString(),
      tl_reviewed_by: 'tl-1',
      wfm_reviewed_by: null,
      tl_reviewed_at: threeDaysAgo.toISOString(),
      wfm_reviewed_at: null,
    },
    {
      id: 'ot-4',
      requester_id: 'user-4',
      requester: {
        id: 'user-4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        role: 'agent' as const,
        department: 'Support',
      },
      request_date: yesterday.toISOString().split('T')[0],
      start_time: '19:00:00',
      end_time: '23:00:00',
      total_hours: 4,
      overtime_type: 'regular' as const,
      reason: 'System maintenance',
      status: 'rejected' as const,
      created_at: yesterday.toISOString(),
      updated_at: yesterday.toISOString(),
      tl_reviewed_by: 'tl-1',
      wfm_reviewed_by: null,
      tl_reviewed_at: yesterday.toISOString(),
      wfm_reviewed_at: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Mock useAuth with TL role by default
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'tl-1',
        name: 'TL User',
        email: 'tl@example.com',
        role: 'tl',
        created_at: '2024-01-01',
      },
      signOut: vi.fn(),
      isLoading: false,
    });

    // Mock useOvertimeRequests
    vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
      overtimeRequests: mockOvertimeRequests,
      isLoading: false,
      error: null,
      totalItems: mockOvertimeRequests.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <OvertimeRequests />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('renders the page title', () => {
      renderComponent();
      expect(screen.getByText('Overtime Requests')).toBeInTheDocument();
    });

    it('renders new request button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /New Request/i })).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      renderComponent();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
    });

    it('renders status filter options', () => {
      renderComponent();
      const statusSelect = screen.getByLabelText('Status');
      expect(screen.getByRole('option', { name: 'All Statuses' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending TL' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending WFM' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Approved' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Rejected' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
    });

    it('renders date range filter options', () => {
      renderComponent();
      expect(screen.getByRole('option', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Last 30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument();
    });

    it('renders department filter for managers', () => {
      renderComponent();
      expect(screen.getByLabelText('Department')).toBeInTheDocument();
    });

    it('renders agent search for managers', () => {
      renderComponent();
      expect(screen.getByLabelText('Search Agent')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('displays all overtime requests', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.getByText('Emergency support')).toBeInTheDocument();
        expect(screen.getByText('Client meeting')).toBeInTheDocument();
        expect(screen.getByText('System maintenance')).toBeInTheDocument();
      });
    });

    it('displays request cards with correct information', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.getByText('Emergency support')).toBeInTheDocument();
      });
    });

    it('displays status badges', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByText('Pending TL').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pending WFM').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering', () => {
    it('filters by status', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'approved');

      await waitFor(() => {
        expect(screen.getByText('Emergency support')).toBeInTheDocument();
        expect(screen.queryByText('Project deadline')).not.toBeInTheDocument();
      });
    });

    it('filters by date range - this week', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateRangeSelect = screen.getByLabelText('Date Range');
      await user.selectOptions(dateRangeSelect, 'this_week');

      // Filtering logic is applied
      expect(dateRangeSelect).toHaveValue('this_week');
    });

    it('shows custom date inputs when custom range selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateRangeSelect = screen.getByLabelText('Date Range');
      await user.selectOptions(dateRangeSelect, 'custom');

      await waitFor(() => {
        expect(screen.getByLabelText('From Date')).toBeInTheDocument();
        expect(screen.getByLabelText('To Date')).toBeInTheDocument();
      });
    });

    it('filters by custom date range', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateRangeSelect = screen.getByLabelText('Date Range');
      await user.selectOptions(dateRangeSelect, 'custom');

      const fromDateInput = screen.getByLabelText('From Date');
      const toDateInput = screen.getByLabelText('To Date');

      await user.type(fromDateInput, '2024-02-01');
      await user.type(toDateInput, '2024-02-28');

      await waitFor(() => {
        expect(fromDateInput).toHaveValue('2024-02-01');
        expect(toDateInput).toHaveValue('2024-02-28');
      });
    });

    it('filters by department', async () => {
      const user = userEvent.setup();
      renderComponent();

      const departmentSelect = screen.getByLabelText('Department');
      await user.selectOptions(departmentSelect, 'Sales');

      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.getByText('Client meeting')).toBeInTheDocument();
        expect(screen.queryByText('Emergency support')).not.toBeInTheDocument();
      });
    });

    it('filters by agent name', async () => {
      const user = userEvent.setup();
      renderComponent();

      const agentSearchInput = screen.getByLabelText('Search Agent');
      await user.type(agentSearchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.queryByText('Emergency support')).not.toBeInTheDocument();
      });
    });

    it('shows clear filters button when filters are applied', async () => {
      const user = userEvent.setup();
      renderComponent();

      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'approved');

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'approved');

      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      await waitFor(() => {
        expect(statusSelect).toHaveValue('all');
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.getByText('Emergency support')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to create page when new request button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const newRequestButton = screen.getByRole('button', { name: /New Request/i });
      await user.click(newRequestButton);

      expect(mockNavigate).toHaveBeenCalledWith('/overtime-requests/create');
    });

    it('navigates to detail page when request card is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
      });

      const card = screen.getByText('Project deadline').closest('div[role="button"]');
      await user.click(card!);

      expect(mockNavigate).toHaveBeenCalledWith('/overtime-requests/ot-1');
    });
  });

  describe('Role-Based Display - Agent', () => {
    beforeEach(() => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'agent',
          created_at: '2024-01-01',
        },
        signOut: vi.fn(),
        isLoading: false,
      });
    });

    it('shows only own requests for agent', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.queryByText('Emergency support')).not.toBeInTheDocument();
        expect(screen.queryByText('Client meeting')).not.toBeInTheDocument();
      });
    });

    it('does not show department filter for agents', () => {
      renderComponent();
      expect(screen.queryByLabelText('Department')).not.toBeInTheDocument();
    });

    it('does not show agent search for agents', () => {
      renderComponent();
      expect(screen.queryByLabelText('Search Agent')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Display - WFM', () => {
    beforeEach(() => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: 'wfm-1',
          name: 'WFM User',
          email: 'wfm@example.com',
          role: 'wfm',
          created_at: '2024-01-01',
        },
        signOut: vi.fn(),
        isLoading: false,
      });
    });

    it('shows all requests for WFM', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Project deadline')).toBeInTheDocument();
        expect(screen.getByText('Emergency support')).toBeInTheDocument();
        expect(screen.getByText('Client meeting')).toBeInTheDocument();
        expect(screen.getByText('System maintenance')).toBeInTheDocument();
      });
    });

    it('shows department filter for WFM', () => {
      renderComponent();
      expect(screen.getByLabelText('Department')).toBeInTheDocument();
    });

    it('shows agent search for WFM', () => {
      renderComponent();
      expect(screen.getByLabelText('Search Agent')).toBeInTheDocument();
    });

    it('sorts pending requests first for WFM', async () => {
      renderComponent();

      await waitFor(() => {
        const cards = document.querySelectorAll('[role="button"]');
        // Filter out the "New Request" button
        const requestCards = Array.from(cards).filter((card) =>
          card.getAttribute('aria-label')?.includes('View overtime request')
        );
        expect(requestCards.length).toBeGreaterThan(0);
        // First card should be a pending request
        const firstCardText = requestCards[0].textContent;
        expect(firstCardText).toMatch(/Pending (TL|WFM)/);
      });
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading state', () => {
      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: [],
        isLoading: true,
        error: null,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      renderComponent();
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays empty state when no requests exist', () => {
      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: [],
        isLoading: false,
        error: null,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      renderComponent();
      expect(screen.getByText('No overtime requests')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by creating a new overtime request.')
      ).toBeInTheDocument();
    });

    it('displays empty state with filter message when filters applied', async () => {
      const user = userEvent.setup();
      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: [],
        isLoading: false,
        error: null,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      renderComponent();

      const statusSelect = screen.getByLabelText('Status');
      await user.selectOptions(statusSelect, 'approved');

      await waitFor(() => {
        expect(screen.getByText(/No requests match your filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination when multiple pages exist', () => {
      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: mockOvertimeRequests,
        isLoading: false,
        error: null,
        totalItems: 100,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });

      renderComponent();

      // Pagination component is rendered when totalPages > 1
      // Check for pagination controls
      const paginationButtons = document.querySelectorAll('button');
      const hasPaginationButtons = Array.from(paginationButtons).some(
        (btn) => btn.textContent?.includes('Previous') || btn.textContent?.includes('Next')
      );
      expect(hasPaginationButtons).toBe(true);
    });

    it('does not display pagination when only one page', () => {
      renderComponent();

      // With totalPages = 1, pagination should not be rendered
      const paginationButtons = document.querySelectorAll('button');
      const hasPaginationButtons = Array.from(paginationButtons).some(
        (btn) => btn.textContent?.includes('Previous') || btn.textContent?.includes('Next')
      );
      expect(hasPaginationButtons).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles requests with missing requester data', async () => {
      const requestsWithMissingData = [
        {
          ...mockOvertimeRequests[0],
          requester: {
            id: 'user-1',
            name: '',
            email: 'john@example.com',
            role: 'agent' as const,
            department: 'Sales',
          },
        },
      ];

      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: requestsWithMissingData,
        isLoading: false,
        error: null,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      renderComponent();

      await waitFor(() => {
        const cards = screen.getAllByRole('button');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('handles empty department list', () => {
      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: mockOvertimeRequests.map((r) => ({
          ...r,
          requester: { ...r.requester!, department: undefined },
        })),
        isLoading: false,
        error: null,
        totalItems: 4,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      renderComponent();
      const departmentSelect = screen.getByLabelText('Department');
      expect(departmentSelect).toBeInTheDocument();
    });
  });
});
