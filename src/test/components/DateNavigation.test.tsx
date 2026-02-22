import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateNavigation from '../../components/BreakSchedule/DateNavigation';

describe('DateNavigation Component', () => {
  const mockOnDateChange = vi.fn();
  const testDate = new Date('2024-02-15');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render current date in formatted form', () => {
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      expect(screen.getByText('Thursday, February 15, 2024')).toBeInTheDocument();
    });

    it('should render previous day button', () => {
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      const prevButton = screen.getByLabelText('Previous day');
      expect(prevButton).toBeInTheDocument();
    });

    it('should render next day button', () => {
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      const nextButton = screen.getByLabelText('Next day');
      expect(nextButton).toBeInTheDocument();
    });

    it('should not render Today button when viewing today', () => {
      const today = new Date();
      render(<DateNavigation currentDate={today} onDateChange={mockOnDateChange} />);

      expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });

    it('should render Today button when viewing a different day', () => {
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  describe('Date navigation - Previous day', () => {
    it('should call onDateChange with previous day when clicking previous button', async () => {
      const user = userEvent.setup();
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      const prevButton = screen.getByLabelText('Previous day');
      await user.click(prevButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.toISOString()).toBe(new Date('2024-02-14').toISOString());
    });

    it('should handle month boundary when going to previous day', async () => {
      const user = userEvent.setup();
      const firstDayOfMonth = new Date('2024-02-01');
      render(<DateNavigation currentDate={firstDayOfMonth} onDateChange={mockOnDateChange} />);

      const prevButton = screen.getByLabelText('Previous day');
      await user.click(prevButton);

      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getMonth()).toBe(0); // January (0-indexed)
      expect(calledDate.getDate()).toBe(31);
    });

    it('should handle year boundary when going to previous day', async () => {
      const user = userEvent.setup();
      const firstDayOfYear = new Date('2024-01-01');
      render(<DateNavigation currentDate={firstDayOfYear} onDateChange={mockOnDateChange} />);

      const prevButton = screen.getByLabelText('Previous day');
      await user.click(prevButton);

      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getFullYear()).toBe(2023);
      expect(calledDate.getMonth()).toBe(11); // December
      expect(calledDate.getDate()).toBe(31);
    });
  });

  describe('Date navigation - Next day', () => {
    it('should call onDateChange with next day when clicking next button', async () => {
      const user = userEvent.setup();
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      const nextButton = screen.getByLabelText('Next day');
      await user.click(nextButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.toISOString()).toBe(new Date('2024-02-16').toISOString());
    });

    it('should handle month boundary when going to next day', async () => {
      const user = userEvent.setup();
      const lastDayOfMonth = new Date('2024-02-29'); // Leap year
      render(<DateNavigation currentDate={lastDayOfMonth} onDateChange={mockOnDateChange} />);

      const nextButton = screen.getByLabelText('Next day');
      await user.click(nextButton);

      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getMonth()).toBe(2); // March (0-indexed)
      expect(calledDate.getDate()).toBe(1);
    });

    it('should handle year boundary when going to next day', async () => {
      const user = userEvent.setup();
      const lastDayOfYear = new Date('2024-12-31');
      render(<DateNavigation currentDate={lastDayOfYear} onDateChange={mockOnDateChange} />);

      const nextButton = screen.getByLabelText('Next day');
      await user.click(nextButton);

      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getFullYear()).toBe(2025);
      expect(calledDate.getMonth()).toBe(0); // January
      expect(calledDate.getDate()).toBe(1);
    });
  });

  describe('Date navigation - Today button', () => {
    it('should call onDateChange with current date when clicking Today button', async () => {
      const user = userEvent.setup();
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      const todayButton = screen.getByText('Today');
      await user.click(todayButton);

      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnDateChange.mock.calls[0][0];

      // Should be today's date
      const today = new Date();
      expect(calledDate.getDate()).toBe(today.getDate());
      expect(calledDate.getMonth()).toBe(today.getMonth());
      expect(calledDate.getFullYear()).toBe(today.getFullYear());
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      expect(screen.getByLabelText('Previous day')).toBeInTheDocument();
      expect(screen.getByLabelText('Next day')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      // Tab to previous button and press Enter
      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockOnDateChange).toHaveBeenCalled();
    });
  });

  describe('Visual feedback', () => {
    it('should render navigation arrows', () => {
      render(<DateNavigation currentDate={testDate} onDateChange={mockOnDateChange} />);

      const prevButton = screen.getByLabelText('Previous day');
      const nextButton = screen.getByLabelText('Next day');

      // Check that SVG icons are present
      expect(prevButton.querySelector('svg')).toBeInTheDocument();
      expect(nextButton.querySelector('svg')).toBeInTheDocument();
    });
  });
});
