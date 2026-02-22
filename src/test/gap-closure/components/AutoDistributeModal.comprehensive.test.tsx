import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutoDistributeModal from '../../../components/BreakSchedule/AutoDistributeModal';
import type { AutoDistributePreview, AutoDistributeRequest } from '../../../types';

describe('AutoDistributeModal Component', () => {
  const mockDepartments = ['Engineering', 'Sales', 'Support'];

  const mockPreview: AutoDistributePreview = {
    proposed_schedules: [
      {
        user_id: 'user-1',
        name: 'John Doe',
        shift_type: 'AM',
        breaks: { HB1: '10:00:00', B: '12:00:00', HB2: '14:00:00' },
        intervals: { '10:00': 'HB1', '12:00': 'B', '14:00': 'HB2' },
        has_warning: false,
      },
    ],
    coverage_stats: {
      min_coverage: 5,
      max_coverage: 10,
      avg_coverage: 7.5,
      variance: 1.25,
    },
    rule_compliance: {
      total_violations: 2,
      blocking_violations: 0,
      warning_violations: 2,
    },
    failed_agents: [],
  };

  const defaultProps = {
    onClose: vi.fn(),
    onApply: vi.fn().mockResolvedValue(undefined),
    onPreview: vi.fn().mockResolvedValue(mockPreview),
    departments: mockDepartments,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with title', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Auto-Distribute Breaks')).toBeInTheDocument();
    });

    it('should render strategy selection section', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Distribution Strategy')).toBeInTheDocument();
    });

    it('should render apply mode selection section', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Apply Mode')).toBeInTheDocument();
    });

    it('should render department filter section', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Department Filter (Optional)')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render Apply Distribution button', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Apply Distribution')).toBeInTheDocument();
    });

    it('should render modal overlay', () => {
      const { container } = render(<AutoDistributeModal {...defaultProps} />);
      const overlay = container.querySelector('.bg-gray-500.bg-opacity-75');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Strategy Selection', () => {
    it('should render Balanced Coverage strategy option', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Balanced Coverage')).toBeInTheDocument();
      expect(
        screen.getByText('Minimizes variance in coverage across all intervals')
      ).toBeInTheDocument();
    });

    it('should render Staggered Timing strategy option', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Staggered Timing')).toBeInTheDocument();
      expect(screen.getByText('Spreads breaks evenly throughout shift thirds')).toBeInTheDocument();
    });

    it('should default to balanced_coverage strategy', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const balancedRadio = screen.getByDisplayValue('balanced_coverage') as HTMLInputElement;
      expect(balancedRadio.checked).toBe(true);
    });

    it('should use defaultStrategy prop when provided', () => {
      render(<AutoDistributeModal {...defaultProps} defaultStrategy="staggered_timing" />);
      const staggeredRadio = screen.getByDisplayValue('staggered_timing') as HTMLInputElement;
      expect(staggeredRadio.checked).toBe(true);
    });

    it('should update strategy when radio button is clicked', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const staggeredRadio = screen.getByDisplayValue('staggered_timing');
      fireEvent.click(staggeredRadio);

      const staggeredRadioChecked = screen.getByDisplayValue(
        'staggered_timing'
      ) as HTMLInputElement;
      expect(staggeredRadioChecked.checked).toBe(true);
    });

    it('should trigger preview generation when strategy changes', async () => {
      const onPreview = vi.fn().mockResolvedValue(mockPreview);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      // Wait for initial preview
      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 }
      );

      const staggeredRadio = screen.getByDisplayValue('staggered_timing');
      fireEvent.click(staggeredRadio);

      // Should trigger another preview after debounce
      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledTimes(2);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Apply Mode Selection', () => {
    it('should render Only Unscheduled apply mode option', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('Only Unscheduled')).toBeInTheDocument();
      expect(
        screen.getByText('Only assign breaks to agents without existing schedules')
      ).toBeInTheDocument();
    });

    it('should render All Agents apply mode option', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('All Agents')).toBeInTheDocument();
      expect(screen.getByText('Clear and reassign breaks for all agents')).toBeInTheDocument();
    });

    it('should default to only_unscheduled apply mode', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const onlyUnscheduledRadio = screen.getByDisplayValue('only_unscheduled') as HTMLInputElement;
      expect(onlyUnscheduledRadio.checked).toBe(true);
    });

    it('should use defaultApplyMode prop when provided', () => {
      render(<AutoDistributeModal {...defaultProps} defaultApplyMode="all_agents" />);
      const allAgentsRadio = screen.getByDisplayValue('all_agents') as HTMLInputElement;
      expect(allAgentsRadio.checked).toBe(true);
    });

    it('should update apply mode when radio button is clicked', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      fireEvent.click(allAgentsRadio);

      const allAgentsRadioChecked = screen.getByDisplayValue('all_agents') as HTMLInputElement;
      expect(allAgentsRadioChecked.checked).toBe(true);
    });

    it('should trigger preview generation when apply mode changes', async () => {
      const onPreview = vi.fn().mockResolvedValue(mockPreview);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      // Wait for initial preview
      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 }
      );

      const allAgentsRadio = screen.getByDisplayValue('all_agents');
      fireEvent.click(allAgentsRadio);

      // Should trigger another preview after debounce
      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledTimes(2);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Department Filter', () => {
    it('should render department select with All Departments option', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByText('All Departments')).toBeInTheDocument();
    });

    it('should render all department options', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      mockDepartments.forEach((dept) => {
        expect(screen.getByText(dept)).toBeInTheDocument();
      });
    });

    it('should default to All Departments', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const select = screen.getByLabelText('Department Filter (Optional)') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should update selected department when changed', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const select = screen.getByLabelText('Department Filter (Optional)');
      fireEvent.change(select, { target: { value: 'Engineering' } });

      const selectElement = select as HTMLSelectElement;
      expect(selectElement.value).toBe('Engineering');
    });

    it('should trigger preview generation when department changes', async () => {
      const onPreview = vi.fn().mockResolvedValue(mockPreview);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      // Wait for initial preview
      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 }
      );

      const select = screen.getByLabelText('Department Filter (Optional)');
      fireEvent.change(select, { target: { value: 'Engineering' } });

      // Should trigger another preview after debounce
      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledTimes(2);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Preview Generation', () => {
    it('should generate preview on mount', async () => {
      const onPreview = vi.fn().mockResolvedValue(mockPreview);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(onPreview).toHaveBeenCalledWith({
            strategy: 'balanced_coverage',
            apply_mode: 'only_unscheduled',
            department: undefined,
          });
        },
        { timeout: 1000 }
      );
    });

    it('should show loading spinner while generating preview', async () => {
      let resolvePreview: any;
      const onPreview = vi.fn(() => new Promise((resolve) => (resolvePreview = resolve)));
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });

      if (resolvePreview) resolvePreview(mockPreview);
    });

    it('should display preview data after loading', async () => {
      render(<AutoDistributeModal {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display agents affected count', async () => {
      render(<AutoDistributeModal {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText('Agents Affected:')).toBeInTheDocument();
          expect(screen.getByText('1')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display coverage variance', async () => {
      render(<AutoDistributeModal {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText('Coverage Variance:')).toBeInTheDocument();
          expect(screen.getByText('1.25')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display total violations', async () => {
      render(<AutoDistributeModal {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText('Total Violations:')).toBeInTheDocument();
          expect(screen.getByText('2')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display blocking violations', async () => {
      render(<AutoDistributeModal {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.getByText('Blocking Violations:')).toBeInTheDocument();
          expect(screen.getByText('0')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should handle preview generation errors', async () => {
      const onPreview = vi.fn().mockRejectedValue(new Error('Preview failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(consoleError).toHaveBeenCalledWith(
            'Failed to generate preview:',
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      consoleError.mockRestore();
    });
  });

  describe('Failed Agents Display', () => {
    it('should display failed agents section when present', async () => {
      const previewWithFailures: AutoDistributePreview = {
        ...mockPreview,
        failed_agents: [
          {
            user_id: 'user-2',
            name: 'Jane Smith',
            reason: 'Shift too short for required breaks',
          },
        ],
      };

      const onPreview = vi.fn().mockResolvedValue(previewWithFailures);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(screen.getByText(/Failed Agents \(1\):/)).toBeInTheDocument();
          expect(screen.getByText('Jane Smith')).toBeInTheDocument();
          expect(screen.getByText('Shift too short for required breaks')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display blocked by rules when present', async () => {
      const previewWithBlockedAgents: AutoDistributePreview = {
        ...mockPreview,
        failed_agents: [
          {
            user_id: 'user-2',
            name: 'Jane Smith',
            reason: 'Blocked by validation rules',
            blockedBy: ['min_break_duration', 'break_spacing'],
          },
        ],
      };

      const onPreview = vi.fn().mockResolvedValue(previewWithBlockedAgents);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(screen.getByText('Blocked by validation rules:')).toBeInTheDocument();
          expect(screen.getByText('min_break_duration')).toBeInTheDocument();
          expect(screen.getByText('break_spacing')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should display error banner when no breaks assigned', async () => {
      const previewWithNoBreaks: AutoDistributePreview = {
        ...mockPreview,
        proposed_schedules: [],
        coverage_stats: {
          ...mockPreview.coverage_stats,
          variance: 1.25,
        },
        failed_agents: [
          {
            user_id: 'user-1',
            name: 'John Doe',
            reason: 'All agents failed validation',
          },
        ],
      };

      const onPreview = vi.fn().mockResolvedValue(previewWithNoBreaks);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(
            screen.getByText('No breaks assigned during auto-distribution')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should not display failed agents section when empty', async () => {
      render(<AutoDistributeModal {...defaultProps} />);

      await waitFor(
        () => {
          expect(screen.queryByText(/Failed Agents/)).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Apply Distribution', () => {
    it('should call onApply when Apply Distribution button is clicked', async () => {
      const onApply = vi.fn().mockResolvedValue(undefined);
      render(<AutoDistributeModal {...defaultProps} onApply={onApply} />);

      // Wait for preview to load
      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const applyButton = screen.getByText('Apply Distribution');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(onApply).toHaveBeenCalledWith(
          {
            strategy: 'balanced_coverage',
            apply_mode: 'only_unscheduled',
            department: undefined,
          },
          []
        );
      });
    });

    it('should pass failed agents to onApply', async () => {
      const failedAgents = [
        {
          user_id: 'user-2',
          name: 'Jane Smith',
          reason: 'Failed',
          blockedBy: ['rule1'],
        },
      ];

      const previewWithFailures: AutoDistributePreview = {
        ...mockPreview,
        failed_agents: failedAgents,
      };

      const onApply = vi.fn().mockResolvedValue(undefined);
      const onPreview = vi.fn().mockResolvedValue(previewWithFailures);
      render(<AutoDistributeModal {...defaultProps} onApply={onApply} onPreview={onPreview} />);

      // Wait for preview to load
      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const applyButton = screen.getByText('Apply Distribution');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(onApply).toHaveBeenCalledWith(expect.any(Object), failedAgents);
      });
    });

    it('should call onClose after successful apply', async () => {
      const onClose = vi.fn();
      render(<AutoDistributeModal {...defaultProps} onClose={onClose} />);

      // Wait for preview to load
      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const applyButton = screen.getByText('Apply Distribution');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should show Applying... text while applying', async () => {
      let resolveApply: any;
      const onApply = vi.fn(() => new Promise((resolve) => (resolveApply = resolve)));
      render(<AutoDistributeModal {...defaultProps} onApply={onApply} />);

      // Wait for preview to load
      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const applyButton = screen.getByText('Apply Distribution');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Applying...')).toBeInTheDocument();
      });

      if (resolveApply) resolveApply();
    });

    it('should disable Apply button while applying', async () => {
      let resolveApply: any;
      const onApply = vi.fn(() => new Promise((resolve) => (resolveApply = resolve)));
      render(<AutoDistributeModal {...defaultProps} onApply={onApply} />);

      // Wait for preview to load
      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const applyButton = screen.getByText('Apply Distribution');
      fireEvent.click(applyButton);

      await waitFor(() => {
        const applyingButton = screen.getByText('Applying...');
        expect(applyingButton).toBeDisabled();
      });

      if (resolveApply) resolveApply();
    });

    it('should disable Apply button while loading preview', async () => {
      let resolvePreview: any;
      const onPreview = vi.fn(() => new Promise((resolve) => (resolvePreview = resolve)));
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(() => {
        const applyButton = screen.getByText('Apply Distribution');
        expect(applyButton).toBeDisabled();
      });

      if (resolvePreview) resolvePreview(mockPreview);
    });

    it('should handle apply errors gracefully', async () => {
      const onApply = vi.fn().mockRejectedValue(new Error('Apply failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AutoDistributeModal {...defaultProps} onApply={onApply} />);

      // Wait for preview to load
      await waitFor(
        () => {
          expect(screen.getByText('Preview')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const applyButton = screen.getByText('Apply Distribution');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to apply distribution:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Cancel Action', () => {
    it('should call onClose when Cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<AutoDistributeModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form elements', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      expect(screen.getByLabelText('Department Filter (Optional)')).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<AutoDistributeModal {...defaultProps} />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Auto-Distribute Breaks');
    });

    it('should have proper radio button groups', () => {
      render(<AutoDistributeModal {...defaultProps} />);
      const allRadios = screen.getAllByRole('radio');
      expect(allRadios.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty departments array', () => {
      render(<AutoDistributeModal {...defaultProps} departments={[]} />);
      expect(screen.getByText('All Departments')).toBeInTheDocument();
    });

    it('should handle preview with zero agents affected', async () => {
      const emptyPreview: AutoDistributePreview = {
        ...mockPreview,
        proposed_schedules: [],
        failed_agents: [],
      };

      const onPreview = vi.fn().mockResolvedValue(emptyPreview);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(screen.getByText('Agents Affected:')).toBeInTheDocument();
          const zeroElements = screen.getAllByText('0');
          expect(zeroElements.length).toBeGreaterThan(0);
        },
        { timeout: 1000 }
      );
    });

    it('should handle very high variance values', async () => {
      const highVariancePreview: AutoDistributePreview = {
        ...mockPreview,
        coverage_stats: {
          ...mockPreview.coverage_stats,
          variance: 999.99,
        },
      };

      const onPreview = vi.fn().mockResolvedValue(highVariancePreview);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(screen.getByText('999.99')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should handle multiple failed agents', async () => {
      const multipleFailures: AutoDistributePreview = {
        ...mockPreview,
        failed_agents: [
          { user_id: 'user-1', name: 'Agent 1', reason: 'Reason 1' },
          { user_id: 'user-2', name: 'Agent 2', reason: 'Reason 2' },
          { user_id: 'user-3', name: 'Agent 3', reason: 'Reason 3' },
        ],
      };

      const onPreview = vi.fn().mockResolvedValue(multipleFailures);
      render(<AutoDistributeModal {...defaultProps} onPreview={onPreview} />);

      await waitFor(
        () => {
          expect(screen.getByText(/Failed Agents \(3\):/)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });
});
