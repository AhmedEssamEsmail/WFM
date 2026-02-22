import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RulesConfig from '../../../components/BreakSchedule/RulesConfig';
import type { BreakScheduleRule } from '../../../types';

describe('RulesConfig Component', () => {
  const mockRules: BreakScheduleRule[] = [
    {
      id: 'rule-1',
      rule_name: 'Minimum Break Duration',
      description: 'Ensures breaks meet minimum duration requirements',
      is_active: true,
      is_blocking: true,
      parameters: {
        min_duration_minutes: 15,
        max_duration_minutes: 60,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rule-2',
      rule_name: 'Break Spacing',
      description: 'Ensures adequate spacing between breaks',
      is_active: false,
      is_blocking: false,
      parameters: {
        min_spacing_minutes: 120,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const defaultProps = {
    rules: mockRules,
    onUpdateRule: vi.fn().mockResolvedValue(undefined),
    onToggleRule: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component title', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Break Schedule Rules')).toBeInTheDocument();
    });

    it('should render all rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Minimum Break Duration')).toBeInTheDocument();
      expect(screen.getByText('Break Spacing')).toBeInTheDocument();
    });

    it('should render rule descriptions', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(
        screen.getByText('Ensures breaks meet minimum duration requirements')
      ).toBeInTheDocument();
      expect(screen.getByText('Ensures adequate spacing between breaks')).toBeInTheDocument();
    });

    it('should display Active badge for active rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display Inactive badge for inactive rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should display Blocking badge for blocking rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Blocking')).toBeInTheDocument();
    });

    it('should display Warning badge for non-blocking rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should render Edit button for each rule', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBe(2);
    });

    it('should render Activate button for inactive rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Activate')).toBeInTheDocument();
    });

    it('should render Deactivate button for active rules', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });

    it('should render rule parameters', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Min Duration Minutes:')).toBeInTheDocument();
      expect(screen.getByText('Max Duration Minutes:')).toBeInTheDocument();
      expect(screen.getByText('Min Spacing Minutes:')).toBeInTheDocument();
    });

    it('should display parameter values', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('should apply green border to active rules', () => {
      const { container } = render(<RulesConfig {...defaultProps} />);
      const activeRuleCard = container.querySelector('.border-green-300');
      expect(activeRuleCard).toBeInTheDocument();
    });

    it('should apply gray border to inactive rules', () => {
      const { container } = render(<RulesConfig {...defaultProps} />);
      const inactiveRuleCard = container.querySelector('.border-gray-200');
      expect(inactiveRuleCard).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when Edit button is clicked', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show input fields for parameters in edit mode', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should populate input fields with current parameter values', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(inputs[0].value).toBe('15');
      expect(inputs[1].value).toBe('60');
    });

    it('should update input value when changed', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      fireEvent.change(inputs[0], { target: { value: '20' } });
      expect(inputs[0].value).toBe('20');
    });

    it('should call onUpdateRule when Save button is clicked', async () => {
      const onUpdateRule = vi.fn().mockResolvedValue(undefined);
      render(<RulesConfig {...defaultProps} onUpdateRule={onUpdateRule} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '20' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onUpdateRule).toHaveBeenCalledWith('rule-1', {
          parameters: {
            min_duration_minutes: 20,
            max_duration_minutes: 60,
          },
        });
      });
    });

    it('should exit edit mode after successful save', async () => {
      render(<RulesConfig {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });
    });

    it('should exit edit mode when Cancel button is clicked', () => {
      render(<RulesConfig {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should discard changes when Cancel is clicked', () => {
      render(<RulesConfig {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '99' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Re-enter edit mode to check value
      const editButtonsAgain = screen.getAllByText('Edit');
      fireEvent.click(editButtonsAgain[0]);

      const inputsAgain = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(inputsAgain[0].value).toBe('15'); // Original value
    });

    it('should disable Save and Cancel buttons while saving', async () => {
      let resolveSave: any;
      const onUpdateRule = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<RulesConfig {...defaultProps} onUpdateRule={onUpdateRule} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(saveButton).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();

      if (resolveSave) resolveSave();
    });

    it('should handle save errors gracefully', async () => {
      const onUpdateRule = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<RulesConfig {...defaultProps} onUpdateRule={onUpdateRule} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update rule:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Toggle Rule', () => {
    it('should call onToggleRule when Deactivate button is clicked', async () => {
      const onToggleRule = vi.fn().mockResolvedValue(undefined);
      render(<RulesConfig {...defaultProps} onToggleRule={onToggleRule} />);

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(onToggleRule).toHaveBeenCalledWith('rule-1', false);
      });
    });

    it('should call onToggleRule when Activate button is clicked', async () => {
      const onToggleRule = vi.fn().mockResolvedValue(undefined);
      render(<RulesConfig {...defaultProps} onToggleRule={onToggleRule} />);

      const activateButton = screen.getByText('Activate');
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(onToggleRule).toHaveBeenCalledWith('rule-2', true);
      });
    });

    it('should handle toggle errors gracefully', async () => {
      const onToggleRule = vi.fn().mockRejectedValue(new Error('Toggle failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<RulesConfig {...defaultProps} onToggleRule={onToggleRule} />);

      const activateButton = screen.getByText('Activate');
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to toggle rule:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Parameter Handling', () => {
    it('should handle numeric parameters', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should handle string parameters', () => {
      const rulesWithStringParam: BreakScheduleRule[] = [
        {
          ...mockRules[0],
          parameters: {
            rule_type: 'strict',
          },
        },
      ];

      render(<RulesConfig {...defaultProps} rules={rulesWithStringParam} />);
      expect(screen.getByText('Rule Type:')).toBeInTheDocument();
      expect(screen.getByText('strict')).toBeInTheDocument();
    });

    it('should format parameter names correctly', () => {
      render(<RulesConfig {...defaultProps} />);
      expect(screen.getByText('Min Duration Minutes:')).toBeInTheDocument();
      expect(screen.getByText('Max Duration Minutes:')).toBeInTheDocument();
    });

    it('should handle rules without parameters', () => {
      const rulesWithoutParams: BreakScheduleRule[] = [
        {
          ...mockRules[0],
          parameters: {},
        },
      ];

      render(<RulesConfig {...defaultProps} rules={rulesWithoutParams} />);
      expect(screen.getByText('Minimum Break Duration')).toBeInTheDocument();
    });

    it('should handle null parameters', () => {
      const rulesWithNullParams: BreakScheduleRule[] = [
        {
          ...mockRules[0],
          parameters: null as any,
        },
      ];

      render(<RulesConfig {...defaultProps} rules={rulesWithNullParams} />);
      expect(screen.getByText('Minimum Break Duration')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rules array', () => {
      render(<RulesConfig {...defaultProps} rules={[]} />);
      expect(screen.getByText('Break Schedule Rules')).toBeInTheDocument();
    });

    it('should handle multiple rules in edit mode', () => {
      render(<RulesConfig {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Should only show Save/Cancel for the first rule
      const saveButtons = screen.getAllByText('Save');
      expect(saveButtons.length).toBe(1);
    });

    it('should handle switching between rules in edit mode', () => {
      render(<RulesConfig {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Click edit on second rule
      const editButtonsAgain = screen.getAllByText('Edit');
      fireEvent.click(editButtonsAgain[0]);

      // Should now be editing the second rule
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should handle very long rule names', () => {
      const rulesWithLongName: BreakScheduleRule[] = [
        {
          ...mockRules[0],
          rule_name: 'A'.repeat(100),
        },
      ];

      render(<RulesConfig {...defaultProps} rules={rulesWithLongName} />);
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const rulesWithLongDesc: BreakScheduleRule[] = [
        {
          ...mockRules[0],
          description: 'B'.repeat(200),
        },
      ];

      render(<RulesConfig {...defaultProps} rules={rulesWithLongDesc} />);
      expect(screen.getByText('B'.repeat(200))).toBeInTheDocument();
    });

    it('should handle negative parameter values', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '-10' } });

      const inputElement = inputs[0] as HTMLInputElement;
      expect(inputElement.value).toBe('-10');
    });

    it('should handle zero parameter values', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '0' } });

      const inputElement = inputs[0] as HTMLInputElement;
      expect(inputElement.value).toBe('0');
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(<RulesConfig {...defaultProps} />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Break Schedule Rules');
    });

    it('should have proper labels for input fields', () => {
      render(<RulesConfig {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Min Duration Minutes:')).toBeInTheDocument();
      expect(screen.getByText('Max Duration Minutes:')).toBeInTheDocument();
    });
  });
});
