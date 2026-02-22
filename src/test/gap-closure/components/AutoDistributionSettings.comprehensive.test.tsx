import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutoDistributionSettings from '../../../components/AutoDistributionSettings';
import type { DistributionStrategy, ApplyMode } from '../../../types';

/**
 * Comprehensive tests for AutoDistributionSettings component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.1, CR-2.1.4
 */
describe('AutoDistributionSettings Component', () => {
  const defaultProps = {
    defaultStrategy: 'balanced_coverage' as DistributionStrategy,
    defaultApplyMode: 'only_unscheduled' as ApplyMode,
    onSave: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Auto-Distribution Default Settings')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(
        screen.getByText(/Configure default settings for the auto-distribution feature/)
      ).toBeInTheDocument();
    });

    it('should render strategy section label', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Default Distribution Strategy')).toBeInTheDocument();
    });

    it('should render apply mode section label', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Default Apply Mode')).toBeInTheDocument();
    });

    it('should render Save Settings button', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });
  });

  describe('Strategy Selection - Rendering', () => {
    it('should render Ladder Distribution option', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Ladder Distribution')).toBeInTheDocument();
      expect(
        screen.getByText('Assigns breaks sequentially with predictable 15-minute increments')
      ).toBeInTheDocument();
    });

    it('should render Balanced Coverage option', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Balanced Coverage')).toBeInTheDocument();
      expect(
        screen.getByText('Minimizes variance in coverage across all intervals')
      ).toBeInTheDocument();
    });

    it('should render Staggered Timing option', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Staggered Timing')).toBeInTheDocument();
      expect(screen.getByText('Spreads breaks evenly throughout shift thirds')).toBeInTheDocument();
    });

    it('should render all three strategy radio buttons', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const allRadios = screen.getAllByRole('radio');
      const strategyRadios = allRadios.filter(
        (radio) => (radio as HTMLInputElement).name === 'strategy'
      );
      expect(strategyRadios).toHaveLength(3);
    });
  });

  describe('Strategy Selection - Default Values', () => {
    it('should default to balanced_coverage when provided', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultStrategy="balanced_coverage" />);
      const balancedRadio = screen.getByDisplayValue('balanced_coverage') as HTMLInputElement;
      expect(balancedRadio.checked).toBe(true);
    });

    it('should default to ladder when provided', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultStrategy="ladder" />);
      const ladderRadio = screen.getByDisplayValue('ladder') as HTMLInputElement;
      expect(ladderRadio.checked).toBe(true);
    });

    it('should default to staggered_timing when provided', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultStrategy="staggered_timing" />);
      const staggeredRadio = screen.getByDisplayValue('staggered_timing') as HTMLInputElement;
      expect(staggeredRadio.checked).toBe(true);
    });
  });

  describe('Strategy Selection - User Interaction', () => {
    it('should update strategy when ladder radio is clicked', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const ladderRadioChecked = screen.getByDisplayValue('ladder') as HTMLInputElement;
      expect(ladderRadioChecked.checked).toBe(true);
    });

    it('should update strategy when balanced_coverage radio is clicked', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultStrategy="ladder" />);
      const balancedRadio = screen.getByDisplayValue('balanced_coverage');
      fireEvent.click(balancedRadio);

      const balancedRadioChecked = screen.getByDisplayValue(
        'balanced_coverage'
      ) as HTMLInputElement;
      expect(balancedRadioChecked.checked).toBe(true);
    });

    it('should update strategy when staggered_timing radio is clicked', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const staggeredRadio = screen.getByDisplayValue('staggered_timing');
      fireEvent.click(staggeredRadio);

      const staggeredRadioChecked = screen.getByDisplayValue(
        'staggered_timing'
      ) as HTMLInputElement;
      expect(staggeredRadioChecked.checked).toBe(true);
    });

    it('should enable Save button when strategy changes', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      expect(saveButton.disabled).toBe(false);
    });
  });

  describe('Apply Mode Selection - Rendering', () => {
    it('should render Only Unscheduled option', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Only Unscheduled')).toBeInTheDocument();
      expect(
        screen.getByText('Only assign breaks to agents without existing schedules')
      ).toBeInTheDocument();
    });

    it('should render All Agents option', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('All Agents')).toBeInTheDocument();
      expect(screen.getByText('Clear and reassign breaks for all agents')).toBeInTheDocument();
    });

    it('should render both apply mode radio buttons', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const allRadios = screen.getAllByRole('radio');
      const applyModeRadios = allRadios.filter(
        (radio) => (radio as HTMLInputElement).name === 'applyMode'
      );
      expect(applyModeRadios).toHaveLength(2);
    });
  });

  describe('Apply Mode Selection - Default Values', () => {
    it('should default to only_unscheduled when provided', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultApplyMode="only_unscheduled" />);
      const onlyUnscheduledRadio = screen.getByDisplayValue('only_unscheduled') as HTMLInputElement;
      expect(onlyUnscheduledRadio.checked).toBe(true);
    });

    it('should default to all_agents when provided', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultApplyMode="all_agents" />);
      const allAgentsRadio = screen.getByDisplayValue('all_agents') as HTMLInputElement;
      expect(allAgentsRadio.checked).toBe(true);
    });
  });

  describe('Apply Mode Selection - User Interaction', () => {
    it('should update apply mode when only_unscheduled radio is clicked', () => {
      render(<AutoDistributionSettings {...defaultProps} defaultApplyMode="all_agents" />);
      const onlyUnscheduledRadio = screen.getByDisplayValue('only_unscheduled');
      fireEvent.click(onlyUnscheduledRadio);

      const onlyUnscheduledRadioChecked = screen.getByDisplayValue(
        'only_unscheduled'
      ) as HTMLInputElement;
      expect(onlyUnscheduledRadioChecked.checked).toBe(true);
    });

    it('should update apply mode when all_agents radio is clicked', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      fireEvent.click(allAgentsRadio);

      const allAgentsRadioChecked = screen.getByDisplayValue('all_agents') as HTMLInputElement;
      expect(allAgentsRadioChecked.checked).toBe(true);
    });

    it('should enable Save button when apply mode changes', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);

      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      fireEvent.click(allAgentsRadio);

      expect(saveButton.disabled).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should disable Save button when no changes are made', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);
    });

    it('should enable Save button when strategy changes', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(false);
    });

    it('should enable Save button when apply mode changes', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      fireEvent.click(allAgentsRadio);

      const saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(false);
    });

    it('should enable Save button when both strategy and apply mode change', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const ladderRadio = screen.getByDisplayValue('ladder');
      const allAgentsRadio = screen.getByDisplayValue('all_agents');

      fireEvent.click(ladderRadio);
      fireEvent.click(allAgentsRadio);

      const saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(false);
    });

    it('should disable Save button when changes are reverted to defaults', () => {
      render(<AutoDistributionSettings {...defaultProps} />);

      // Make a change
      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      let saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(false);

      // Revert the change
      const balancedRadio = screen.getByDisplayValue('balanced_coverage');
      fireEvent.click(balancedRadio);

      saveButton = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with updated strategy when Save is clicked', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('ladder', 'only_unscheduled');
      });
    });

    it('should call onSave with updated apply mode when Save is clicked', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      fireEvent.click(allAgentsRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('balanced_coverage', 'all_agents');
      });
    });

    it('should call onSave with both updated values when Save is clicked', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const staggeredRadio = screen.getByDisplayValue('staggered_timing');
      const allAgentsRadio = screen.getByDisplayValue('all_agents');

      fireEvent.click(staggeredRadio);
      fireEvent.click(allAgentsRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('staggered_timing', 'all_agents');
      });
    });

    it('should show Saving... text while saving', async () => {
      let resolveSave: any;
      const onSave = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      if (resolveSave) resolveSave();
    });

    it('should disable Save button while saving', async () => {
      let resolveSave: any;
      const onSave = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const savingButton = screen.getByText('Saving...') as HTMLButtonElement;
        expect(savingButton.disabled).toBe(true);
      });

      if (resolveSave) resolveSave();
    });

    it('should handle save errors gracefully', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should re-enable Save button after save error', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      // Button should be re-enabled after error
      const saveButtonAfterError = screen.getByText('Save Settings') as HTMLButtonElement;
      expect(saveButtonAfterError.disabled).toBe(false);

      consoleError.mockRestore();
    });

    it('should call onSave only once per click', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      const { container } = render(<AutoDistributionSettings {...defaultProps} />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Auto-Distribution Default Settings');
    });

    it('should have proper labels for strategy radio buttons', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Default Distribution Strategy')).toBeInTheDocument();
    });

    it('should have proper labels for apply mode radio buttons', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      expect(screen.getByText('Default Apply Mode')).toBeInTheDocument();
    });

    it('should have clickable labels for radio buttons', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const ladderLabel = screen.getByText('Ladder Distribution').closest('label');
      expect(ladderLabel).toHaveClass('cursor-pointer');
    });

    it('should have all radio buttons in proper groups', () => {
      render(<AutoDistributionSettings {...defaultProps} />);
      const strategyRadios = screen
        .getAllByRole('radio')
        .filter((radio) => (radio as HTMLInputElement).name === 'strategy');
      const applyModeRadios = screen
        .getAllByRole('radio')
        .filter((radio) => (radio as HTMLInputElement).name === 'applyMode');

      expect(strategyRadios).toHaveLength(3);
      expect(applyModeRadios).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid strategy changes', () => {
      render(<AutoDistributionSettings {...defaultProps} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      const staggeredRadio = screen.getByDisplayValue('staggered_timing');
      const balancedRadio = screen.getByDisplayValue('balanced_coverage');

      fireEvent.click(ladderRadio);
      fireEvent.click(staggeredRadio);
      fireEvent.click(balancedRadio);

      const balancedRadioChecked = screen.getByDisplayValue(
        'balanced_coverage'
      ) as HTMLInputElement;
      expect(balancedRadioChecked.checked).toBe(true);
    });

    it('should handle rapid apply mode changes', () => {
      render(<AutoDistributionSettings {...defaultProps} />);

      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      const onlyUnscheduledRadio = screen.getByDisplayValue('only_unscheduled');

      fireEvent.click(allAgentsRadio);
      fireEvent.click(onlyUnscheduledRadio);

      const onlyUnscheduledRadioChecked = screen.getByDisplayValue(
        'only_unscheduled'
      ) as HTMLInputElement;
      expect(onlyUnscheduledRadioChecked.checked).toBe(true);
    });

    it('should prevent multiple simultaneous saves', async () => {
      let resolveSave: any;
      const onSave = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });

      if (resolveSave) resolveSave();
    });

    it('should maintain state after successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<AutoDistributionSettings {...defaultProps} onSave={onSave} />);

      const ladderRadio = screen.getByDisplayValue('ladder');
      fireEvent.click(ladderRadio);

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });

      // Strategy should still be ladder after save
      const ladderRadioAfterSave = screen.getByDisplayValue('ladder') as HTMLInputElement;
      expect(ladderRadioAfterSave.checked).toBe(true);
    });

    it('should handle all strategy combinations with all apply modes', async () => {
      const strategies: DistributionStrategy[] = [
        'ladder',
        'balanced_coverage',
        'staggered_timing',
      ];
      const applyModes: ApplyMode[] = ['only_unscheduled', 'all_agents'];

      for (const strategy of strategies) {
        for (const applyMode of applyModes) {
          // Skip the default combination as it won't enable the save button
          if (strategy === 'balanced_coverage' && applyMode === 'only_unscheduled') {
            continue;
          }

          const onSave = vi.fn().mockResolvedValue(undefined);
          const { unmount } = render(
            <AutoDistributionSettings
              defaultStrategy="balanced_coverage"
              defaultApplyMode="only_unscheduled"
              onSave={onSave}
            />
          );

          const strategyRadio = screen.getByDisplayValue(strategy);
          const applyModeRadio = screen.getByDisplayValue(applyMode);

          fireEvent.click(strategyRadio);
          fireEvent.click(applyModeRadio);

          const saveButton = screen.getByText('Save Settings');
          fireEvent.click(saveButton);

          await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(strategy, applyMode);
          });

          unmount();
        }
      }
    });
  });
});
