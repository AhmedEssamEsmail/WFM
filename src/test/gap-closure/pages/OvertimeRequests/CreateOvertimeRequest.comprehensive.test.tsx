import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateOvertimeRequest from '../../../../pages/OvertimeRequests/CreateOvertimeRequest';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../contexts/ToastContext';
import * as useAuthModule from '../../../../hooks/useAuth';
import * as useOvertimeRequestsModule from '../../../../hooks/useOvertimeRequests';
import * as useOvertimeSettingsModule from '../../../../hooks/useOvertimeSettings';
import { shiftsService } from '../../../../services';

// Mock modules
vi.mock('../../../../hooks/useAuth');
vi.mock('../../../../hooks/useOvertimeRequests');
vi.mock('../../../../hooks/useOvertimeSettings');
vi.mock('../../../../services', () => ({
  shiftsService: {
    getUserShifts: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateOvertimeRequest Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockSettings = {
    id: 'settings-1',
    max_hours_per_day: 4,
    max_hours_per_week: 12,
    max_hours_per_month: 40,
    require_shift_verification: {
      enabled: false,
      allow_off_day_overtime: false,
    },
    auto_approve_threshold: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockCreateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Mock useAuth
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

    // Mock useOvertimeSettings
    vi.mocked(useOvertimeSettingsModule.useOvertimeSettings).mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
    } as any);

    // Mock useOvertimeRequests
    vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
      overtimeRequests: [],
      isLoading: false,
      error: null,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    // Mock useCreateOvertimeRequest
    vi.mocked(useOvertimeRequestsModule.useCreateOvertimeRequest).mockReturnValue(
      mockCreateMutation as any
    );

    // Mock shiftsService
    vi.mocked(shiftsService.getUserShifts).mockResolvedValue([]);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <CreateOvertimeRequest />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('renders the page title', () => {
      renderComponent();
      expect(screen.getByText('New Overtime Request')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      renderComponent();
      expect(screen.getByLabelText('Work Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Overtime Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Reason')).toBeInTheDocument();
    });

    it('renders overtime type radio buttons', () => {
      renderComponent();
      expect(screen.getByText('Regular Overtime (1.5x pay)')).toBeInTheDocument();
      expect(screen.getByText('Double Time (2.0x pay)')).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('submit button is disabled initially', () => {
      renderComponent();
      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Interaction', () => {
    it('allows selecting work date', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      expect(dateInput).toHaveValue('2024-02-01');
    });

    it('allows selecting overtime type', async () => {
      const user = userEvent.setup();
      renderComponent();

      const doubleTimeRadio = screen.getByRole('radio', { name: /Double Time/i });
      await user.click(doubleTimeRadio);

      expect(doubleTimeRadio).toBeChecked();
    });

    it('allows entering start time', async () => {
      const user = userEvent.setup();
      renderComponent();

      const startTimeInput = screen.getByLabelText('Start Time');
      await user.type(startTimeInput, '18:00');

      expect(startTimeInput).toHaveValue('18:00');
    });

    it('allows entering end time', async () => {
      const user = userEvent.setup();
      renderComponent();

      const endTimeInput = screen.getByLabelText('End Time');
      await user.type(endTimeInput, '22:00');

      expect(endTimeInput).toHaveValue('22:00');
    });

    it('allows entering reason', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reasonTextarea = screen.getByLabelText('Reason');
      await user.type(reasonTextarea, 'Project deadline');

      expect(reasonTextarea).toHaveValue('Project deadline');
    });

    it('displays character count for reason', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reasonTextarea = screen.getByLabelText('Reason');
      await user.type(reasonTextarea, 'Test reason');

      expect(screen.getByText('11/250 characters')).toBeInTheDocument();
    });

    it('calculates total hours', async () => {
      const user = userEvent.setup();
      renderComponent();

      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');

      await waitFor(() => {
        expect(screen.getByText(/Total Hours:/i)).toBeInTheDocument();
        expect(screen.getByText('4.00')).toBeInTheDocument();
      });
    });
  });

  describe('Shift Verification', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeSettingsModule.useOvertimeSettings).mockReturnValue({
        data: {
          ...mockSettings,
          require_shift_verification: {
            enabled: true,
            allow_off_day_overtime: false,
          },
        },
        isLoading: false,
        error: null,
      } as any);
    });

    it('displays shift information section when enabled', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      await waitFor(() => {
        expect(screen.getByText('Scheduled Shift')).toBeInTheDocument();
      });
    });

    it('fetches shift information when date is selected', async () => {
      const user = userEvent.setup();
      vi.mocked(shiftsService.getUserShifts).mockResolvedValue([
        {
          id: 'shift-1',
          user_id: 'user-1',
          date: '2024-02-01',
          shift_type: 'AM',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      await waitFor(() => {
        expect(shiftsService.getUserShifts).toHaveBeenCalledWith(
          'user-1',
          '2024-02-01',
          '2024-02-01'
        );
      });
    });

    it('displays shift type when shift is found', async () => {
      const user = userEvent.setup();
      vi.mocked(shiftsService.getUserShifts).mockResolvedValue([
        {
          id: 'shift-1',
          user_id: 'user-1',
          date: '2024-02-01',
          shift_type: 'AM',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]);

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      await waitFor(() => {
        expect(screen.getByText('AM Shift')).toBeInTheDocument();
      });
    });

    it('displays warning when no shift is found', async () => {
      const user = userEvent.setup();
      vi.mocked(shiftsService.getUserShifts).mockResolvedValue([]);

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      await waitFor(() => {
        expect(screen.getByText(/No scheduled shift found/i)).toBeInTheDocument();
      });
    });

    it('displays loading state while fetching shift', async () => {
      const user = userEvent.setup();
      vi.mocked(shiftsService.getUserShifts).mockImplementation(() => new Promise(() => {}));

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      await waitFor(() => {
        expect(screen.getByText('Loading shift information...')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error when end time is before start time', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '22:00');
      await user.type(endTimeInput, '18:00');
      await user.type(reasonTextarea, 'Test reason for validation');

      await waitFor(() => {
        expect(screen.getByText(/End time must be after start time/i)).toBeInTheDocument();
      });
    });

    it('shows error when reason is too short', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');
      await user.type(reasonTextarea, 'Short');

      await waitFor(() => {
        expect(screen.getByText(/Reason must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error when hours exceed daily limit', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '23:00'); // 5 hours, exceeds 4 hour limit
      await user.type(reasonTextarea, 'Test reason for validation');

      await waitFor(() => {
        expect(screen.getByText(/exceeds the maximum allowed/i)).toBeInTheDocument();
      });
    });

    it('disables submit button when there are errors', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '22:00');
      await user.type(endTimeInput, '18:00');
      await user.type(reasonTextarea, 'Test reason for validation');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Submit Request/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      mockCreateMutation.mutateAsync.mockResolvedValue({});

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');
      await user.type(reasonTextarea, 'Project deadline requires extra work');

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
          request_date: '2024-02-01',
          start_time: '18:00',
          end_time: '22:00',
          overtime_type: 'regular',
          reason: 'Project deadline requires extra work',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/overtime-requests');
      });
    });

    it('submits with double time overtime type', async () => {
      const user = userEvent.setup();
      mockCreateMutation.mutateAsync.mockResolvedValue({});

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');
      const doubleTimeRadio = screen.getByRole('radio', { name: /Double Time/i });

      await user.type(dateInput, '2024-02-01');
      await user.click(doubleTimeRadio);
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');
      await user.type(reasonTextarea, 'Emergency support required');

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            overtime_type: 'double',
          })
        );
      });
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      mockCreateMutation.mutateAsync.mockImplementation(() => new Promise(() => {}));
      mockCreateMutation.isPending = true;

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');
      await user.type(reasonTextarea, 'Project deadline requires extra work');

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('displays error message on submission failure', async () => {
      const user = userEvent.setup();
      mockCreateMutation.mutateAsync.mockRejectedValue(new Error('Network error'));
      mockCreateMutation.isError = true;

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');
      await user.type(reasonTextarea, 'Project deadline requires extra work');

      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create overtime request/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('navigates back when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/overtime-requests');
    });
  });

  describe('Loading States', () => {
    it('displays loading state for settings', () => {
      vi.mocked(useOvertimeSettingsModule.useOvertimeSettings).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderComponent();
      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing settings gracefully', () => {
      vi.mocked(useOvertimeSettingsModule.useOvertimeSettings).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      renderComponent();
      expect(screen.getByText('New Overtime Request')).toBeInTheDocument();
    });

    it('handles shift fetch error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(useOvertimeSettingsModule.useOvertimeSettings).mockReturnValue({
        data: {
          ...mockSettings,
          require_shift_verification: {
            enabled: true,
            allow_off_day_overtime: false,
          },
        },
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(shiftsService.getUserShifts).mockRejectedValue(new Error('Failed to fetch'));

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      await user.type(dateInput, '2024-02-01');

      // Should still render the form
      expect(screen.getByText('New Overtime Request')).toBeInTheDocument();
    });

    it('handles reason at maximum length', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reasonTextarea = screen.getByLabelText('Reason');
      const longReason = 'a'.repeat(250);
      await user.type(reasonTextarea, longReason);

      expect(screen.getByText('250/250 characters')).toBeInTheDocument();
    });

    it('prevents submission with empty required fields', () => {
      renderComponent();
      const submitButton = screen.getByRole('button', { name: /Submit Request/i });
      expect(submitButton).toBeDisabled();
    });

    it('handles overnight shifts (end time next day)', async () => {
      const user = userEvent.setup();
      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '22:00');
      await user.type(endTimeInput, '02:00');
      await user.type(reasonTextarea, 'Overnight shift coverage');

      await waitFor(() => {
        expect(screen.getByText('4.00')).toBeInTheDocument();
      });
    });
  });

  describe('Warnings', () => {
    it('displays warning for existing request on same date', async () => {
      const user = userEvent.setup();
      vi.mocked(useOvertimeRequestsModule.useOvertimeRequests).mockReturnValue({
        overtimeRequests: [
          {
            id: 'ot-1',
            requester_id: 'user-1',
            request_date: '2024-02-01',
            start_time: '18:00:00',
            end_time: '22:00:00',
            total_hours: 4,
            overtime_type: 'regular',
            reason: 'Previous request',
            status: 'pending_tl',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      renderComponent();

      const dateInput = screen.getByLabelText('Work Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');
      const reasonTextarea = screen.getByLabelText('Reason');

      await user.type(dateInput, '2024-02-01');
      await user.type(startTimeInput, '18:00');
      await user.type(endTimeInput, '22:00');
      await user.type(reasonTextarea, 'Another request for same date');

      await waitFor(() => {
        expect(screen.getByText(/already have an overtime request/i)).toBeInTheDocument();
      });
    });
  });
});
