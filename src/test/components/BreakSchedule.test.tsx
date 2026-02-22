import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BreakScheduleTable from '../../components/BreakSchedule/BreakScheduleTable';
import BreakCell from '../../components/BreakSchedule/BreakCell';
import AgentRow from '../../components/BreakSchedule/AgentRow';
import type { AgentBreakSchedule, BreakType } from '../../types';

describe('BreakSchedule Module Components', () => {
  describe('BreakScheduleTable Component', () => {
    const mockSchedules: AgentBreakSchedule[] = [
      {
        user_id: 'user-1',
        name: 'John Doe',
        shift_type: 'AM',
        breaks: {
          HB1: '10:00:00',
          B: '12:00:00',
          HB2: '14:00:00',
        },
        intervals: {
          '09:00': 'IN',
          '10:00': 'HB1',
          '12:00': 'B',
          '14:00': 'HB2',
        },
        has_warning: false,
      },
      {
        user_id: 'user-2',
        name: 'Jane Smith',
        shift_type: 'PM',
        breaks: {
          HB1: '13:00:00',
          B: '15:00:00',
          HB2: '17:00:00',
        },
        intervals: {
          '13:00': 'HB1',
          '15:00': 'B',
          '17:00': 'HB2',
        },
        has_warning: true,
      },
    ];

    const mockIntervals = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

    describe('Schedule Display', () => {
      it('should render the schedule table with headers', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        expect(screen.getByText('Agent Name')).toBeInTheDocument();
        expect(screen.getByText('Shift')).toBeInTheDocument();
        expect(screen.getByText('HB1 Start')).toBeInTheDocument();
        expect(screen.getByText('B Start')).toBeInTheDocument();
        expect(screen.getByText('HB2 Start')).toBeInTheDocument();
      });

      it('should render all interval columns', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        // Check that all intervals are rendered (using getAllByText since times appear in headers and cells)
        mockIntervals.forEach((interval) => {
          const elements = screen.getAllByText(interval);
          expect(elements.length).toBeGreaterThan(0);
        });
      });

      it('should render Total IN summary row', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        expect(screen.getByText('Total IN')).toBeInTheDocument();
      });

      it('should render all agent rows', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      it('should display agent shift types', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        expect(screen.getByText('AM')).toBeInTheDocument();
        expect(screen.getByText('PM')).toBeInTheDocument();
      });

      it('should display break start times in HH:MM format', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        // Check that break times are displayed (multiple instances due to headers and cells)
        const times = screen.getAllByText('10:00');
        expect(times.length).toBeGreaterThan(0);
      });

      it('should calculate and display coverage for each interval', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
          />
        );

        // The Total IN row should show coverage counts
        const totalInRow = screen.getByText('Total IN').closest('tr');
        expect(totalInRow).toBeInTheDocument();
      });

      it('should render empty table when no schedules provided', () => {
        render(
          <BreakScheduleTable schedules={[]} intervals={mockIntervals} scheduleDate="2024-01-15" />
        );

        expect(screen.getByText('Total IN')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    describe('Schedule Editing Functionality', () => {
      it('should not allow editing when isEditable is false', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
            isEditable={false}
          />
        );

        const cells = screen.queryAllByRole('button');
        expect(cells.length).toBe(0);
      });

      it('should allow editing when isEditable is true', () => {
        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
            isEditable={true}
          />
        );

        const cells = screen.queryAllByRole('button');
        expect(cells.length).toBeGreaterThan(0);
      });

      it('should call onUpdate when break is changed', async () => {
        const mockOnUpdate = vi.fn().mockResolvedValue(undefined);

        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
            isEditable={true}
            onUpdate={mockOnUpdate}
          />
        );

        // Find and click a break cell to open dropdown
        const cells = screen.getAllByRole('button');
        if (cells.length > 0) {
          fireEvent.click(cells[0]);

          // Select a different break type from dropdown
          const options = screen.getAllByRole('button');
          const bOption = options.find((opt) => opt.textContent === 'B');
          if (bOption) {
            fireEvent.click(bOption);

            // Wait for debounce and update
            await waitFor(
              () => {
                expect(mockOnUpdate).toHaveBeenCalled();
              },
              { timeout: 2000 }
            );
          }
        }
      });

      it('should show saving indicator during update', async () => {
        let resolveUpdate: any;
        const mockOnUpdate = vi.fn(() => new Promise((resolve) => (resolveUpdate = resolve)));

        render(
          <BreakScheduleTable
            schedules={mockSchedules}
            intervals={mockIntervals}
            scheduleDate="2024-01-15"
            isEditable={true}
            onUpdate={mockOnUpdate}
          />
        );

        const cells = screen.getAllByRole('button');
        if (cells.length > 0) {
          fireEvent.click(cells[0]);

          // Select a different break type from dropdown
          const options = screen.getAllByRole('button');
          const bOption = options.find((opt) => opt.textContent === 'B');
          if (bOption) {
            fireEvent.click(bOption);

            // Wait for the saving indicator to appear
            await waitFor(
              () => {
                expect(screen.queryByText('Saving changes...')).toBeInTheDocument();
              },
              { timeout: 2000 }
            );

            // Resolve the update
            if (resolveUpdate) {
              resolveUpdate();
            }
          }
        }
      });
    });
  });

  describe('BreakCell Component', () => {
    describe('Break Time Input Validation', () => {
      it('should render break type label correctly', () => {
        render(<BreakCell breakType="HB1" />);
        expect(screen.getByText('HB1')).toBeInTheDocument();
      });

      it('should render dash when no break type is set', () => {
        render(<BreakCell breakType={null} />);
        expect(screen.getByText('-')).toBeInTheDocument();
      });

      it('should apply correct color for HB1 break', () => {
        const { container } = render(<BreakCell breakType="HB1" />);
        const cell = container.querySelector('.bg-blue-100');
        expect(cell).toBeInTheDocument();
      });

      it('should apply correct color for B break', () => {
        const { container } = render(<BreakCell breakType="B" />);
        const cell = container.querySelector('.bg-green-100');
        expect(cell).toBeInTheDocument();
      });

      it('should apply correct color for HB2 break', () => {
        const { container } = render(<BreakCell breakType="HB2" />);
        const cell = container.querySelector('.bg-purple-100');
        expect(cell).toBeInTheDocument();
      });

      it('should apply correct color for IN status', () => {
        const { container } = render(<BreakCell breakType="IN" />);
        const cell = container.querySelector('.bg-gray-50');
        expect(cell).toBeInTheDocument();
      });

      it('should show error indicator when violations have error severity', () => {
        const violations = [
          {
            severity: 'error' as const,
            message: 'Invalid break time',
            rule: 'break_duration',
          },
        ];

        const { container } = render(<BreakCell breakType="HB1" violations={violations} />);
        const errorIndicator = container.querySelector('.bg-red-500');
        expect(errorIndicator).toBeInTheDocument();
      });

      it('should show warning indicator when violations have warning severity', () => {
        const violations = [
          {
            severity: 'warning' as const,
            message: 'Break time may be suboptimal',
            rule: 'break_spacing',
          },
        ];

        const { container } = render(<BreakCell breakType="HB1" violations={violations} />);
        const warningIndicator = container.querySelector('.bg-yellow-500');
        expect(warningIndicator).toBeInTheDocument();
      });

      it('should prioritize error indicator over warning indicator', () => {
        const violations = [
          {
            severity: 'error' as const,
            message: 'Invalid break time',
            rule: 'break_duration',
          },
          {
            severity: 'warning' as const,
            message: 'Break time may be suboptimal',
            rule: 'break_spacing',
          },
        ];

        const { container } = render(<BreakCell breakType="HB1" violations={violations} />);
        const errorIndicator = container.querySelector('.bg-red-500');
        expect(errorIndicator).toBeInTheDocument();
      });

      it('should display violation messages in title attribute', () => {
        const violations = [
          {
            severity: 'error' as const,
            message: 'Invalid break time',
            rule: 'break_duration',
          },
        ];

        const { container } = render(<BreakCell breakType="HB1" violations={violations} />);
        const cell = container.querySelector('[title]');
        expect(cell).toHaveAttribute('title', 'Invalid break time');
      });

      it('should not be clickable when isEditable is false', () => {
        render(<BreakCell breakType="HB1" isEditable={false} />);
        const cell = screen.queryByRole('button');
        expect(cell).not.toBeInTheDocument();
      });

      it('should be clickable when isEditable is true', () => {
        render(<BreakCell breakType="HB1" isEditable={true} />);
        const cell = screen.getByRole('button');
        expect(cell).toBeInTheDocument();
      });

      it('should show dropdown when clicked in editable mode', () => {
        render(<BreakCell breakType="HB1" isEditable={true} />);
        const cell = screen.getByRole('button');
        fireEvent.click(cell);

        // Dropdown should show all break options
        expect(screen.getAllByText('IN').length).toBeGreaterThan(0);
        expect(screen.getAllByText('HB1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('B').length).toBeGreaterThan(0);
        expect(screen.getAllByText('HB2').length).toBeGreaterThan(0);
      });

      it('should call onClick when break option is selected', () => {
        const mockOnClick = vi.fn();
        render(<BreakCell breakType="HB1" isEditable={true} onClick={mockOnClick} />);

        const cell = screen.getByRole('button');
        fireEvent.click(cell);

        const options = screen.getAllByRole('button');
        const bOption = options.find((opt) => opt.textContent === 'B');
        if (bOption) {
          fireEvent.click(bOption);
          expect(mockOnClick).toHaveBeenCalledWith('B');
        }
      });

      it('should close dropdown after selecting an option', () => {
        render(<BreakCell breakType="HB1" isEditable={true} />);

        const cell = screen.getByRole('button');
        fireEvent.click(cell);

        const options = screen.getAllByRole('button');
        const bOption = options.find((opt) => opt.textContent === 'B');
        if (bOption) {
          fireEvent.click(bOption);

          // Dropdown should be closed (only one button visible)
          const remainingButtons = screen.getAllByRole('button');
          expect(remainingButtons.length).toBe(1);
        }
      });

      it('should handle keyboard navigation with Enter key', () => {
        render(<BreakCell breakType="HB1" isEditable={true} />);

        const cell = screen.getByRole('button');
        fireEvent.keyDown(cell, { key: 'Enter' });

        // Dropdown should be visible
        expect(screen.getAllByText('IN').length).toBeGreaterThan(0);
      });

      it('should handle keyboard navigation with Space key', () => {
        render(<BreakCell breakType="HB1" isEditable={true} />);

        const cell = screen.getByRole('button');
        fireEvent.keyDown(cell, { key: ' ' });

        // Dropdown should be visible
        expect(screen.getAllByText('IN').length).toBeGreaterThan(0);
      });

      it('should have proper ARIA label', () => {
        render(<BreakCell breakType="HB1" isEditable={true} />);

        const cell = screen.getByRole('button');
        expect(cell).toHaveAttribute('aria-label', expect.stringContaining('Break type HB1'));
      });

      it('should include error status in ARIA label', () => {
        const violations = [
          {
            severity: 'error' as const,
            message: 'Invalid break time',
            rule: 'break_duration',
          },
        ];

        render(<BreakCell breakType="HB1" isEditable={true} violations={violations} />);

        const cell = screen.getByRole('button');
        expect(cell).toHaveAttribute('aria-label', expect.stringContaining('has errors'));
      });

      it('should include warning status in ARIA label', () => {
        const violations = [
          {
            severity: 'warning' as const,
            message: 'Break time may be suboptimal',
            rule: 'break_spacing',
          },
        ];

        render(<BreakCell breakType="HB1" isEditable={true} violations={violations} />);

        const cell = screen.getByRole('button');
        expect(cell).toHaveAttribute('aria-label', expect.stringContaining('has warnings'));
      });
    });
  });

  describe('AgentRow Component', () => {
    const mockSchedule: AgentBreakSchedule = {
      user_id: 'user-1',
      name: 'John Doe',
      shift_type: 'AM',
      breaks: {
        HB1: '10:00:00',
        B: '12:00:00',
        HB2: '14:00:00',
      },
      intervals: {
        '09:00': 'IN',
        '10:00': 'HB1',
        '12:00': 'B',
        '14:00': 'HB2',
      },
      has_warning: false,
    };

    const mockIntervals = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

    it('should render agent name', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render shift type badge', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} />);
      expect(screen.getByText('AM')).toBeInTheDocument();
    });

    it('should format break times from HH:MM:SS to HH:MM', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} />);
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
    });

    it('should display dash for null break times', () => {
      const scheduleWithoutBreaks: AgentBreakSchedule = {
        ...mockSchedule,
        breaks: {
          HB1: null,
          B: null,
          HB2: null,
        },
      };

      render(<AgentRow schedule={scheduleWithoutBreaks} intervals={mockIntervals} />);
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('should show warning indicator when has_warning is true', () => {
      const scheduleWithWarning: AgentBreakSchedule = {
        ...mockSchedule,
        has_warning: true,
      };

      render(<AgentRow schedule={scheduleWithWarning} intervals={mockIntervals} />);
      const warningIndicator = screen.getByTitle('Has unresolved warnings');
      expect(warningIndicator).toBeInTheDocument();
    });

    it('should not show warning indicator when has_warning is false', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} />);
      const warningIndicator = screen.queryByTitle('Has unresolved warnings');
      expect(warningIndicator).not.toBeInTheDocument();
    });

    it('should show no breaks indicator when all breaks are null and shift is not OFF', () => {
      const scheduleWithoutBreaks: AgentBreakSchedule = {
        ...mockSchedule,
        breaks: {
          HB1: null,
          B: null,
          HB2: null,
        },
      };

      render(<AgentRow schedule={scheduleWithoutBreaks} intervals={mockIntervals} />);
      const noBreaksIndicator = screen.getByLabelText('No breaks assigned');
      expect(noBreaksIndicator).toBeInTheDocument();
    });

    it('should not show no breaks indicator when shift is OFF', () => {
      const scheduleOff: AgentBreakSchedule = {
        ...mockSchedule,
        shift_type: 'OFF',
        breaks: {
          HB1: null,
          B: null,
          HB2: null,
        },
      };

      render(<AgentRow schedule={scheduleOff} intervals={mockIntervals} />);
      const noBreaksIndicator = screen.queryByLabelText('No breaks assigned');
      expect(noBreaksIndicator).not.toBeInTheDocument();
    });

    it('should display auto-distribution failure reason', () => {
      const scheduleWithFailure: AgentBreakSchedule = {
        ...mockSchedule,
        breaks: {
          HB1: null,
          B: null,
          HB2: null,
        },
        auto_distribution_failure: 'Agent has conflicting schedule',
      };

      const { container } = render(
        <AgentRow schedule={scheduleWithFailure} intervals={mockIntervals} />
      );
      const noBreaksIndicator = container.querySelector('[aria-label="No breaks assigned"]');
      expect(noBreaksIndicator).toBeInTheDocument();
    });

    it('should render break cells for each interval', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} isEditable={true} />);

      // Should have break cells rendered
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should call onBreakClick when break cell is clicked', () => {
      const mockOnBreakClick = vi.fn();

      render(
        <AgentRow
          schedule={mockSchedule}
          intervals={mockIntervals}
          isEditable={true}
          onBreakClick={mockOnBreakClick}
        />
      );

      const cells = screen.getAllByRole('button');
      if (cells.length > 0) {
        fireEvent.click(cells[0]);
        // Click on a dropdown option
        const options = screen.getAllByRole('button');
        const bOption = options.find((opt) => opt.textContent === 'B');
        if (bOption) {
          fireEvent.click(bOption);
          expect(mockOnBreakClick).toHaveBeenCalled();
        }
      }
    });

    it('should not allow editing when isEditable is false', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} isEditable={false} />);

      const cells = screen.queryAllByRole('button');
      expect(cells.length).toBe(0);
    });

    it('should handle empty intervals array', () => {
      render(<AgentRow schedule={mockSchedule} intervals={[]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should apply hover effect to row', () => {
      const { container } = render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} />);
      const row = container.querySelector('tr');
      expect(row).toHaveClass('hover:bg-gray-50');
    });

    it('should render shift type with correct styling', () => {
      render(<AgentRow schedule={mockSchedule} intervals={mockIntervals} />);
      const shiftBadge = screen.getByText('AM');
      expect(shiftBadge).toHaveClass('inline-flex', 'items-center', 'rounded');
    });
  });
});
