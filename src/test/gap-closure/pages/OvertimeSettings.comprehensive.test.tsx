import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OvertimeSettings from '../../../pages/Settings/OvertimeSettings';

/**
 * Comprehensive tests for OvertimeSettings component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.6, CR-2.1.4, PR-4.2.4
 */

const mockSettings = {
  auto_approve: { enabled: false },
  max_daily_hours: { regular: 4, double: 4 },
  max_weekly_hours: { regular: 12, double: 12 },
  require_shift_verification: { enabled: true },
  approval_deadline_days: { days: 7 },
  pay_multipliers: { regular: 1.5, double: 2.0 },
};

const mockUseOvertimeSettings = vi.fn();
const mockUseUpdateOvertimeSetting = vi.fn();

vi.mock('../../../hooks/useOvertimeSettings', () => ({
  useOvertimeSettings: () => mockUseOvertimeSettings(),
  useUpdateOvertimeSetting: () => mockUseUpdateOvertimeSetting(),
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('OvertimeSettings Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockUseOvertimeSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false,
    });
    mockUseUpdateOvertimeSetting.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(screen.getByText('Overtime Settings')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(
        screen.getByText('Configure overtime request rules and approval settings')
      ).toBeInTheDocument();
    });

    it('should render all section headings', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(screen.getByText('Auto-Approve Overtime')).toBeInTheDocument();
      expect(screen.getByText('Daily Limits (hours)')).toBeInTheDocument();
      expect(screen.getByText('Weekly Limits (hours)')).toBeInTheDocument();
      expect(screen.getByText('Shift Verification')).toBeInTheDocument();
      expect(screen.getByText('Submission Deadline')).toBeInTheDocument();
      expect(screen.getByText('Pay Multipliers')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseOvertimeSettings.mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<OvertimeSettings />, { wrapper });
      expect(screen.getByText('Loading overtime settings...')).toBeInTheDocument();
    });

    it('should render note about changes', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(
        screen.getByText('Note: Changes take effect immediately for all new overtime requests.')
      ).toBeInTheDocument();
    });
  });

  describe('Auto-Approve Toggle', () => {
    it('should render toggle in off state when auto_approve is false', () => {
      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];
      expect(autoApproveToggle).toHaveClass('bg-gray-200');
    });

    it('should render toggle in on state when auto_approve is true', () => {
      mockUseOvertimeSettings.mockReturnValue({
        data: { ...mockSettings, auto_approve: { enabled: true } },
        isLoading: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];
      expect(autoApproveToggle).toHaveClass('bg-indigo-600');
    });

    it('should call mutateAsync when toggle is clicked', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          key: 'auto_approve',
          value: { enabled: true },
        });
      });
    });

    it('should disable toggle while saving', () => {
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });

      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];
      expect(autoApproveToggle).toHaveClass('cursor-not-allowed');
      expect(autoApproveToggle).toHaveClass('opacity-50');
    });
  });

  describe('Daily Limits', () => {
    it('should display current daily limits', () => {
      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByDisplayValue('4');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should update regular daily limit input', () => {
      render(<OvertimeSettings />, { wrapper });
      const regularInput = screen.getByLabelText('Regular Overtime', {
        selector: 'input[type="number"]',
      });
      fireEvent.change(regularInput, { target: { value: '5' } });
      expect(regularInput).toHaveValue(5);
    });

    it('should call mutateAsync on blur with valid value', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByRole('spinbutton');
      const regularInput = inputs[0];

      fireEvent.change(regularInput, { target: { value: '5' } });
      fireEvent.blur(regularInput);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          key: 'max_daily_hours',
          value: { regular: 5, double: 4 },
        });
      });
    });

    it('should show validation error for invalid input', async () => {
      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByRole('spinbutton');
      const regularInput = inputs[0];

      fireEvent.change(regularInput, { target: { value: '-1' } });
      fireEvent.blur(regularInput);

      await waitFor(() => {
        expect(screen.getByText('Must be a positive number')).toBeInTheDocument();
      });
    });

    it('should show validation error for non-numeric input', async () => {
      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByRole('spinbutton');
      const regularInput = inputs[0];

      fireEvent.change(regularInput, { target: { value: 'abc' } });
      fireEvent.blur(regularInput);

      await waitFor(() => {
        expect(screen.getByText('Must be a positive number')).toBeInTheDocument();
      });
    });
  });

  describe('Weekly Limits', () => {
    it('should display current weekly limits', () => {
      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByDisplayValue('12');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should update weekly limit input', () => {
      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByRole('spinbutton');
      const weeklyInput = inputs[2]; // Third input

      fireEvent.change(weeklyInput, { target: { value: '15' } });
      expect(weeklyInput).toHaveValue(15);
    });

    it('should call mutateAsync on blur with valid value', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByRole('spinbutton');
      const weeklyInput = inputs[2];

      fireEvent.change(weeklyInput, { target: { value: '15' } });
      fireEvent.blur(weeklyInput);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          key: 'max_weekly_hours',
          value: { regular: 15, double: 12 },
        });
      });
    });
  });

  describe('Shift Verification Toggle', () => {
    it('should render toggle in on state when shift_verification is true', () => {
      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const shiftVerificationToggle = toggles[1];
      expect(shiftVerificationToggle).toHaveClass('bg-indigo-600');
    });

    it('should call mutateAsync when toggle is clicked', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const shiftVerificationToggle = toggles[1];

      fireEvent.click(shiftVerificationToggle);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          key: 'require_shift_verification',
          value: { enabled: false },
        });
      });
    });
  });

  describe('Submission Deadline', () => {
    it('should display current submission deadline', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(screen.getByDisplayValue('7')).toBeInTheDocument();
    });

    it('should update submission deadline input', () => {
      render(<OvertimeSettings />, { wrapper });
      const deadlineInput = screen.getByDisplayValue('7');

      fireEvent.change(deadlineInput, { target: { value: '10' } });
      expect(deadlineInput).toHaveValue(10);
    });

    it('should call mutateAsync on blur with valid value', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const deadlineInput = screen.getByDisplayValue('7');

      fireEvent.change(deadlineInput, { target: { value: '10' } });
      fireEvent.blur(deadlineInput);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          key: 'approval_deadline_days',
          value: { days: 10 },
        });
      });
    });
  });

  describe('Pay Multipliers', () => {
    it('should display current pay multipliers', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(screen.getByDisplayValue('1.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2.0')).toBeInTheDocument();
    });

    it('should update pay multiplier input', () => {
      render(<OvertimeSettings />, { wrapper });
      const regularMultiplier = screen.getByDisplayValue('1.5');

      fireEvent.change(regularMultiplier, { target: { value: '1.75' } });
      expect(regularMultiplier).toHaveValue(1.75);
    });

    it('should call mutateAsync on blur with valid value', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const regularMultiplier = screen.getByDisplayValue('1.5');

      fireEvent.change(regularMultiplier, { target: { value: '1.75' } });
      fireEvent.blur(regularMultiplier);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          key: 'pay_multipliers',
          value: { regular: 1.75, double: 2.0 },
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle toggle error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mutateAsync = vi.fn().mockRejectedValue(new Error('Save failed'));
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error saving setting:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle number update error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mutateAsync = vi.fn().mockRejectedValue(new Error('Save failed'));
      mockUseUpdateOvertimeSetting.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      render(<OvertimeSettings />, { wrapper });
      const inputs = screen.getAllByRole('spinbutton');
      const regularInput = inputs[0];

      fireEvent.change(regularInput, { target: { value: '5' } });
      fireEvent.blur(regularInput);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error saving setting:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const { container } = render(<OvertimeSettings />, { wrapper });
      const headings = container.querySelectorAll('h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have labels for all inputs', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(screen.getByText('Regular Overtime')).toBeInTheDocument();
      expect(screen.getByText('Double Overtime')).toBeInTheDocument();
      expect(screen.getByText('Days after work date')).toBeInTheDocument();
    });

    it('should have helper text for inputs', () => {
      render(<OvertimeSettings />, { wrapper });
      expect(
        screen.getByText(
          'Agents must submit overtime requests within this many days after the work date'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('e.g., 1.5 = 150% of regular pay')).toBeInTheDocument();
    });
  });
});
