import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RequestManagement from '../../../pages/RequestManagement';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import * as useSwapRequestsModule from '../../../hooks/useSwapRequests';
import * as useLeaveRequestsModule from '../../../hooks/useLeaveRequests';
import * as useAuthModule from '../../../hooks/useAuth';

// Mock hooks
vi.mock('../../../hooks/useSwapRequests');
vi.mock('../../../hooks/useLeaveRequests');
vi.mock('../../../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RequestManagement Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockSwapRequests = [
    {
      id: 'swap-1',
      requester_id: 'user-1',
      target_user_id: 'user-2',
      requester: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      target: { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
      status: 'pending_tl' as const,
      requester_shift_id: 'shift-1',
      target_shift_id: 'shift-2',
      created_at: '2024-01-15T10:00:00Z',
      tl_approved_at: null,
      wfm_approved_at: null,
    },
    {
      id: 'swap-2',
      requester_id: 'user-3',
      target_user_id: 'user-4',
      requester: { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com' },
      target: { id: 'user-4', name: 'Alice Brown', email: 'alice@example.com' },
      status: 'approved' as const,
      requester_shift_id: 'shift-3',
      target_shift_id: 'shift-4',
      created_at: '2024-01-14T10:00:00Z',
      tl_approved_at: '2024-01-14T11:00:00Z',
      wfm_approved_at: '2024-01-14T12:00:00Z',
    },
    {
      id: 'swap-3',
      requester_id: 'user-5',
      target_user_id: 'user-6',
      requester: { id: 'user-5', name: 'Charlie Green', email: 'charlie@example.com' },
      target: { id: 'user-6', name: 'David Blue', email: 'david@example.com' },
      status: 'pending_wfm' as const,
      requester_shift_id: 'shift-5',
      target_shift_id: 'shift-6',
      created_at: '2024-01-16T10:00:00Z',
      tl_approved_at: '2024-01-16T11:00:00Z',
      wfm_approved_at: null,
    },
    {
      id: 'swap-4',
      requester_id: 'user-7',
      target_user_id: 'user-8',
      requester: { id: 'user-7', name: 'Eve White', email: 'eve@example.com' },
      target: { id: 'user-8', name: 'Frank Black', email: 'frank@example.com' },
      status: 'rejected' as const,
      requester_shift_id: 'shift-7',
      target_shift_id: 'shift-8',
      created_at: '2024-01-13T10:00:00Z',
      tl_approved_at: null,
      wfm_approved_at: null,
    },
  ];

  const mockLeaveRequests = [
    {
      id: 'leave-1',
      user_id: 'user-9',
      user: {
        id: 'user-9',
        name: 'Grace Yellow',
        email: 'grace@example.com',
        role: 'agent' as const,
      },
      leave_type: 'vacation',
      start_date: '2024-02-01',
      end_date: '2024-02-05',
      notes: 'Family vacation',
      status: 'pending_tl' as const,
      created_at: '2024-01-16T10:00:00Z',
      tl_approved_at: null,
      wfm_approved_at: null,
    },
    {
      id: 'leave-2',
      user_id: 'user-10',
      user: {
        id: 'user-10',
        name: 'Henry Purple',
        email: 'henry@example.com',
        role: 'agent' as const,
      },
      leave_type: 'sick',
      start_date: '2024-01-20',
      end_date: '2024-01-22',
      notes: null,
      status: 'rejected' as const,
      created_at: '2024-01-17T10:00:00Z',
      tl_approved_at: null,
      wfm_approved_at: null,
    },
    {
      id: 'leave-3',
      user_id: 'user-11',
      user: {
        id: 'user-11',
        name: 'Iris Orange',
        email: 'iris@example.com',
        role: 'agent' as const,
      },
      leave_type: 'personal',
      start_date: '2024-03-01',
      end_date: '2024-03-03',
      notes: 'Personal matters',
      status: 'pending_wfm' as const,
      created_at: '2024-01-18T10:00:00Z',
      tl_approved_at: '2024-01-18T11:00:00Z',
      wfm_approved_at: null,
    },
    {
      id: 'leave-4',
      user_id: 'user-12',
      user: {
        id: 'user-12',
        name: 'Jack Silver',
        email: 'jack@example.com',
        role: 'agent' as const,
      },
      leave_type: 'vacation',
      start_date: '2024-04-10',
      end_date: '2024-04-15',
      notes: 'Spring break',
      status: 'approved' as const,
      created_at: '2024-01-19T10:00:00Z',
      tl_approved_at: '2024-01-19T11:00:00Z',
      wfm_approved_at: '2024-01-19T12:00:00Z',
    },
  ];

  const mockUpdateSwapRequest = vi.fn();
  const mockDeleteSwapRequest = vi.fn();
  const mockUpdateLeaveRequest = vi.fn();
  const mockDeleteLeaveRequest = vi.fn();

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

    // Mock useSwapRequests
    vi.mocked(useSwapRequestsModule.useSwapRequests).mockReturnValue({
      swapRequests: mockSwapRequests,
      isLoading: false,
      error: null,
      totalItems: mockSwapRequests.length,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: vi.fn(),
      prevPage: vi.fn(),
      goToPage: vi.fn(),
      useSwapRequest: vi.fn(),
      createSwapRequest: { mutateAsync: vi.fn() } as any,
      updateSwapRequest: { mutateAsync: mockUpdateSwapRequest } as any,
      deleteSwapRequest: { mutateAsync: mockDeleteSwapRequest } as any,
    });

    // Mock useLeaveRequests
    vi.mocked(useLeaveRequestsModule.useLeaveRequests).mockReturnValue({
      leaveRequests: mockLeaveRequests,
      isLoading: false,
      error: null,
      totalItems: mockLeaveRequests.length,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: vi.fn(),
      prevPage: vi.fn(),
      goToPage: vi.fn(),
      useLeaveRequest: vi.fn(),
      createLeaveRequest: { mutateAsync: vi.fn() } as any,
      updateLeaveRequest: { mutateAsync: mockUpdateLeaveRequest } as any,
      deleteLeaveRequest: { mutateAsync: mockDeleteLeaveRequest } as any,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <RequestManagement />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('renders the page title and description', () => {
      renderComponent();
      expect(screen.getByText('Request Management')).toBeInTheDocument();
      expect(
        screen.getByText('View and manage all swap and leave requests in one place')
      ).toBeInTheDocument();
    });

    it('renders all filter controls', () => {
      renderComponent();
      expect(screen.getByLabelText('Request Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('renders the request table', async () => {
      renderComponent();
      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('renders results count', async () => {
      renderComponent();
      await waitFor(() => {
        // 4 swap + 4 leave = 8 total requests
        expect(screen.getByText('Showing 8 of 8 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Request Table Display', () => {
    it('displays all swap requests with correct details', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Bob Wilson').length).toBeGreaterThan(0);
        expect(screen.getAllByText('→ Alice Brown').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Charlie Green').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Eve White').length).toBeGreaterThan(0);
      });
    });

    it('displays all leave requests with correct details', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByText('Grace Yellow').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('Henry Purple').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/01\/20\/2024 - 01\/22\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('Iris Orange').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Jack Silver').length).toBeGreaterThan(0);
      });
    });

    it('displays type badges for all requests', async () => {
      renderComponent();
      await waitFor(() => {
        const swapBadges = screen.getAllByText('Swap');
        const leaveBadges = screen.getAllByText('Leave');
        // Each badge appears twice (desktop + mobile view)
        expect(swapBadges.length).toBeGreaterThan(0);
        expect(leaveBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays status badges correctly', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByText('Pending TL').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pending WFM').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
      });
    });

    it('displays user avatars with initials', async () => {
      renderComponent();
      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
        // Check for avatar elements
        const avatars = document.querySelectorAll('.bg-blue-100');
        expect(avatars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('filters requests by type - swap only', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeFilter = screen.getByLabelText('Request Type');
      await user.selectOptions(typeFilter, 'swap');

      await waitFor(() => {
        // Swap requests should be visible
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
        expect(screen.getAllByText('→ Alice Brown').length).toBeGreaterThan(0);
        // Leave requests should not be visible
        expect(screen.queryByText(/02\/01\/2024 - 02\/05\/2024/)).not.toBeInTheDocument();
        expect(screen.queryByText(/01\/20\/2024 - 01\/22\/2024/)).not.toBeInTheDocument();
      });
    });

    it('filters requests by type - leave only', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeFilter = screen.getByLabelText('Request Type');
      await user.selectOptions(typeFilter, 'leave');

      await waitFor(() => {
        // Leave requests should be visible
        expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/01\/20\/2024 - 01\/22\/2024/).length).toBeGreaterThan(0);
        // Swap requests should not be visible
        expect(screen.queryByText('→ Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('→ Alice Brown')).not.toBeInTheDocument();
      });
    });

    it('filters requests by status - pending_tl', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusFilter = screen.getByLabelText('Status');
      await user.selectOptions(statusFilter, 'pending_tl');

      await waitFor(() => {
        // Only pending_tl requests should be visible
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
        // Other status requests should not be visible
        expect(screen.queryByText('→ Alice Brown')).not.toBeInTheDocument();
        expect(screen.queryByText(/01\/20\/2024 - 01\/22\/2024/)).not.toBeInTheDocument();
      });
    });

    it('filters requests by status - pending_wfm', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusFilter = screen.getByLabelText('Status');
      await user.selectOptions(statusFilter, 'pending_wfm');

      await waitFor(() => {
        // Only pending_wfm requests should be visible
        expect(screen.getAllByText('Charlie Green').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Iris Orange').length).toBeGreaterThan(0);
      });
    });

    it('filters requests by status - approved', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusFilter = screen.getByLabelText('Status');
      await user.selectOptions(statusFilter, 'approved');

      await waitFor(() => {
        // Only approved requests should be visible
        expect(screen.getAllByText('Bob Wilson').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Jack Silver').length).toBeGreaterThan(0);
      });
    });

    it('filters requests by status - rejected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusFilter = screen.getByLabelText('Status');
      await user.selectOptions(statusFilter, 'rejected');

      await waitFor(() => {
        // Only rejected requests should be visible
        expect(screen.getAllByText('Eve White').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Henry Purple').length).toBeGreaterThan(0);
      });
    });

    it('combines type and status filters', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeFilter = screen.getByLabelText('Request Type');
      const statusFilter = screen.getByLabelText('Status');

      await user.selectOptions(typeFilter, 'swap');
      await user.selectOptions(statusFilter, 'pending_tl');

      await waitFor(() => {
        // Only swap requests with pending_tl status
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
        // Leave requests should not be visible
        expect(screen.queryByText(/02\/01\/2024 - 02\/05\/2024/)).not.toBeInTheDocument();
        // Other status swap requests should not be visible
        expect(screen.queryByText('→ Alice Brown')).not.toBeInTheDocument();
      });
    });

    it('filters leave requests by date range', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeFilter = screen.getByLabelText('Request Type');
      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');

      await user.selectOptions(typeFilter, 'leave');
      await user.type(startDateInput, '2024-01-15');
      await user.type(endDateInput, '2024-02-28');

      await waitFor(() => {
        // Only leave requests within date range should be visible
        expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/01\/20\/2024 - 01\/22\/2024/).length).toBeGreaterThan(0);
        // Leave requests outside date range should not be visible
        expect(screen.queryByText(/03\/01\/2024 - 03\/03\/2024/)).not.toBeInTheDocument();
        expect(screen.queryByText(/04\/10\/2024 - 04\/15\/2024/)).not.toBeInTheDocument();
      });
    });

    it('shows clear filters button when filters are applied', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Initially no clear button
      expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();

      // Apply a filter
      const typeFilter = screen.getByLabelText('Request Type');
      await user.selectOptions(typeFilter, 'swap');

      // Clear button should appear
      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Apply multiple filters
      const typeFilter = screen.getByLabelText('Request Type');
      const statusFilter = screen.getByLabelText('Status');
      await user.selectOptions(typeFilter, 'swap');
      await user.selectOptions(statusFilter, 'pending_tl');

      // Clear filters
      const clearButton = screen.getByText('Clear all filters');
      await user.click(clearButton);

      await waitFor(() => {
        // All requests should be visible again
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
        // Filters should be reset
        expect(typeFilter).toHaveValue('all');
        expect(statusFilter).toHaveValue('all');
      });
    });

    it('updates results count when filters are applied', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Initially showing all 8 requests
      expect(screen.getByText('Showing 8 of 8 requests')).toBeInTheDocument();

      // Filter to swap only (4 swap requests)
      const typeFilter = screen.getByLabelText('Request Type');
      await user.selectOptions(typeFilter, 'swap');

      await waitFor(() => {
        expect(screen.getByText('Showing 4 of 8 requests')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts requests by status priority - pending_wfm first', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
        const rows = table!.querySelectorAll('tbody tr');

        // First rows should be pending_wfm (highest priority)
        const firstRowText = rows[0].textContent;
        const secondRowText = rows[1].textContent;

        // Check that pending_wfm requests appear first
        expect(firstRowText).toMatch(/Charlie Green|Iris Orange/);
        expect(secondRowText).toMatch(/Charlie Green|Iris Orange/);
      });
    });

    it('sorts pending_tl after pending_wfm', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        const rows = table!.querySelectorAll('tbody tr');

        // After pending_wfm (2 requests), should be pending_tl (2 requests)
        const thirdRowText = rows[2].textContent;
        const fourthRowText = rows[3].textContent;

        expect(thirdRowText).toMatch(/John Doe|Grace Yellow/);
        expect(fourthRowText).toMatch(/John Doe|Grace Yellow/);
      });
    });

    it('sorts approved and rejected requests last', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        const rows = table!.querySelectorAll('tbody tr');

        // Last rows should be approved/rejected (lowest priority)
        const lastRowIndex = rows.length - 1;
        const lastRowText = rows[lastRowIndex].textContent;

        expect(lastRowText).toMatch(/Bob Wilson|Jack Silver|Eve White|Henry Purple/);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to swap request detail page when row is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );
      expect(johnDoeRow).toBeDefined();

      await user.click(johnDoeRow!);

      expect(mockNavigate).toHaveBeenCalledWith('/swap-requests/swap-1');
    });

    it('navigates to leave request detail page when row is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const graceRow = Array.from(rows).find((row) => row.textContent?.includes('Grace Yellow'));
      expect(graceRow).toBeDefined();

      await user.click(graceRow!);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-requests/leave-1');
    });
  });

  describe('Action Buttons - TL Role', () => {
    it('displays approve and reject buttons for TL on pending_tl requests', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );
      expect(johnDoeRow).toBeDefined();

      const actionsCell = within(johnDoeRow as HTMLElement)
        .getByText('Approve')
        .closest('td')!;
      expect(within(actionsCell).getByText('Approve')).toBeInTheDocument();
      expect(within(actionsCell).getByText('Reject')).toBeInTheDocument();
    });

    it('does not display action buttons for TL on approved requests', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const bobRow = Array.from(rows).find(
        (row) => row.textContent?.includes('Bob Wilson') && row.textContent?.includes('Alice Brown')
      );
      expect(bobRow).toBeDefined();

      // TL should not see action buttons on approved requests
      expect(within(bobRow as HTMLElement).queryByText('Approve')).not.toBeInTheDocument();
      expect(within(bobRow as HTMLElement).queryByText('Reject')).not.toBeInTheDocument();
      expect(within(bobRow as HTMLElement).queryByText('Revoke')).not.toBeInTheDocument();
    });

    it('approves a swap request and moves to pending_wfm', async () => {
      const user = userEvent.setup();
      mockUpdateSwapRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );

      const approveButton = within(johnDoeRow as HTMLElement).getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockUpdateSwapRequest).toHaveBeenCalledWith({
          id: 'swap-1',
          updates: { status: 'pending_wfm' },
        });
      });
    });

    it('rejects a leave request', async () => {
      const user = userEvent.setup();
      mockUpdateLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const graceRow = Array.from(rows).find((row) => row.textContent?.includes('Grace Yellow'));

      const rejectButton = within(graceRow as HTMLElement).getByText('Reject');
      await user.click(rejectButton);

      await waitFor(() => {
        expect(mockUpdateLeaveRequest).toHaveBeenCalledWith({
          id: 'leave-1',
          updates: { status: 'rejected' },
        });
      });
    });
  });

  describe('Action Buttons - WFM Role', () => {
    beforeEach(() => {
      // Mock user as WFM
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

    it('displays approve and reject buttons for WFM on pending_wfm requests', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const charlieRow = Array.from(rows).find((row) => row.textContent?.includes('Charlie Green'));
      expect(charlieRow).toBeDefined();

      const actionsCell = within(charlieRow as HTMLElement)
        .getByText('Approve')
        .closest('td')!;
      expect(within(actionsCell).getByText('Approve')).toBeInTheDocument();
      expect(within(actionsCell).getByText('Reject')).toBeInTheDocument();
    });

    it('displays revoke button for WFM on approved requests', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const bobRow = Array.from(rows).find(
        (row) => row.textContent?.includes('Bob Wilson') && row.textContent?.includes('Alice Brown')
      );
      expect(bobRow).toBeDefined();

      expect(within(bobRow as HTMLElement).getByText('Revoke')).toBeInTheDocument();
    });

    it('displays revoke button for WFM on rejected requests', async () => {
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const eveRow = Array.from(rows).find((row) => row.textContent?.includes('Eve White'));
      expect(eveRow).toBeDefined();

      expect(within(eveRow as HTMLElement).getByText('Revoke')).toBeInTheDocument();
    });

    it('approves a pending_wfm request directly to approved', async () => {
      const user = userEvent.setup();
      mockUpdateSwapRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const charlieRow = Array.from(rows).find((row) => row.textContent?.includes('Charlie Green'));

      const approveButton = within(charlieRow as HTMLElement).getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockUpdateSwapRequest).toHaveBeenCalledWith({
          id: 'swap-3',
          updates: { status: 'approved' },
        });
      });
    });

    it('approves a pending_tl request directly to approved (WFM can skip TL approval)', async () => {
      const user = userEvent.setup();
      mockUpdateSwapRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );

      const approveButton = within(johnDoeRow as HTMLElement).getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockUpdateSwapRequest).toHaveBeenCalledWith({
          id: 'swap-1',
          updates: { status: 'approved' },
        });
      });
    });

    it('revokes an approved swap request', async () => {
      const user = userEvent.setup();
      mockDeleteSwapRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const bobRow = Array.from(rows).find(
        (row) => row.textContent?.includes('Bob Wilson') && row.textContent?.includes('Alice Brown')
      );

      const revokeButton = within(bobRow as HTMLElement).getByText('Revoke');
      await user.click(revokeButton);

      await waitFor(() => {
        expect(mockDeleteSwapRequest).toHaveBeenCalledWith('swap-2');
      });
    });

    it('revokes a rejected leave request', async () => {
      const user = userEvent.setup();
      mockDeleteLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const henryRow = Array.from(rows).find((row) => row.textContent?.includes('Henry Purple'));

      const revokeButton = within(henryRow as HTMLElement).getByText('Revoke');
      await user.click(revokeButton);

      await waitFor(() => {
        expect(mockDeleteLeaveRequest).toHaveBeenCalledWith('leave-2');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading state while fetching swap requests', () => {
      vi.mocked(useSwapRequestsModule.useSwapRequests).mockReturnValue({
        swapRequests: [],
        isLoading: true,
        error: null,
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        goToPage: vi.fn(),
        useSwapRequest: vi.fn(),
        createSwapRequest: { mutateAsync: vi.fn() } as any,
        updateSwapRequest: { mutateAsync: vi.fn() } as any,
        deleteSwapRequest: { mutateAsync: vi.fn() } as any,
      });

      renderComponent();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('displays loading state while fetching leave requests', () => {
      vi.mocked(useLeaveRequestsModule.useLeaveRequests).mockReturnValue({
        leaveRequests: [],
        isLoading: true,
        error: null,
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        goToPage: vi.fn(),
        useLeaveRequest: vi.fn(),
        createLeaveRequest: { mutateAsync: vi.fn() } as any,
        updateLeaveRequest: { mutateAsync: vi.fn() } as any,
        deleteLeaveRequest: { mutateAsync: vi.fn() } as any,
      });

      renderComponent();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('displays empty state when no requests exist', () => {
      vi.mocked(useSwapRequestsModule.useSwapRequests).mockReturnValue({
        swapRequests: [],
        isLoading: false,
        error: null,
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        goToPage: vi.fn(),
        useSwapRequest: vi.fn(),
        createSwapRequest: { mutateAsync: vi.fn() } as any,
        updateSwapRequest: { mutateAsync: vi.fn() } as any,
        deleteSwapRequest: { mutateAsync: vi.fn() } as any,
      });

      vi.mocked(useLeaveRequestsModule.useLeaveRequests).mockReturnValue({
        leaveRequests: [],
        isLoading: false,
        error: null,
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        goToPage: vi.fn(),
        useLeaveRequest: vi.fn(),
        createLeaveRequest: { mutateAsync: vi.fn() } as any,
        updateLeaveRequest: { mutateAsync: vi.fn() } as any,
        deleteLeaveRequest: { mutateAsync: vi.fn() } as any,
      });

      renderComponent();
      expect(screen.getByText('No requests found')).toBeInTheDocument();
    });

    it('displays empty state when filters result in no matches', async () => {
      const user = userEvent.setup();
      renderComponent();

      const statusFilter = screen.getByLabelText('Status');
      await user.selectOptions(statusFilter, 'pending_acceptance');

      await waitFor(() => {
        expect(screen.getByText('No requests found')).toBeInTheDocument();
        expect(screen.getByText('Showing 0 of 8 requests')).toBeInTheDocument();
      });
    });

    it('handles action errors gracefully', async () => {
      const user = userEvent.setup();
      mockUpdateSwapRequest.mockRejectedValue(new Error('Network error'));
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );

      const approveButton = within(johnDoeRow as HTMLElement).getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockUpdateSwapRequest).toHaveBeenCalled();
        // Toast error should be displayed (handled by ToastContext)
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles requests with null user data gracefully', async () => {
      const requestsWithNullData = [
        {
          ...mockSwapRequests[0],
          requester: { id: 'user-1', name: '', email: 'john@example.com' },
        },
      ];

      vi.mocked(useSwapRequestsModule.useSwapRequests).mockReturnValue({
        swapRequests: requestsWithNullData,
        isLoading: false,
        error: null,
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        goToPage: vi.fn(),
        useSwapRequest: vi.fn(),
        createSwapRequest: { mutateAsync: vi.fn() } as any,
        updateSwapRequest: { mutateAsync: vi.fn() } as any,
        deleteSwapRequest: { mutateAsync: vi.fn() } as any,
      });

      vi.mocked(useLeaveRequestsModule.useLeaveRequests).mockReturnValue({
        leaveRequests: [],
        isLoading: false,
        error: null,
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        goToPage: vi.fn(),
        useLeaveRequest: vi.fn(),
        createLeaveRequest: { mutateAsync: vi.fn() } as any,
        updateLeaveRequest: { mutateAsync: vi.fn() } as any,
        deleteLeaveRequest: { mutateAsync: vi.fn() } as any,
      });

      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('handles user without role (agent)', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: 'agent-1',
          name: 'Agent User',
          email: 'agent@example.com',
          role: 'agent',
          created_at: '2024-01-01',
        },
        signOut: vi.fn(),
        isLoading: false,
      });

      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      // Agent should not see any action buttons
      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );

      expect(within(johnDoeRow as HTMLElement).queryByText('Approve')).not.toBeInTheDocument();
      expect(within(johnDoeRow as HTMLElement).queryByText('Reject')).not.toBeInTheDocument();
      expect(within(johnDoeRow as HTMLElement).queryByText('Revoke')).not.toBeInTheDocument();
    });

    it('handles action button click without stopping row click propagation', async () => {
      const user = userEvent.setup();
      mockUpdateSwapRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnDoeRow = Array.from(rows).find(
        (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
      );

      const approveButton = within(johnDoeRow as HTMLElement).getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockUpdateSwapRequest).toHaveBeenCalled();
        // Navigation should NOT have been called (stopPropagation works)
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('handles multiple rapid filter changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeFilter = screen.getByLabelText('Request Type');

      // Rapidly change filters
      await user.selectOptions(typeFilter, 'swap');
      await user.selectOptions(typeFilter, 'leave');
      await user.selectOptions(typeFilter, 'all');
      await user.selectOptions(typeFilter, 'swap');

      await waitFor(() => {
        // Should show only swap requests
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
        expect(screen.queryByText(/02\/01\/2024 - 02\/05\/2024/)).not.toBeInTheDocument();
      });
    });

    it('preserves filter state when data refreshes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderComponent();

      const typeFilter = screen.getByLabelText('Request Type');
      await user.selectOptions(typeFilter, 'swap');

      await waitFor(() => {
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
      });

      // Simulate data refresh by rerendering
      rerender(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <ToastProvider>
                <RequestManagement />
              </ToastProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );

      // Filter should still be applied
      await waitFor(() => {
        expect(typeFilter).toHaveValue('swap');
        expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
      });
    });
  });
});
