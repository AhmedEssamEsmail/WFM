import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaveTypeManager from '../../../pages/Settings/LeaveTypeManager';
import { leaveTypesService } from '../../../services';
import type { LeaveTypeConfig } from '../../../types';

/**
 * Comprehensive tests for LeaveTypeManager component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.6, CR-2.1.4, PR-4.2.4
 */

vi.mock('../../../services', () => ({
  leaveTypesService: {
    getAllLeaveTypes: vi.fn(),
    updateLeaveType: vi.fn(),
    createLeaveType: vi.fn(),
    deactivateLeaveType: vi.fn(),
  },
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('LeaveTypeManager Component', () => {
  let queryClient: QueryClient;

  const mockLeaveTypes: LeaveTypeConfig[] = [
    {
      id: 'lt-1',
      code: 'sick',
      label: 'Sick Leave',
      description: 'For illness',
      color: '#EF4444',
      display_order: 0,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'lt-2',
      code: 'vacation',
      label: 'Vacation',
      description: 'Annual leave',
      color: '#3B82F6',
      display_order: 1,
      is_active: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(leaveTypesService.getAllLeaveTypes).mockResolvedValue(mockLeaveTypes);
    vi.mocked(leaveTypesService.updateLeaveType).mockResolvedValue(undefined);
    vi.mocked(leaveTypesService.createLeaveType).mockResolvedValue(undefined);
    vi.mocked(leaveTypesService.deactivateLeaveType).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Rendering', () => {
    it('should render component with title', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Leave Types')).toBeInTheDocument();
      });
    });

    it('should render description', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByText('Manage available leave types for the organization')
        ).toBeInTheDocument();
      });
    });

    it('should render Add Leave Type button', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Add Leave Type')).toBeInTheDocument();
      });
    });

    it('should show loading spinner while fetching', async () => {
      vi.mocked(leaveTypesService.getAllLeaveTypes).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLeaveTypes), 100))
      );

      render(<LeaveTypeManager />, { wrapper });

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should display leave types after loading', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
      });
    });

    it('should show empty state when no leave types', async () => {
      vi.mocked(leaveTypesService.getAllLeaveTypes).mockResolvedValue([]);

      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByText('No leave types configured. Add one to get started.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Leave Type Display', () => {
    it('should display leave type code', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('sick')).toBeInTheDocument();
        expect(screen.getByText('vacation')).toBeInTheDocument();
      });
    });

    it('should display leave type description', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText(/For illness/)).toBeInTheDocument();
        expect(screen.getByText(/Annual leave/)).toBeInTheDocument();
      });
    });

    it('should display active status badge', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        const badges = screen.getAllByText('Active');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display inactive status badge', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        const badges = screen.getAllByText('Inactive');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display color indicator', async () => {
      const { container } = render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        const colorBoxes = container.querySelectorAll('[style*="backgroundColor"]');
        expect(colorBoxes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edit Leave Type', () => {
    it('should show edit form when Edit button is clicked', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Sick Leave')).toBeInTheDocument();
      });
    });

    it('should populate form with leave type data', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Sick Leave')).toBeInTheDocument();
        expect(screen.getByDisplayValue('For illness')).toBeInTheDocument();
        expect(screen.getByDisplayValue('#EF4444')).toBeInTheDocument();
      });
    });

    it('should update label field', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const labelInput = screen.getByDisplayValue('Sick Leave');
      fireEvent.change(labelInput, { target: { value: 'Medical Leave' } });

      expect(labelInput).toHaveValue('Medical Leave');
    });

    it('should call updateLeaveType when Save is clicked', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const labelInput = screen.getByDisplayValue('Sick Leave');
      fireEvent.change(labelInput, { target: { value: 'Medical Leave' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(leaveTypesService.updateLeaveType).toHaveBeenCalledWith('lt-1', {
          label: 'Medical Leave',
          description: 'For illness',
          color: '#EF4444',
          display_order: 0,
          is_active: true,
        });
      });
    });

    it('should cancel edit when Cancel is clicked', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Sick Leave')).not.toBeInTheDocument();
      });
    });

    it('should refetch leave types after successful update', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(leaveTypesService.getAllLeaveTypes).toHaveBeenCalledTimes(1);
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(leaveTypesService.getAllLeaveTypes).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Add Leave Type', () => {
    it('should show add form when Add Leave Type button is clicked', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Add Leave Type')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Leave Type')).toBeInTheDocument();
      });
    });

    it('should have empty form fields', async () => {
      render(<LeaveTypeManager />, { wrapper });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/e.g./);
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should update code field', async () => {
      render(<LeaveTypeManager />, { wrapper });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        const codeInput = screen.getByPlaceholderText('e.g., maternity');
        fireEvent.change(codeInput, { target: { value: 'maternity' } });
        expect(codeInput).toHaveValue('maternity');
      });
    });

    it('should call createLeaveType when Add Leave Type is clicked', async () => {
      render(<LeaveTypeManager />, { wrapper });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        const codeInput = screen.getByPlaceholderText('e.g., maternity');
        const labelInput = screen.getByPlaceholderText('e.g., Maternity Leave');

        fireEvent.change(codeInput, { target: { value: 'maternity' } });
        fireEvent.change(labelInput, { target: { value: 'Maternity Leave' } });
      });

      const createButton = screen.getByRole('button', { name: /Create Skill|Add Leave Type/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(leaveTypesService.createLeaveType).toHaveBeenCalled();
      });
    });

    it('should cancel add when Cancel is clicked', async () => {
      render(<LeaveTypeManager />, { wrapper });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Leave Type')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Create New Leave Type')).not.toBeInTheDocument();
      });
    });
  });

  describe('Deactivate Leave Type', () => {
    it('should show Deactivate button for active leave types', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        const deactivateButtons = screen.getAllByText('Deactivate');
        expect(deactivateButtons.length).toBeGreaterThan(0);
      });
    });

    it('should not show Deactivate button for inactive leave types', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Vacation')).toBeInTheDocument();
      });

      // Vacation is inactive, so it shouldn't have a Deactivate button next to it
      const allButtons = screen.getAllByRole('button');
      const deactivateButtons = allButtons.filter((btn) => btn.textContent === 'Deactivate');
      expect(deactivateButtons.length).toBe(1); // Only one active leave type
    });

    it('should show confirmation dialog when Deactivate is clicked', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to deactivate this leave type?'
      );
    });

    it('should call deactivateLeaveType when confirmed', async () => {
      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(leaveTypesService.deactivateLeaveType).toHaveBeenCalledWith('lt-1');
      });
    });

    it('should not call deactivateLeaveType when cancelled', async () => {
      window.confirm = vi.fn(() => false);

      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(leaveTypesService.deactivateLeaveType).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(leaveTypesService.getAllLeaveTypes).mockRejectedValue(new Error('Fetch failed'));

      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should handle update error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(leaveTypesService.updateLeaveType).mockRejectedValue(new Error('Update failed'));

      render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Sick Leave')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should handle create error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(leaveTypesService.createLeaveType).mockRejectedValue(new Error('Create failed'));

      render(<LeaveTypeManager />, { wrapper });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        const codeInput = screen.getByPlaceholderText('e.g., maternity');
        const labelInput = screen.getByPlaceholderText('e.g., Maternity Leave');

        fireEvent.change(codeInput, { target: { value: 'maternity' } });
        fireEvent.change(labelInput, { target: { value: 'Maternity Leave' } });
      });

      const createButton = screen.getByRole('button', { name: /Add Leave Type/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      const { container } = render(<LeaveTypeManager />, { wrapper });

      await waitFor(() => {
        const heading = container.querySelector('h3');
        expect(heading).toHaveTextContent('Leave Types');
      });
    });

    it('should have descriptive labels', async () => {
      render(<LeaveTypeManager />, { wrapper });

      const addButton = screen.getByText('Add Leave Type');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Code (enum value)')).toBeInTheDocument();
        expect(screen.getByText('Label')).toBeInTheDocument();
      });
    });
  });
});
