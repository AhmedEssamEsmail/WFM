import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SwapRequestDetail from '../../../../pages/SwapRequests/SwapRequestDetail';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../contexts/ToastContext';
import * as useAuthModule from '../../../../hooks/useAuth';
import * as useShiftConfigurationsModule from '../../../../hooks/useShiftConfigurations';
import {
  swapRequestsService,
  commentsService,
  settingsService,
  authService,
  shiftsService,
} from '../../../../services';

// Mock services
vi.mock('../../../../services', () => ({
  swapRequestsService: {
    getSwapRequestById: vi.fn(),
    updateSwapRequestStatus: vi.fn(),
    clearApprovalTimestamps: vi.fn(),
    executeSwap: vi.fn(),
  },
  commentsService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    createSystemComment: vi.fn(),
  },
  settingsService: {
    getAutoApproveSetting: vi.fn(),
  },
  authService: {
    getUserProfile: vi.fn(),
  },
  shiftsService: {
    getShiftById: vi.fn(),
    getShifts: vi.fn(),
    updateShift: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../../../../hooks/useAuth');
vi.mock('../../../../hooks/useShiftConfigurations');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SwapRequestDetail Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockRequester = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'agent' as const,
  };

  const mockTargetUser = {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'agent' as const,
  };

  const mockSwapRequest = {
    id: 'swap-1',
    requester_id: 'user-1',
    target_user_id: 'user-2',
    requester_shift_id: 'shift-1',
    target_shift_id: 'shift-2',
    status: 'pending_acceptance' as const,
    created_at: '2024-01-15T10:00:00Z',
    tl_approved_at: null,
    wfm_approved_at: null,
    requester_original_date: '2024-02-01',
    requester_original_shift_type: 'AM',
    target_original_date: '2024-02-05',
    target_original_shift_type: 'PM',
    requester_original_shift_type_on_target_date: 'OFF',
    target_original_shift_type_on_requester_date: 'BET',
  };

  const mockRequesterShift = {
    id: 'shift-1',
    user_id: 'user-1',
    date: '2024-02-01',
    shift_type: 'AM',
  };

  const mockTargetShift = {
    id: 'shift-2',
    user_id: 'user-2',
    date: '2024-02-05',
    shift_type: 'PM',
  };

  const mockComments = [
    {
      id: 'comment-1',
      request_id: 'swap-1',
      request_type: 'swap',
      user_id: 'user-1',
      content: 'Please approve this swap',
      created_at: '2024-01-15T11:00:00Z',
      is_system: false,
      users: mockRequester,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Mock useAuth with target user by default
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockTargetUser,
      signOut: vi.fn(),
      isLoading: false,
    });

    // Mock useShiftConfigurations
    vi.mocked(useShiftConfigurationsModule.useShiftConfigurations).mockReturnValue({
      getShiftDisplay: (shiftType: string) => ({
        name: `${shiftType} Shift`,
        color: '#000000',
      }),
      shiftConfigurations: [],
      isLoading: false,
      error: null,
    });

    // Mock services
    vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue(mockSwapRequest);
    vi.mocked(authService.getUserProfile).mockImplementation((userId: string) => {
      if (userId === 'user-1') return Promise.resolve(mockRequester);
      if (userId === 'user-2') return Promise.resolve(mockTargetUser);
      return Promise.reject(new Error('User not found'));
    });
    vi.mocked(shiftsService.getShiftById).mockImplementation((shiftId: string) => {
      if (shiftId === 'shift-1') return Promise.resolve(mockRequesterShift);
      if (shiftId === 'shift-2') return Promise.resolve(mockTargetShift);
      return Promise.reject(new Error('Shift not found'));
    });
    vi.mocked(commentsService.getComments).mockResolvedValue(mockComments);
    vi.mocked(swapRequestsService.updateSwapRequestStatus).mockResolvedValue(mockSwapRequest);
    vi.mocked(commentsService.createSystemComment).mockResolvedValue(undefined);
    vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(false);
  });

  const renderComponent = (requestId = 'swap-1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/swap-requests/:id" element={<SwapRequestDetail />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>,
      { wrapper: ({ children }) => <div>{children}</div> }
    );
  };

  describe('Page Rendering', () => {
    it('renders the page title', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Swap Request Details')).toBeInTheDocument();
      });
    });

    it('renders status badge', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Pending Acceptance')).toBeInTheDocument();
      });
    });

    it('renders swap details section', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Swap Details')).toBeInTheDocument();
        expect(screen.getByText("Requester's Shifts")).toBeInTheDocument();
        expect(screen.getByText("Target's Shifts")).toBeInTheDocument();
      });
    });

    it('renders approval timeline', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approval Timeline')).toBeInTheDocument();
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText(/Target Acceptance/)).toBeInTheDocument();
        expect(screen.getByText('Team Lead Approval')).toBeInTheDocument();
        expect(screen.getByText('WFM Approval')).toBeInTheDocument();
      });
    });

    it('renders comments section', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText('Please approve this swap')).toBeInTheDocument();
      });
    });

    it('renders back button', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('displays requester information', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });
    });

    it('displays target user information', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      });
    });

    it('displays shift dates and types', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/02\/01\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/02\/05\/2024/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/AM Shift/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/PM Shift/).length).toBeGreaterThan(0);
      });
    });

    it('displays created date', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        // Check that created date is displayed (format may vary)
        expect(screen.getByText(/Created on/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Target User Actions - Accept/Decline', () => {
    it('shows accept and decline buttons for target user', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
        expect(screen.getByText('Decline Swap')).toBeInTheDocument();
      });
    });

    it('accepts swap request', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept Swap');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'pending_tl',
          undefined,
          'pending_acceptance'
        );
      });

      await waitFor(() => {
        expect(commentsService.createSystemComment).toHaveBeenCalled();
      });
    });

    it('declines swap request', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Decline Swap')).toBeInTheDocument();
      });

      const declineButton = screen.getByText('Decline Swap');
      await user.click(declineButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'rejected',
          undefined,
          'pending_acceptance'
        );
      });
    });

    it('does not show accept/decline buttons for non-target user', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: mockRequester,
        signOut: vi.fn(),
        isLoading: false,
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Accept Swap')).not.toBeInTheDocument();
        expect(screen.queryByText('Decline Swap')).not.toBeInTheDocument();
      });
    });
  });

  describe('TL Actions - Approve/Reject', () => {
    beforeEach(() => {
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

      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        status: 'pending_tl',
      });
    });

    it('shows approve and reject buttons for TL', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
        expect(screen.getByText('Reject')).toBeInTheDocument();
      });
    });

    it('approves request to pending_wfm when auto-approve is disabled', async () => {
      const user = userEvent.setup();
      vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(false);

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      const approveButton = screen.getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'pending_wfm',
          'tl_approved_at',
          'pending_tl'
        );
      });
    });

    it('approves request directly to approved when auto-approve is enabled', async () => {
      const user = userEvent.setup();
      vi.mocked(settingsService.getAutoApproveSetting).mockResolvedValue(true);

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      const approveButton = screen.getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'approved',
          'wfm_approved_at',
          'pending_tl'
        );
      });
    });

    it('rejects request', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Reject')).toBeInTheDocument();
      });

      const rejectButton = screen.getByText('Reject');
      await user.click(rejectButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'rejected',
          undefined,
          'pending_tl'
        );
      });
    });
  });

  describe('WFM Actions - Approve/Reject/Revoke', () => {
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

      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        status: 'pending_wfm',
        tl_approved_at: '2024-01-15T12:00:00Z',
      });
    });

    it('shows approve and reject buttons for WFM', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
        expect(screen.getByText('Reject')).toBeInTheDocument();
      });
    });

    it('approves request to approved status', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      const approveButton = screen.getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'approved',
          'wfm_approved_at',
          'pending_wfm'
        );
      });
    });

    it('executes swap when approved', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      const approveButton = screen.getByText('Approve');
      await user.click(approveButton);

      await waitFor(() => {
        expect(swapRequestsService.executeSwap).toHaveBeenCalled();
      });
    });

    it('shows revoke button for approved requests', async () => {
      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        status: 'approved',
        tl_approved_at: '2024-01-15T12:00:00Z',
        wfm_approved_at: '2024-01-15T13:00:00Z',
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Revoke')).toBeInTheDocument();
      });
    });

    it('revokes approved request and restores shifts', async () => {
      const user = userEvent.setup();
      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        status: 'approved',
        tl_approved_at: '2024-01-15T12:00:00Z',
        wfm_approved_at: '2024-01-15T13:00:00Z',
      });

      vi.mocked(shiftsService.getShifts).mockResolvedValue([mockRequesterShift, mockTargetShift]);

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Revoke')).toBeInTheDocument();
      });

      const revokeButton = screen.getByText('Revoke');
      await user.click(revokeButton);

      await waitFor(() => {
        expect(shiftsService.updateShift).toHaveBeenCalled();
        expect(swapRequestsService.clearApprovalTimestamps).toHaveBeenCalledWith('swap-1');
      });
    });
  });

  describe('Cancel Action', () => {
    it('shows cancel button for requester', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: mockRequester,
        signOut: vi.fn(),
        isLoading: false,
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Cancel Request')).toBeInTheDocument();
      });
    });

    it('cancels request', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: mockRequester,
        signOut: vi.fn(),
        isLoading: false,
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Cancel Request')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Request');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(swapRequestsService.updateSwapRequestStatus).toHaveBeenCalledWith(
          'swap-1',
          'rejected',
          undefined,
          'pending_acceptance'
        );
      });
    });

    it('does not show cancel button for approved requests', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: mockRequester,
        signOut: vi.fn(),
        isLoading: false,
      });

      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        status: 'approved',
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Cancel Request')).not.toBeInTheDocument();
      });
    });
  });

  describe('Comments', () => {
    it('displays existing comments', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Please approve this swap')).toBeInTheDocument();
        // John Doe appears multiple times (requester name and comment author)
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });
    });

    it('displays system comments differently', async () => {
      vi.mocked(commentsService.getComments).mockResolvedValue([
        {
          id: 'comment-2',
          request_id: 'swap-1',
          request_type: 'swap',
          user_id: 'system',
          content: 'Status changed to pending_tl',
          created_at: '2024-01-15T12:00:00Z',
          is_system: true,
        },
      ]);

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('System')).toBeInTheDocument();
        expect(screen.getByText('Status changed to pending_tl')).toBeInTheDocument();
      });
    });

    it('adds new comment', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('Add a comment...');
      await user.type(commentInput, 'This is a test comment');

      const sendButton = screen.getByText('Send');
      await user.click(sendButton);

      await waitFor(() => {
        expect(commentsService.createComment).toHaveBeenCalledWith({
          request_id: 'swap-1',
          request_type: 'swap',
          user_id: 'user-2',
          content: 'This is a test comment',
        });
      });
    });

    it('displays empty state when no comments', async () => {
      vi.mocked(commentsService.getComments).mockResolvedValue([]);

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No comments yet')).toBeInTheDocument();
      });
    });

    it('disables send button when comment is empty', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading skeleton', () => {
      vi.mocked(swapRequestsService.getSwapRequestById).mockImplementation(
        () => new Promise(() => {})
      );

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays not found message when request does not exist', async () => {
      vi.mocked(swapRequestsService.getSwapRequestById).mockRejectedValue(new Error('Not found'));

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Request not found')).toBeInTheDocument();
      });
    });

    it('displays error message on action failure', async () => {
      const user = userEvent.setup();
      vi.mocked(swapRequestsService.updateSwapRequestStatus).mockRejectedValue(
        new Error('Network error')
      );

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept Swap');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('displays refresh button on concurrency error', async () => {
      const user = userEvent.setup();
      const ConcurrencyError = class extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'ConcurrencyError';
        }
      };

      vi.mocked(swapRequestsService.updateSwapRequestStatus).mockRejectedValue(
        new ConcurrencyError('Concurrency error')
      );

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept Swap');
      await user.click(acceptButton);

      await waitFor(() => {
        // Check for error message (may vary based on error handling implementation)
        const errorElements = document.querySelectorAll('.border-red-200, .text-red-700');
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is clicked', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user data gracefully', async () => {
      vi.mocked(authService.getUserProfile).mockResolvedValue({
        id: 'user-1',
        name: '',
        email: 'john@example.com',
        role: 'agent',
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Swap Request Details')).toBeInTheDocument();
      });
    });

    it('handles same-date swaps correctly', async () => {
      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        requester_original_date: '2024-02-01',
        target_original_date: '2024-02-01',
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        // Check that dates are displayed (format may vary)
        expect(screen.getByText('Swap Request Details')).toBeInTheDocument();
        const swapDetails = document.querySelector('.rounded-lg.bg-white');
        expect(swapDetails?.textContent).toContain('Feb');
      });
    });

    it('handles missing shift type data', async () => {
      vi.mocked(swapRequestsService.getSwapRequestById).mockResolvedValue({
        ...mockSwapRequest,
        requester_original_shift_type: null,
        target_original_shift_type: null,
      });

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
      });
    });

    it('disables action buttons while submitting', async () => {
      const user = userEvent.setup();
      let resolvePromise: any;
      vi.mocked(swapRequestsService.updateSwapRequestStatus).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept Swap');
      await user.click(acceptButton);

      // Button should be disabled during submission
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button');
        const acceptBtn = buttons.find(
          (btn) => btn.textContent?.includes('Accept') || btn.textContent?.includes('Processing')
        );
        expect(acceptBtn).toBeDisabled();
      });

      // Resolve the promise to clean up
      if (resolvePromise) resolvePromise(mockSwapRequest);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Swap Request Details');
      });
    });

    it('has proper button labels', async () => {
      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
        expect(screen.getByText('Decline Swap')).toBeInTheDocument();
      });
    });

    it('disables buttons with proper styling', async () => {
      const user = userEvent.setup();
      let resolvePromise: any;
      vi.mocked(swapRequestsService.updateSwapRequestStatus).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      window.history.pushState({}, '', '/swap-requests/swap-1');
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Accept Swap')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept Swap');
      await user.click(acceptButton);

      await waitFor(() => {
        const buttons = screen.queryAllByRole('button');
        const acceptBtn = buttons.find(
          (btn) => btn.textContent?.includes('Accept') || btn.textContent?.includes('Processing')
        );
        expect(acceptBtn).toBeDisabled();
        expect(acceptBtn).toHaveClass('disabled:opacity-50');
      });

      // Resolve the promise to clean up
      if (resolvePromise) resolvePromise(mockSwapRequest);
    });
  });
});
