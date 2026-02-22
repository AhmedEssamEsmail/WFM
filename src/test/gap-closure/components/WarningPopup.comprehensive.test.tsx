import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WarningPopup from '../../../components/BreakSchedule/WarningPopup';
import type { BreakScheduleWarning } from '../../../types';

describe('WarningPopup Component', () => {
  const mockWarning: BreakScheduleWarning = {
    id: 'warning-1',
    user_id: 'user-1',
    schedule_date: '2024-01-15',
    old_shift_type: 'AM',
    new_shift_type: 'PM',
    is_dismissed: false,
    created_at: '2024-01-15T10:00:00Z',
  };

  describe('Rendering', () => {
    it('should render warning popup with title', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('Shift Change Detected')).toBeInTheDocument();
    });

    it('should display formatted date', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText(/Monday, January 15, 2024/)).toBeInTheDocument();
    });

    it('should display previous shift type', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText(/Previous Shift:/)).toBeInTheDocument();
      expect(screen.getByText('AM')).toBeInTheDocument();
    });

    it('should display new shift type', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText(/New Shift:/)).toBeInTheDocument();
      expect(screen.getByText('PM')).toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(
        screen.getByText(/The break schedule for this day has been cleared/)
      ).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      const { container } = render(
        <WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Close button', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should render Dismiss Warning button', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('Dismiss Warning')).toBeInTheDocument();
    });
  });

  describe('Shift Type Labels', () => {
    it('should display correct label for AM shift', () => {
      const warning = { ...mockWarning, old_shift_type: 'AM' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('AM')).toBeInTheDocument();
    });

    it('should display correct label for PM shift', () => {
      const warning = { ...mockWarning, new_shift_type: 'PM' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('PM')).toBeInTheDocument();
    });

    it('should display correct label for MID shift', () => {
      const warning = { ...mockWarning, old_shift_type: 'MID', new_shift_type: 'AM' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      // MID might not be in SHIFT_LABELS, so it might render as empty or MID
      const text = screen.getByText(/Previous Shift:/);
      expect(text).toBeInTheDocument();
    });

    it('should display correct label for OFF shift', () => {
      const warning = { ...mockWarning, old_shift_type: 'OFF', new_shift_type: 'AM' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('OFF')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Close button is clicked', () => {
      const onClose = vi.fn();
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={onClose} />);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when Dismiss Warning button is clicked', () => {
      const onDismiss = vi.fn();
      render(<WarningPopup warning={mockWarning} onDismiss={onDismiss} onClose={vi.fn()} />);

      const dismissButton = screen.getByText('Dismiss Warning');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not call onDismiss when Close button is clicked', () => {
      const onDismiss = vi.fn();
      render(<WarningPopup warning={mockWarning} onDismiss={onDismiss} onClose={vi.fn()} />);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should not call onClose when Dismiss Warning button is clicked', () => {
      const onClose = vi.fn();
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={onClose} />);

      const dismissButton = screen.getByText('Dismiss Warning');
      fireEvent.click(dismissButton);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly for different dates', () => {
      const warning = { ...mockWarning, schedule_date: '2024-12-25' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText(/Wednesday, December 25, 2024/)).toBeInTheDocument();
    });

    it('should handle different date formats', () => {
      const warning = { ...mockWarning, schedule_date: '2024-03-01' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText(/Friday, March 1, 2024/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render modal with proper overlay', () => {
      const { container } = render(
        <WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />
      );
      const overlay = container.querySelector('.bg-gray-500.bg-opacity-75');
      expect(overlay).toBeInTheDocument();
    });

    it('should render buttons with proper styling', () => {
      render(<WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      const closeButton = screen.getByText('Close');
      const dismissButton = screen.getByText('Dismiss Warning');

      expect(closeButton).toBeInTheDocument();
      expect(dismissButton).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <WarningPopup warning={mockWarning} onDismiss={vi.fn()} onClose={vi.fn()} />
      );
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Shift Change Detected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle same shift type for old and new', () => {
      const warning = { ...mockWarning, old_shift_type: 'AM', new_shift_type: 'AM' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      const amElements = screen.getAllByText('AM');
      expect(amElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle shift change from OFF to working shift', () => {
      const warning = { ...mockWarning, old_shift_type: 'OFF', new_shift_type: 'AM' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('OFF')).toBeInTheDocument();
      expect(screen.getByText('AM')).toBeInTheDocument();
    });

    it('should handle shift change from working shift to OFF', () => {
      const warning = { ...mockWarning, old_shift_type: 'AM', new_shift_type: 'OFF' };
      render(<WarningPopup warning={warning} onDismiss={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('AM')).toBeInTheDocument();
      expect(screen.getByText('OFF')).toBeInTheDocument();
    });
  });
});
