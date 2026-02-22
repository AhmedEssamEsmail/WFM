import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ValidationBanner from '../../../components/BreakSchedule/ValidationBanner';
import type { ValidationViolation } from '../../../types';

describe('ValidationBanner Component', () => {
  describe('Rendering', () => {
    it('should not render when violations array is empty', () => {
      const { container } = render(<ValidationBanner violations={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render error banner when errors exist', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Break time violates minimum duration',
          rule_name: 'min_break_duration',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('1 Blocking Error')).toBeInTheDocument();
    });

    it('should render warning banner when warnings exist', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Break spacing may be suboptimal',
          rule_name: 'break_spacing',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
    });

    it('should render both error and warning banners when both exist', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Break time violates minimum duration',
          rule_name: 'min_break_duration',
        },
        {
          severity: 'warning',
          message: 'Break spacing may be suboptimal',
          rule_name: 'break_spacing',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('1 Blocking Error')).toBeInTheDocument();
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
    });

    it('should pluralize error count correctly', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error 1',
          rule_name: 'rule1',
        },
        {
          severity: 'error',
          message: 'Error 2',
          rule_name: 'rule2',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('2 Blocking Errors')).toBeInTheDocument();
    });

    it('should pluralize warning count correctly', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning 1',
          rule_name: 'rule1',
        },
        {
          severity: 'warning',
          message: 'Warning 2',
          rule_name: 'rule2',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('2 Warnings')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error rule name and message', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Break time violates minimum duration',
          rule_name: 'min_break_duration',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText(/min_break_duration:/)).toBeInTheDocument();
      expect(screen.getByText(/Break time violates minimum duration/)).toBeInTheDocument();
    });

    it('should display affected intervals when provided', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Coverage too low',
          rule_name: 'min_coverage',
          affected_intervals: ['10:00', '11:00', '12:00'],
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText(/Intervals: 10:00, 11:00, 12:00/)).toBeInTheDocument();
    });

    it('should display multiple errors', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error 1',
          rule_name: 'rule1',
        },
        {
          severity: 'error',
          message: 'Error 2',
          rule_name: 'rule2',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText(/rule1:/)).toBeInTheDocument();
      expect(screen.getByText(/Error 1/)).toBeInTheDocument();
      expect(screen.getByText(/rule2:/)).toBeInTheDocument();
      expect(screen.getByText(/Error 2/)).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      const { container } = render(<ValidationBanner violations={violations} />);
      const errorIcon = container.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should display blocking message for errors', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('These errors must be fixed before saving.')).toBeInTheDocument();
    });
  });

  describe('Warning Display', () => {
    it('should display warning rule name and message', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Break spacing may be suboptimal',
          rule_name: 'break_spacing',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText(/break_spacing:/)).toBeInTheDocument();
      expect(screen.getByText(/Break spacing may be suboptimal/)).toBeInTheDocument();
    });

    it('should display affected intervals for warnings', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Coverage suboptimal',
          rule_name: 'optimal_coverage',
          affected_intervals: ['14:00', '15:00'],
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText(/Intervals: 14:00, 15:00/)).toBeInTheDocument();
    });

    it('should display multiple warnings', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning 1',
          rule_name: 'rule1',
        },
        {
          severity: 'warning',
          message: 'Warning 2',
          rule_name: 'rule2',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText(/rule1:/)).toBeInTheDocument();
      expect(screen.getByText(/Warning 1/)).toBeInTheDocument();
      expect(screen.getByText(/rule2:/)).toBeInTheDocument();
      expect(screen.getByText(/Warning 2/)).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning',
          rule_name: 'rule',
        },
      ];

      const { container } = render(<ValidationBanner violations={violations} />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when dismiss button is clicked on error banner', () => {
      const onDismiss = vi.fn();
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} onDismiss={onDismiss} />);
      const dismissButton = screen.getByLabelText('Dismiss');
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveAnyway when Save Anyway button is clicked', () => {
      const onSaveAnyway = vi.fn();
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} onSaveAnyway={onSaveAnyway} />);
      const saveButton = screen.getByText('Save Anyway');
      fireEvent.click(saveButton);
      expect(onSaveAnyway).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Cancel button is clicked on warning banner', () => {
      const onDismiss = vi.fn();
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} onDismiss={onDismiss} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not render dismiss button when onDismiss is not provided', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
    });

    it('should not render Save Anyway button when onSaveAnyway is not provided', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.queryByText('Save Anyway')).not.toBeInTheDocument();
    });

    it('should not render Cancel button when onDismiss is not provided', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'warning',
          message: 'Warning',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for dismiss button', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} onDismiss={vi.fn()} />);
      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should render semantic HTML structure', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      const { container } = render(<ValidationBanner violations={violations} />);
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle violations without affected_intervals', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.queryByText(/Intervals:/)).not.toBeInTheDocument();
    });

    it('should handle violations with empty affected_intervals array', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error',
          rule_name: 'rule',
          affected_intervals: [],
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.queryByText(/Intervals:/)).not.toBeInTheDocument();
    });

    it('should handle mixed severity violations', () => {
      const violations: ValidationViolation[] = [
        {
          severity: 'error',
          message: 'Error 1',
          rule_name: 'rule1',
        },
        {
          severity: 'warning',
          message: 'Warning 1',
          rule_name: 'rule2',
        },
        {
          severity: 'error',
          message: 'Error 2',
          rule_name: 'rule3',
        },
        {
          severity: 'warning',
          message: 'Warning 2',
          rule_name: 'rule4',
        },
      ];

      render(<ValidationBanner violations={violations} />);
      expect(screen.getByText('2 Blocking Errors')).toBeInTheDocument();
      expect(screen.getByText('2 Warnings')).toBeInTheDocument();
    });
  });
});
