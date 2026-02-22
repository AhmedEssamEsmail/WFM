import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShiftConfigurations from '../../components/ShiftConfigurations';
import type { ShiftConfiguration } from '../../types';

/**
 * ShiftConfigurations Component Tests
 *
 * Requirements Coverage:
 * - 4.4: Component tests for ShiftConfigurations covering configuration management
 * - 4.15: Verify initial rendering with default props
 * - 4.16: Simulate user interactions and verify state changes
 */
describe('ShiftConfigurations Component', () => {
  let mockOnUpdateShift: ReturnType<typeof vi.fn>;
  let mockOnToggleShift: ReturnType<typeof vi.fn>;
  let mockOnCreateShift: ReturnType<typeof vi.fn>;
  let mockOnDeleteShift: ReturnType<typeof vi.fn>;

  const mockShifts: ShiftConfiguration[] = [
    {
      id: '1',
      shift_code: 'AM',
      shift_label: 'Morning Shift',
      start_time: '09:00:00',
      end_time: '17:00:00',
      is_active: true,
      display_order: 1,
      description: 'Standard morning shift',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      shift_code: 'PM',
      shift_label: 'Evening Shift',
      start_time: '13:00:00',
      end_time: '21:00:00',
      is_active: true,
      display_order: 2,
      description: 'Standard evening shift',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      shift_code: 'OFF',
      shift_label: 'Day Off',
      start_time: '00:00:00',
      end_time: '00:00:00',
      is_active: false,
      display_order: 3,
      description: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockOnUpdateShift = vi.fn().mockResolvedValue(undefined);
    mockOnToggleShift = vi.fn().mockResolvedValue(undefined);
    mockOnCreateShift = vi.fn().mockResolvedValue(undefined);
    mockOnDeleteShift = vi.fn().mockResolvedValue(undefined);
  });

  describe('Configuration Display', () => {
    it('should render the component with title and description', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      expect(screen.getByText('Shift Configurations')).toBeInTheDocument();
      expect(
        screen.getByText('Configure shift times for break schedule management')
      ).toBeInTheDocument();
    });

    it('should render Add Shift button', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      expect(screen.getByText('Add Shift')).toBeInTheDocument();
    });

    it('should display all shifts', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      expect(screen.getByText('AM')).toBeInTheDocument();
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
      expect(screen.getByText('PM')).toBeInTheDocument();
      expect(screen.getByText('Evening Shift')).toBeInTheDocument();
      expect(screen.getByText('OFF')).toBeInTheDocument();
      expect(screen.getByText('Day Off')).toBeInTheDocument();
    });

    it('should display shift times correctly', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      // Check start and end times (displayed as HH:MM)
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('17:00')).toBeInTheDocument();
      expect(screen.getByText('13:00')).toBeInTheDocument();
      expect(screen.getByText('21:00')).toBeInTheDocument();
    });

    it('should display active status badge for active shifts', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBe(2); // AM and PM are active
    });

    it('should display inactive status badge for inactive shifts', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const inactiveBadges = screen.getAllByText('Inactive');
      expect(inactiveBadges.length).toBe(1); // OFF is inactive
    });

    it('should display shift descriptions when present', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      expect(screen.getByText('Standard morning shift')).toBeInTheDocument();
      expect(screen.getByText('Standard evening shift')).toBeInTheDocument();
    });

    it('should display display order for each shift', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      // Check for display order values
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render Edit button for each shift', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBe(3);
    });

    it('should render Activate button for inactive shifts', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      expect(screen.getByText('Activate')).toBeInTheDocument();
    });

    it('should render Deactivate button for active shifts', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deactivateButtons = screen.getAllByText('Deactivate');
      expect(deactivateButtons.length).toBe(2); // AM and PM
    });

    it('should render Delete button for non-OFF shifts', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBe(2); // AM and PM, but not OFF
    });

    it('should not render Delete button for OFF shift', () => {
      const offShift = mockShifts.find((s) => s.shift_code === 'OFF');
      expect(offShift).toBeDefined();

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      // OFF shift should not have a delete button
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBe(2); // Only AM and PM
    });

    it('should display empty state when no shifts provided', () => {
      render(
        <ShiftConfigurations
          shifts={[]}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      expect(screen.getByText('Shift Configurations')).toBeInTheDocument();
      expect(screen.queryByText('AM')).not.toBeInTheDocument();
    });
  });

  describe('Configuration Editing Interactions', () => {
    it('should enter edit mode when Edit button is clicked', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Should show Save and Cancel buttons
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show input fields in edit mode', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Should have input fields for editing
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should update shift label when edited', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const labelInput = screen.getByDisplayValue('Morning Shift');
      fireEvent.change(labelInput, { target: { value: 'Updated Morning Shift' } });

      expect(labelInput).toHaveValue('Updated Morning Shift');
    });

    it('should update start time when edited', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const timeInputs = screen.getAllByDisplayValue('09:00');
      fireEvent.change(timeInputs[0], { target: { value: '08:00' } });

      expect(timeInputs[0]).toHaveValue('08:00');
    });

    it('should update end time when edited', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const timeInputs = screen.getAllByDisplayValue('17:00');
      fireEvent.change(timeInputs[0], { target: { value: '18:00' } });

      expect(timeInputs[0]).toHaveValue('18:00');
    });

    it('should update display order when edited', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const orderInputs = screen.getAllByRole('spinbutton');
      const orderInput = orderInputs.find((input) => (input as HTMLInputElement).value === '1');
      expect(orderInput).toBeDefined();

      if (orderInput) {
        fireEvent.change(orderInput, { target: { value: '5' } });
        expect(orderInput).toHaveValue(5);
      }
    });
  });

  describe('Save and Cancel Functionality', () => {
    it('should call onUpdateShift when Save button is clicked', async () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const labelInput = screen.getByDisplayValue('Morning Shift');
      fireEvent.change(labelInput, { target: { value: 'Updated Morning Shift' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdateShift).toHaveBeenCalledWith('1', {
          shift_label: 'Updated Morning Shift',
          start_time: '09:00:00',
          end_time: '17:00:00',
          description: 'Standard morning shift',
          display_order: 1,
        });
      });
    });

    it('should exit edit mode after successful save', async () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdateShift).toHaveBeenCalled();
      });

      // Should exit edit mode and show Edit button again
      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });

    it('should exit edit mode when Cancel button is clicked', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const labelInput = screen.getByDisplayValue('Morning Shift');
      fireEvent.change(labelInput, { target: { value: 'Updated Morning Shift' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should exit edit mode without saving
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(mockOnUpdateShift).not.toHaveBeenCalled();
    });

    it('should discard changes when Cancel is clicked', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const labelInput = screen.getByDisplayValue('Morning Shift');
      fireEvent.change(labelInput, { target: { value: 'Updated Morning Shift' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Original value should be displayed
      expect(screen.getByText('Morning Shift')).toBeInTheDocument();
    });

    it('should disable Save and Cancel buttons while saving', async () => {
      let resolveSave: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      mockOnUpdateShift.mockReturnValue(savePromise);

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();

      resolveSave!();
    });

    it('should handle save errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnUpdateShift.mockRejectedValue(new Error('Save failed'));

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update shift:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should call onToggleShift when Activate button is clicked', async () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const activateButton = screen.getByText('Activate');
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(mockOnToggleShift).toHaveBeenCalledWith('3', true);
      });
    });

    it('should call onToggleShift when Deactivate button is clicked', async () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deactivateButtons = screen.getAllByText('Deactivate');
      fireEvent.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(mockOnToggleShift).toHaveBeenCalledWith('1', false);
      });
    });

    it('should handle toggle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnToggleShift.mockRejectedValue(new Error('Toggle failed'));

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const activateButton = screen.getByText('Activate');
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to toggle shift:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Add Shift Form', () => {
    it('should show add form when Add Shift button is clicked', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New Shift')).toBeInTheDocument();
    });

    it('should render all form fields in add form', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      expect(screen.getByPlaceholderText('e.g., NIGHT')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Night Shift')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Optional description')).toBeInTheDocument();
    });

    it('should update shift code field and convert to uppercase', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const codeInput = screen.getByPlaceholderText('e.g., NIGHT');
      fireEvent.change(codeInput, { target: { value: 'night' } });

      expect(codeInput).toHaveValue('NIGHT');
    });

    it('should update shift label field', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const labelInput = screen.getByPlaceholderText('e.g., Night Shift');
      fireEvent.change(labelInput, { target: { value: 'Night Shift' } });

      expect(labelInput).toHaveValue('Night Shift');
    });

    it('should call onCreateShift when Create Shift button is clicked with valid data', async () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const codeInput = screen.getByPlaceholderText('e.g., NIGHT');
      fireEvent.change(codeInput, { target: { value: 'NIGHT' } });

      const labelInput = screen.getByPlaceholderText('e.g., Night Shift');
      fireEvent.change(labelInput, { target: { value: 'Night Shift' } });

      const createButton = screen.getByText('Create Shift');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnCreateShift).toHaveBeenCalledWith({
          shift_code: 'NIGHT',
          shift_label: 'Night Shift',
          start_time: '09:00:00',
          end_time: '17:00:00',
          description: '',
          display_order: 4,
          is_active: true,
        });
      });
    });

    it('should show alert when shift code is missing', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const labelInput = screen.getByPlaceholderText('e.g., Night Shift');
      fireEvent.change(labelInput, { target: { value: 'Night Shift' } });

      const createButton = screen.getByText('Create Shift');
      fireEvent.click(createButton);

      expect(alertSpy).toHaveBeenCalledWith('Please fill in shift code and label');
      expect(mockOnCreateShift).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should show alert when shift label is missing', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const codeInput = screen.getByPlaceholderText('e.g., NIGHT');
      fireEvent.change(codeInput, { target: { value: 'NIGHT' } });

      const createButton = screen.getByText('Create Shift');
      fireEvent.click(createButton);

      expect(alertSpy).toHaveBeenCalledWith('Please fill in shift code and label');
      expect(mockOnCreateShift).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should close add form when Cancel button is clicked', () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New Shift')).toBeInTheDocument();

      const cancelButtons = screen.getAllByText('Cancel');
      const addFormCancelButton = cancelButtons[cancelButtons.length - 1];
      fireEvent.click(addFormCancelButton);

      expect(screen.queryByText('Add New Shift')).not.toBeInTheDocument();
    });

    it('should reset form and close after successful creation', async () => {
      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const codeInput = screen.getByPlaceholderText('e.g., NIGHT');
      fireEvent.change(codeInput, { target: { value: 'NIGHT' } });

      const labelInput = screen.getByPlaceholderText('e.g., Night Shift');
      fireEvent.change(labelInput, { target: { value: 'Night Shift' } });

      const createButton = screen.getByText('Create Shift');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnCreateShift).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.queryByText('Add New Shift')).not.toBeInTheDocument();
      });
    });

    it('should handle create errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnCreateShift.mockRejectedValue(new Error('Create failed'));

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const addButton = screen.getByText('Add Shift');
      fireEvent.click(addButton);

      const codeInput = screen.getByPlaceholderText('e.g., NIGHT');
      fireEvent.change(codeInput, { target: { value: 'NIGHT' } });

      const labelInput = screen.getByPlaceholderText('e.g., Night Shift');
      fireEvent.change(labelInput, { target: { value: 'Night Shift' } });

      const createButton = screen.getByText('Create Shift');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create shift:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Delete Shift Functionality', () => {
    it('should show confirmation dialog when Delete button is clicked', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete the AM shift? This cannot be undone.'
      );

      confirmSpy.mockRestore();
    });

    it('should call onDeleteShift when deletion is confirmed', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnDeleteShift).toHaveBeenCalledWith('1');
      });

      confirmSpy.mockRestore();
    });

    it('should not call onDeleteShift when deletion is cancelled', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDeleteShift).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should handle delete errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockOnDeleteShift.mockRejectedValue(new Error('Delete failed'));

      render(
        <ShiftConfigurations
          shifts={mockShifts}
          onUpdateShift={mockOnUpdateShift}
          onToggleShift={mockOnToggleShift}
          onCreateShift={mockOnCreateShift}
          onDeleteShift={mockOnDeleteShift}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete shift:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
      confirmSpy.mockRestore();
    });
  });
});
