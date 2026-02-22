import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DistributionSettingsForm from '../../components/DistributionSettingsForm';
import * as useDistributionSettingsModule from '../../hooks/useDistributionSettings';

// Mock the useDistributionSettings hook
vi.mock('../../hooks/useDistributionSettings');

describe('DistributionSettingsForm Component', () => {
  let mockUpdateSettings: ReturnType<typeof vi.fn>;
  let mockResetToDefaults: ReturnType<typeof vi.fn>;

  const mockSettings = [
    {
      shift_type: 'AM' as const,
      hb1_start_column: 4,
      b_offset_minutes: 150,
      hb2_offset_minutes: 150,
      ladder_increment: 1,
      max_agents_per_cycle: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      shift_type: 'PM' as const,
      hb1_start_column: 16,
      b_offset_minutes: 150,
      hb2_offset_minutes: 150,
      ladder_increment: 1,
      max_agents_per_cycle: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      shift_type: 'BET' as const,
      hb1_start_column: 8,
      b_offset_minutes: 150,
      hb2_offset_minutes: 150,
      ladder_increment: 1,
      max_agents_per_cycle: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockUpdateSettings = vi.fn();
    mockResetToDefaults = vi.fn();

    vi.mocked(useDistributionSettingsModule.useDistributionSettings).mockReturnValue({
      settings: mockSettings,
      isLoading: false,
      updateSettings: {
        mutateAsync: mockUpdateSettings,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: false,
        mutate: vi.fn(),
        reset: vi.fn(),
        status: 'idle' as const,
      },
      resetToDefaults: {
        mutateAsync: mockResetToDefaults,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: false,
        mutate: vi.fn(),
        reset: vi.fn(),
        status: 'idle' as const,
      },
    });
  });

  describe('Form Rendering with Default Props', () => {
    it('should render the form with title and description', () => {
      render(<DistributionSettingsForm />);

      expect(screen.getByText('Ladder Distribution Settings')).toBeInTheDocument();
      expect(screen.getByText(/Configure the starting times and intervals/i)).toBeInTheDocument();
    });

    it('should render settings for all three shift types', () => {
      render(<DistributionSettingsForm />);

      expect(screen.getByText('AM Shift')).toBeInTheDocument();
      expect(screen.getByText('PM Shift')).toBeInTheDocument();
      expect(screen.getByText('BET Shift')).toBeInTheDocument();
    });

    it('should render all form fields for each shift', () => {
      render(<DistributionSettingsForm />);

      // Check for HB1 Start Column fields
      const columnLabels = screen.getAllByText(/HB1 Start Column/i);
      expect(columnLabels).toHaveLength(3);

      // Check for offset fields
      const bOffsetLabels = screen.getAllByText(/Time between HB1 and B/i);
      expect(bOffsetLabels).toHaveLength(3);

      const hb2OffsetLabels = screen.getAllByText(/Time between B and HB2/i);
      expect(hb2OffsetLabels).toHaveLength(3);

      // Check for ladder increment fields
      const ladderLabels = screen.getAllByText(/Ladder Increment/i);
      expect(ladderLabels).toHaveLength(3);

      // Check for max agents fields
      const maxAgentsLabels = screen.getAllByText(/Max Agents Per Cycle/i);
      expect(maxAgentsLabels).toHaveLength(3);
    });

    it('should render action buttons', () => {
      render(<DistributionSettingsForm />);

      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });

    it('should display loading state when data is loading', () => {
      vi.mocked(useDistributionSettingsModule.useDistributionSettings).mockReturnValue({
        settings: [],
        isLoading: true,
        updateSettings: {
          mutateAsync: mockUpdateSettings,
          isPending: false,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'idle' as const,
        },
        resetToDefaults: {
          mutateAsync: mockResetToDefaults,
          isPending: false,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'idle' as const,
        },
      });

      render(<DistributionSettingsForm />);

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    });

    it('should populate form fields with settings data', () => {
      render(<DistributionSettingsForm />);

      // Get all number inputs
      const inputs = screen.getAllByRole('spinbutton');

      // AM shift: column 4
      expect(inputs[0]).toHaveValue(4);
      // AM shift: b_offset 150
      expect(inputs[1]).toHaveValue(150);
      // AM shift: hb2_offset 150
      expect(inputs[2]).toHaveValue(150);
      // AM shift: ladder_increment 1
      expect(inputs[3]).toHaveValue(1);
      // AM shift: max_agents 5
      expect(inputs[4]).toHaveValue(5);
    });

    it('should display time conversion for column values', () => {
      render(<DistributionSettingsForm />);

      // Column 4 = 9:00 + (4 * 15 min) = 10:00
      expect(screen.getByText(/Time: 10:00/i)).toBeInTheDocument();
      // Column 16 = 9:00 + (16 * 15 min) = 13:00
      expect(screen.getByText(/Time: 13:00/i)).toBeInTheDocument();
      // Column 8 = 9:00 + (8 * 15 min) = 11:00
      expect(screen.getByText(/Time: 11:00/i)).toBeInTheDocument();
    });
  });

  describe('Form Field Interactions', () => {
    it('should update column value when input changes', () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      const columnInput = inputs[0];

      fireEvent.change(columnInput, { target: { value: '10' } });

      expect(columnInput).toHaveValue(10);
    });

    it('should enable save button when form has changes', () => {
      render(<DistributionSettingsForm />);

      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).toBeDisabled();

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '10' } });

      expect(saveButton).not.toBeDisabled();
    });

    it('should update time display when column value changes', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      const columnInput = inputs[0];

      fireEvent.change(columnInput, { target: { value: '20' } });

      // Column 20 = 9:00 + (20 * 15 min) = 14:00
      await waitFor(() => {
        expect(screen.getByText(/Time: 14:00/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation and Error Display', () => {
    it('should show error when column is below 0', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '-1' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Start column must be between 0 and 47')).toBeInTheDocument();
      });
    });

    it('should show error when column is above 47', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '50' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Start column must be between 0 and 47')).toBeInTheDocument();
      });
    });

    it('should show error when b_offset is below 90 minutes', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[1], { target: { value: '60' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('B offset must be at least 90 minutes')).toBeInTheDocument();
      });
    });

    it('should show error when hb2_offset is below 90 minutes', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[2], { target: { value: '80' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('HB2 offset must be at least 90 minutes')).toBeInTheDocument();
      });
    });

    it('should show error when ladder_increment is below 1', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[3], { target: { value: '0' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Ladder increment must be between 1 and 20')).toBeInTheDocument();
      });
    });

    it('should show error when ladder_increment is above 20', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[3], { target: { value: '25' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Ladder increment must be between 1 and 20')).toBeInTheDocument();
      });
    });

    it('should show error when max_agents is below 1', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[4], { target: { value: '0' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Max agents per cycle must be between 1 and 50')
        ).toBeInTheDocument();
      });
    });

    it('should show error when max_agents is above 50', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[4], { target: { value: '60' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Max agents per cycle must be between 1 and 50')
        ).toBeInTheDocument();
      });
    });

    it('should show multiple errors for multiple invalid fields', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '50' } });
      fireEvent.change(inputs[1], { target: { value: '60' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Start column must be between 0 and 47')).toBeInTheDocument();
        expect(screen.getByText('B offset must be at least 90 minutes')).toBeInTheDocument();
      });
    });

    it('should not call updateSettings when validation fails', async () => {
      render(<DistributionSettingsForm />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '50' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Start column must be between 0 and 47')).toBeInTheDocument();
      });

      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission and Success Handling', () => {
    it('should call updateSettings when save button is clicked with valid data', async () => {
      mockUpdateSettings.mockResolvedValue(undefined);

      render(<DistributionSettingsForm />);

      await waitFor(() => {
        expect(screen.getByText('AM Shift')).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '10' } });

      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).not.toBeDisabled();

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalled();
      });
    });

    it('should disable save button during submission', () => {
      vi.mocked(useDistributionSettingsModule.useDistributionSettings).mockReturnValue({
        settings: mockSettings,
        isLoading: false,
        updateSettings: {
          mutateAsync: mockUpdateSettings,
          isPending: true,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'pending' as const,
        },
        resetToDefaults: {
          mutateAsync: mockResetToDefaults,
          isPending: false,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'idle' as const,
        },
      });

      render(<DistributionSettingsForm />);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });

    it('should show "Saving..." text during submission', () => {
      vi.mocked(useDistributionSettingsModule.useDistributionSettings).mockReturnValue({
        settings: mockSettings,
        isLoading: false,
        updateSettings: {
          mutateAsync: mockUpdateSettings,
          isPending: true,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'pending' as const,
        },
        resetToDefaults: {
          mutateAsync: mockResetToDefaults,
          isPending: false,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'idle' as const,
        },
      });

      render(<DistributionSettingsForm />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should call resetToDefaults when reset button is clicked and confirmed', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<DistributionSettingsForm />);

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to reset all settings to defaults?'
        );
        expect(mockResetToDefaults).toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
    });

    it('should not call resetToDefaults when reset is cancelled', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<DistributionSettingsForm />);

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      expect(mockResetToDefaults).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should disable reset button during reset operation', () => {
      vi.mocked(useDistributionSettingsModule.useDistributionSettings).mockReturnValue({
        settings: mockSettings,
        isLoading: false,
        updateSettings: {
          mutateAsync: mockUpdateSettings,
          isPending: false,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'idle' as const,
        },
        resetToDefaults: {
          mutateAsync: mockResetToDefaults,
          isPending: true,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'pending' as const,
        },
      });

      render(<DistributionSettingsForm />);

      const resetButton = screen.getByText('Resetting...');
      expect(resetButton).toBeDisabled();
    });

    it('should show "Resetting..." text during reset operation', () => {
      vi.mocked(useDistributionSettingsModule.useDistributionSettings).mockReturnValue({
        settings: mockSettings,
        isLoading: false,
        updateSettings: {
          mutateAsync: mockUpdateSettings,
          isPending: false,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'idle' as const,
        },
        resetToDefaults: {
          mutateAsync: mockResetToDefaults,
          isPending: true,
          isError: false,
          error: null,
          isSuccess: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          status: 'pending' as const,
        },
      });

      render(<DistributionSettingsForm />);

      expect(screen.getByText('Resetting...')).toBeInTheDocument();
    });

    it('should submit all three shift types when saving', async () => {
      mockUpdateSettings.mockResolvedValue(undefined);

      render(<DistributionSettingsForm />);

      await waitFor(() => {
        expect(screen.getByText('AM Shift')).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '10' } });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ shift_type: 'AM' }),
            expect.objectContaining({ shift_type: 'PM' }),
            expect.objectContaining({ shift_type: 'BET' }),
          ])
        );
      });
    });
  });
});
