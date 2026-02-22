import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaveRequests from '../../../../pages/LeaveRequests/LeaveRequests';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../contexts/ToastContext';
import * as useAuthModule from '../../../../hooks/useAuth';
import * as useLeaveTypesModule from '../../../../hooks/useLeaveTypes';
import * as useLeaveRequestsModule from '../../../../hooks/useLeaveRequests';

// Mock hooks
vi.mock('../../../../hooks/useAuth');
vi.mock('../../../../hooks/useLeaveTypes');
vi.mock('../../../../hooks/useLeaveRequests');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LeaveRequests List Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockLeaveTypes = [
    { id: '1', code: 'annual', label: 'Annual Leave', color: '#3B82F6', is_active: true },
    { id: '2', code: 'sick', label: 'Sick Leave', color: '#EF4444', is_active: true },
    { id: '3', code: 'casual', label: 'Casual Leave', color: '#10B981', is_active: true },
  ];

  const mockLeaveRequests = [
    {
      id: 'leave-1',
      user_id: 'user-1',
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'agent' as const },
      leave_type: 'annual',
      start_date: '2024-02-01',
      end_date: '2024-02-05',
      notes: 'Family vacation',
      status: 'pending_tl' as const,
      created_at: '2024-01-15T10:00:00Z',
      tl_approved_at: null,
      wfm_approved_at: null,
    },
    {
      id: 'leave-2',
      user_id: 'user-2',
      user: { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'agent' as const },
      leave_type: 'sick',
      start_date: '2024-01-20',
      end_date: '2024-01-22',
      notes: null,
      status: 'approved' as const,
      created_at: '2024-01-10T10:00:00Z',
      tl_approved_at: '2024-01-10T11:00:00Z',
      wfm_approved_at: '2024-01-10T12:00:00Z',
    },
    {
      id: 'leave-3',
      user_id: 'user-3',
      user: { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com', role: 'agent' as const },
      leave_type: 'casual',
      start_date: '2024-03-01',
      end_date: '2024-03-03',
      notes: 'Personal matters',
      status: 'pending_wfm' as const,
      created_at: '2024-01-12T10:00:00Z',
      tl_approved_at: '2024-01-12T11:00:00Z',
      wfm_approved_at: null,
    },
    {
      id: 'leave-4',
      user_id: 'user-4',
      user: {
        id: 'user-4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        role: 'agent' as const,
      },
      leave_type: 'annual',
      start_date: '2024-04-10',
      end_date: '2024-04-15',
      notes: null,
      status: 'rejected' as const,
      created_at: '2024-01-08T10:00:00Z',
      tl_approved_at: null,
      wfm_approved_at: null,
    },
  ];

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

    // Mock useLeaveTypes
    vi.mocked(useLeaveTypesModule.useLeaveTypes).mockReturnValue({
      leaveTypes: mockLeaveTypes,
      isLoading: false,
      error: null,
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
              <LeaveRequests />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('renders the page title', () => {
      renderComponent();
      expect(screen.getByText('Leave Requests')).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      renderComponent();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Leave Type')).toBeInTheDocument();
    });

    it('renders leave type filter options', async () => {
      renderComponent();
      const leaveTypeSelect = screen.getByLabelText('Leave Type');
      expect(leaveTypeSelect).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Annual Leave' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Sick Leave' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Casual Leave' })).toBeInTheDocument();
      });
    });

    it('renders the requests table', async () => {
      renderComponent();
      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('displays all leave requests', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Bob Wilson').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Alice Brown').length).toBeGreaterThan(0);
      });
    });

    it('displays date ranges correctly', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getAllByText(/02\/01\/2024 - 02\/05\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/01\/20\/2024 - 01\/22\/2024/).length).toBeGreaterThan(0);
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

    it('displays user avatars with initials', async () => {
      renderComponent();
      await waitFor(() => {
        const avatars = document.querySelectorAll('.bg-blue-100');
        expect(avatars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering', () => {
    it('filters by leave type', async () => {
      const user = userEvent.setup();
      renderComponent();

      const leaveTypeSelect = screen.getByLabelText('Leave Type');
      await user.selectOptions(leaveTypeSelect, 'annual');

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Alice Brown').length).toBeGreaterThan(0);
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters by start date', async () => {
      const user = userEvent.setup();
      renderComponent();

      const startDateInput = screen.getByLabelText('Start Date');
      await user.type(startDateInput, '2024-02-01');

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters by end date', async () => {
      const user = userEvent.setup();
      renderComponent();

      const endDateInput = screen.getByLabelText('End Date');
      await user.type(endDateInput, '2024-02-28');

      await waitFor(() => {
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
        expect(screen.queryByText('Alice Brown')).not.toBeInTheDocument();
      });
    });

    it('shows clear filters button when filters are applied', async () => {
      const user = userEvent.setup();
      renderComponent();

      expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();

      const leaveTypeSelect = screen.getByLabelText('Leave Type');
      await user.selectOptions(leaveTypeSelect, 'annual');

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });

    it('clears all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const leaveTypeSelect = screen.getByLabelText('Leave Type');
      await user.selectOptions(leaveTypeSelect, 'annual');

      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);

      await waitFor(() => {
        expect(leaveTypeSelect).toHaveValue('all');
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to detail page when row is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
      });

      const table = document.querySelector('table')!;
      const rows = table.querySelectorAll('tbody tr');
      const johnRow = Array.from(rows).find((row) => row.textContent?.includes('John Doe'));

      await user.click(johnRow!);

      expect(mockNavigate).toHaveBeenCalledWith('/leave-requests/leave-1');
    });
  });

  describe('Actions - TL Role', () => {
    it('displays approve and reject buttons for pending_tl requests', async () => {
      renderComponent();

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        const rejectButtons = screen.getAllByText('Reject');
        expect(approveButtons.length).toBeGreaterThan(0);
        expect(rejectButtons.length).toBeGreaterThan(0);
      });
    });

    it('approves a pending_tl request', async () => {
      const user = userEvent.setup();
      mockUpdateLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons.length).toBeGreaterThan(0);
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockUpdateLeaveRequest).toHaveBeenCalledWith({
          id: 'leave-1',
          updates: { status: 'pending_wfm' },
        });
      });
    });

    it('rejects a pending_tl request', async () => {
      const user = userEvent.setup();
      mockUpdateLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const rejectButtons = screen.getAllByText('Reject');
        expect(rejectButtons.length).toBeGreaterThan(0);
      });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(mockUpdateLeaveRequest).toHaveBeenCalledWith({
          id: 'leave-1',
          updates: { status: 'rejected' },
        });
      });
    });
  });

  describe('Actions - WFM Role', () => {
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

    it('approves pending_wfm request to approved status', async () => {
      const user = userEvent.setup();
      mockUpdateLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons.length).toBeGreaterThan(0);
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockUpdateLeaveRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            updates: { status: 'approved' },
          })
        );
      });
    });

    it('can approve pending_tl requests directly', async () => {
      const user = userEvent.setup();
      mockUpdateLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons.length).toBeGreaterThan(0);
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockUpdateLeaveRequest).toHaveBeenCalled();
      });
    });
  });

  describe('Actions - Agent Role', () => {
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
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });

    it('displays revoke button for own pending requests', async () => {
      renderComponent();

      await waitFor(() => {
        const revokeButtons = screen.getAllByText('Revoke');
        expect(revokeButtons.length).toBeGreaterThan(0);
      });
    });

    it('revokes own pending request', async () => {
      const user = userEvent.setup();
      mockDeleteLeaveRequest.mockResolvedValue({});
      renderComponent();

      await waitFor(() => {
        const revokeButtons = screen.getAllByText('Revoke');
        expect(revokeButtons.length).toBeGreaterThan(0);
      });

      const revokeButtons = screen.getAllByText('Revoke');
      await user.click(revokeButtons[0]);

      await waitFor(() => {
        expect(mockDeleteLeaveRequest).toHaveBeenCalledWith('leave-1');
      });
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading state', () => {
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
      expect(screen.getByText('No leave requests found')).toBeInTheDocument();
    });

    it('displays loading state for leave types', () => {
      vi.mocked(useLeaveTypesModule.useLeaveTypes).mockReturnValue({
        leaveTypes: [],
        isLoading: true,
        error: null,
      });

      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles requests with missing user data', async () => {
      const requestsWithMissingData = [
        {
          ...mockLeaveRequests[0],
          user: { id: 'user-1', name: '', email: 'john@example.com', role: 'agent' as const },
        },
      ];

      vi.mocked(useLeaveRequestsModule.useLeaveRequests).mockReturnValue({
        leaveRequests: requestsWithMissingData,
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

    it('handles action errors gracefully', async () => {
      const user = userEvent.setup();
      mockUpdateLeaveRequest.mockRejectedValue(new Error('Network error'));
      renderComponent();

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons.length).toBeGreaterThan(0);
      });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(mockUpdateLeaveRequest).toHaveBeenCalled();
      });
    });
  });
});
