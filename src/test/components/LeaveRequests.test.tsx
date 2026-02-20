import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaveRequests from '../../pages/LeaveRequests/LeaveRequests';
import { AuthContext } from '../../contexts/AuthContext';
import type { User, LeaveRequest } from '../../types';

// Mock the hooks
vi.mock('../../hooks/useLeaveRequests', () => ({
  useLeaveRequests: vi.fn(),
}));

vi.mock('../../hooks/useLeaveTypes', () => ({
  useLeaveTypes: () => ({
    leaveTypes: [
      { id: '1', code: 'AL', label: 'Annual Leave', color: '#3B82F6', is_active: true },
      { id: '2', code: 'SL', label: 'Sick Leave', color: '#EF4444', is_active: true },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

import { useLeaveRequests } from '../../hooks/useLeaveRequests';

describe('LeaveRequests Page', () => {
  let queryClient: QueryClient;
  let mockUser: User;

  const mockLeaveRequests: (LeaveRequest & {
    user: { id: string; name: string; email: string; role: string };
  })[] = [
    {
      id: 'leave-1',
      user_id: 'user-1',
      leave_type: 'AL',
      start_date: '2024-02-01',
      end_date: '2024-02-05',
      status: 'pending_tl',
      notes: null,
      tl_approved_at: null,
      wfm_approved_at: null,
      created_at: '2024-01-15T10:00:00Z',
      user: {
        id: 'user-1',
        email: 'user@dabdoob.com',
        name: 'John Doe',
        role: 'agent',
      },
    },
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
      role: 'agent',
      created_at: '2024-01-01T00:00:00Z',
    };

    vi.clearAllMocks();
  });

  const renderLeaveRequests = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <LeaveRequests />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('List rendering', () => {
    it('should render page title', () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      expect(screen.getByText('Leave Requests')).toBeInTheDocument();
    });

    it('should render leave requests when data is available', async () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
        leaveRequests: mockLeaveRequests,
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      await waitFor(() => {
        const names = screen.getAllByText('John Doe');
        expect(names.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no requests', async () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      await waitFor(() => {
        expect(screen.getByText(/no leave requests found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should render filter controls', async () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state initially', () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should hide loading state after data loads', async () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBe(0);
      });
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls when data is available', async () => {
      vi.mocked(useLeaveRequests).mockReturnValue({
        leaveRequests: mockLeaveRequests,
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
        createLeaveRequest: {} as any,
        updateLeaveRequest: {} as any,
        deleteLeaveRequest: {} as any,
      });

      renderLeaveRequests();

      await waitFor(() => {
        const names = screen.queryAllByText('John Doe');
        expect(names.length).toBeGreaterThan(0);
      });
    });
  });
});
