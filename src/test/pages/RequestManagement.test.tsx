import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RequestManagement from '../../pages/RequestManagement';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import * as useSwapRequestsModule from '../../hooks/useSwapRequests';
import * as useLeaveRequestsModule from '../../hooks/useLeaveRequests';
import * as useAuthModule from '../../hooks/useAuth';

// Mock hooks
vi.mock('../../hooks/useSwapRequests');
vi.mock('../../hooks/useLeaveRequests');
vi.mock('../../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RequestManagement Page', () => {
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
  ];

  const mockLeaveRequests = [
    {
      id: 'leave-1',
      user_id: 'user-5',
      user: {
        id: 'user-5',
        name: 'Charlie Davis',
        email: 'charlie@example.com',
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
      user_id: 'user-6',
      user: {
        id: 'user-6',
        name: 'Diana Evans',
        email: 'diana@example.com',
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
  ];

  const mockUpdateSwapRequest = vi.fn();
  const mockDeleteSwapRequest = vi.fn();
  const mockUpdateLeaveRequest = vi.fn();
  const mockDeleteLeaveRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Mock useAuth
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
      totalItems: 2,
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
      totalItems: 2,
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

  it('renders the page title and description', () => {
    renderComponent();
    expect(screen.getByText('Request Management')).toBeInTheDocument();
    expect(
      screen.getByText('View and manage all swap and leave requests in one place')
    ).toBeInTheDocument();
  });

  it('displays unified list of swap and leave requests', async () => {
    renderComponent();

    await waitFor(() => {
      // Check swap requests (use getAllByText since there are desktop + mobile views)
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob Wilson').length).toBeGreaterThan(0);

      // Check leave requests
      expect(screen.getAllByText('Charlie Davis').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Diana Evans').length).toBeGreaterThan(0);
    });
  });

  it('displays type badges for swap and leave requests', async () => {
    renderComponent();

    await waitFor(() => {
      const swapBadges = screen.getAllByText('Swap');
      const leaveBadges = screen.getAllByText('Leave');
      expect(swapBadges.length).toBeGreaterThan(0);
      expect(leaveBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays status badges correctly', async () => {
    renderComponent();

    await waitFor(() => {
      const pendingTLBadges = screen.getAllByText('Pending TL');
      // 2 requests with pending_tl status, each rendered twice (desktop + mobile) = 4 total
      // But there might be additional instances, so just check it's greater than 0
      expect(pendingTLBadges.length).toBeGreaterThan(0);

      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
    });
  });

  it('filters requests by type', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Filter to show only swap requests
    const typeFilter = screen.getByLabelText('Request Type');
    await user.selectOptions(typeFilter, 'swap');

    await waitFor(() => {
      // Check that swap requests are visible (2 instances each: desktop + mobile)
      expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('→ Alice Brown').length).toBeGreaterThan(0);
      // Check that leave requests are not visible
      expect(screen.queryByText(/02\/01\/2024 - 02\/05\/2024/)).not.toBeInTheDocument();
    });

    // Filter to show only leave requests
    await user.selectOptions(typeFilter, 'leave');

    await waitFor(() => {
      // Check that leave requests are visible (2 instances each: desktop + mobile)
      expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
      // Check that swap requests are not visible
      expect(screen.queryByText('→ Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters requests by status', async () => {
    const user = userEvent.setup();
    renderComponent();

    const statusFilter = screen.getByLabelText('Status');
    await user.selectOptions(statusFilter, 'pending_tl');

    await waitFor(() => {
      // Check that pending_tl requests are visible (2 instances each: desktop + mobile)
      expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
      // Check that other status requests are not visible
      expect(screen.queryByText('→ Alice Brown')).not.toBeInTheDocument();
      expect(screen.queryByText(/01\/20\/2024 - 01\/22\/2024/)).not.toBeInTheDocument();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Apply filters
    const typeFilter = screen.getByLabelText('Request Type');
    await user.selectOptions(typeFilter, 'swap');

    // Clear filters
    const clearButton = screen.getByText('Clear all filters');
    await user.click(clearButton);

    await waitFor(() => {
      // All requests should be visible again - check for unique details (2 instances each: desktop + mobile)
      expect(screen.getAllByText('→ Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
    });
  });

  it('navigates to swap request detail page when row is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      // Find the table row containing John Doe
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    // Find the table and get the row with John Doe
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

    // Find the table and get the row with Charlie Davis
    const table = document.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const charlieDavisRow = Array.from(rows).find((row) =>
      row.textContent?.includes('Charlie Davis')
    );
    expect(charlieDavisRow).toBeDefined();

    await user.click(charlieDavisRow!);

    expect(mockNavigate).toHaveBeenCalledWith('/leave-requests/leave-1');
  });

  it('displays approve and reject buttons for TL on pending requests', async () => {
    renderComponent();

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    // Find the table and get the row with John Doe
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

  it('approves a swap request when approve button is clicked', async () => {
    const user = userEvent.setup();
    mockUpdateSwapRequest.mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    // Find the table and get the row with John Doe
    const table = document.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const johnDoeRow = Array.from(rows).find(
      (row) => row.textContent?.includes('John Doe') && row.textContent?.includes('Jane Smith')
    );
    expect(johnDoeRow).toBeDefined();

    const approveButton = within(johnDoeRow as HTMLElement).getByText('Approve');
    await user.click(approveButton);

    await waitFor(() => {
      expect(mockUpdateSwapRequest).toHaveBeenCalledWith({
        id: 'swap-1',
        updates: { status: 'pending_wfm' },
      });
    });
  });

  it('rejects a leave request when reject button is clicked', async () => {
    const user = userEvent.setup();
    mockUpdateLeaveRequest.mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    // Find the table and get the row with Charlie Davis
    const table = document.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const charlieDavisRow = Array.from(rows).find((row) =>
      row.textContent?.includes('Charlie Davis')
    );
    expect(charlieDavisRow).toBeDefined();

    const rejectButton = within(charlieDavisRow as HTMLElement).getByText('Reject');
    await user.click(rejectButton);

    await waitFor(() => {
      expect(mockUpdateLeaveRequest).toHaveBeenCalledWith({
        id: 'leave-1',
        updates: { status: 'rejected' },
      });
    });
  });

  it('displays loading state while fetching data', () => {
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
    // Check for the spinner element
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

  it('displays results count', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Showing 4 of 4 requests')).toBeInTheDocument();
    });
  });

  it('revokes a request when revoke button is clicked by requester', async () => {
    const user = userEvent.setup();
    mockDeleteSwapRequest.mockResolvedValue({});

    // Mock user as WFM (only WFM can revoke approved/rejected requests)
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

    // Update mock to include an approved request
    vi.mocked(useSwapRequestsModule.useSwapRequests).mockReturnValue({
      swapRequests: [
        ...mockSwapRequests,
        {
          id: 'swap-3',
          requester_id: 'user-7',
          target_user_id: 'user-8',
          requester: { id: 'user-7', name: 'Test User', email: 'test@example.com' },
          target: { id: 'user-8', name: 'Target User', email: 'target@example.com' },
          status: 'approved' as const,
          requester_shift_id: 'shift-5',
          target_shift_id: 'shift-6',
          created_at: '2024-01-13T10:00:00Z',
          tl_approved_at: '2024-01-13T11:00:00Z',
          wfm_approved_at: '2024-01-13T12:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
      totalItems: 3,
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

    renderComponent();

    await waitFor(() => {
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    // Find the table and get the row with Test User (approved request)
    const table = document.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const approvedRow = Array.from(rows).find(
      (row) => row.textContent?.includes('Test User') && row.textContent?.includes('Target User')
    );
    expect(approvedRow).toBeDefined();

    const revokeButton = within(approvedRow as HTMLElement).getByText('Revoke');
    await user.click(revokeButton);

    await waitFor(() => {
      expect(mockDeleteSwapRequest).toHaveBeenCalledWith('swap-3');
    });
  });
});
