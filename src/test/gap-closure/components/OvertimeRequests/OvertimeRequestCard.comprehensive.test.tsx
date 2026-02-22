import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OvertimeRequestCard } from '../../../../components/OvertimeRequests/OvertimeRequestCard';
import type { OvertimeRequest } from '../../../../types/overtime';

/**
 * Comprehensive tests for OvertimeRequestCard component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.4, CR-2.1.4, PR-4.3.2
 */
describe('OvertimeRequestCard Component', () => {
  const baseRequest: OvertimeRequest = {
    id: 'req-1',
    requester_id: 'user-1',
    requester: {
      id: 'user-1',
      name: 'John Doe',
      department: 'Support',
      employee_id: 'EMP001',
    },
    request_date: '2024-01-15',
    start_time: '17:00:00',
    end_time: '20:00:00',
    total_hours: 3,
    overtime_type: 'regular',
    reason: 'Emergency customer support needed for critical issue',
    status: 'pending_tl',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render overtime request card', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should render work date', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should render overtime type badge', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText('Regular (1.5x)')).toBeInTheDocument();
    });

    it('should render time range', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText(/5:00 PM - 8:00 PM/)).toBeInTheDocument();
    });

    it('should render total hours', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText('3.00 hrs')).toBeInTheDocument();
    });

    it('should render reason', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText(/Emergency customer support/)).toBeInTheDocument();
    });

    it('should render status badge', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText('Pending TL')).toBeInTheDocument();
    });
  });

  describe('Overtime Type Display', () => {
    it('should display Regular (1.5x) for regular type', () => {
      const request = { ...baseRequest, overtime_type: 'regular' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Regular (1.5x)')).toBeInTheDocument();
    });

    it('should display Double (2.0x) for double type', () => {
      const request = { ...baseRequest, overtime_type: 'double' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Double (2.0x)')).toBeInTheDocument();
    });

    it('should apply blue styling for regular type', () => {
      const request = { ...baseRequest, overtime_type: 'regular' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Regular (1.5x)');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should apply purple styling for double type', () => {
      const request = { ...baseRequest, overtime_type: 'double' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Double (2.0x)');
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });
  });

  describe('Status Display', () => {
    it('should display Pending TL for pending_tl status', () => {
      const request = { ...baseRequest, status: 'pending_tl' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Pending TL')).toBeInTheDocument();
    });

    it('should display Pending WFM for pending_wfm status', () => {
      const request = { ...baseRequest, status: 'pending_wfm' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Pending WFM')).toBeInTheDocument();
    });

    it('should display Approved for approved status', () => {
      const request = { ...baseRequest, status: 'approved' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('should display Rejected for rejected status', () => {
      const request = { ...baseRequest, status: 'rejected' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should display Cancelled for cancelled status', () => {
      const request = { ...baseRequest, status: 'cancelled' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply yellow styling for pending_tl status', () => {
      const request = { ...baseRequest, status: 'pending_tl' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Pending TL');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply yellow styling for pending_wfm status', () => {
      const request = { ...baseRequest, status: 'pending_wfm' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Pending WFM');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply green styling for approved status', () => {
      const request = { ...baseRequest, status: 'approved' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Approved');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply red styling for rejected status', () => {
      const request = { ...baseRequest, status: 'rejected' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Rejected');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should apply gray styling for cancelled status', () => {
      const request = { ...baseRequest, status: 'cancelled' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const badge = screen.getByText('Cancelled');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Date Formatting', () => {
    it('should format date as MMM DD, YYYY', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should handle different months', () => {
      const request = { ...baseRequest, request_date: '2024-12-25' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument();
    });

    it('should handle different years', () => {
      const request = { ...baseRequest, request_date: '2025-03-10' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Mar 10, 2025')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should format morning time correctly', () => {
      const request = { ...baseRequest, start_time: '08:30:00', end_time: '11:45:00' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/8:30 AM - 11:45 AM/)).toBeInTheDocument();
    });

    it('should format afternoon time correctly', () => {
      const request = { ...baseRequest, start_time: '13:00:00', end_time: '17:30:00' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/1:00 PM - 5:30 PM/)).toBeInTheDocument();
    });

    it('should format midnight correctly', () => {
      const request = { ...baseRequest, start_time: '00:00:00', end_time: '03:00:00' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/12:00 AM - 3:00 AM/)).toBeInTheDocument();
    });

    it('should format noon correctly', () => {
      const request = { ...baseRequest, start_time: '12:00:00', end_time: '15:00:00' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/12:00 PM - 3:00 PM/)).toBeInTheDocument();
    });
  });

  describe('Hours Display', () => {
    it('should display hours with 2 decimal places', () => {
      const request = { ...baseRequest, total_hours: 3.5 };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('3.50 hrs')).toBeInTheDocument();
    });

    it('should handle whole number hours', () => {
      const request = { ...baseRequest, total_hours: 5 };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('5.00 hrs')).toBeInTheDocument();
    });

    it('should handle fractional hours', () => {
      const request = { ...baseRequest, total_hours: 2.75 };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('2.75 hrs')).toBeInTheDocument();
    });
  });

  describe('Reason Truncation', () => {
    it('should display full reason when under 100 characters', () => {
      const request = { ...baseRequest, reason: 'Short reason' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Short reason')).toBeInTheDocument();
    });

    it('should truncate reason when over 100 characters', () => {
      const longReason =
        'This is a very long reason that exceeds one hundred characters and should be truncated with ellipsis at the end to fit properly';
      const request = { ...baseRequest, reason: longReason };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/This is a very long reason.*\.\.\./)).toBeInTheDocument();
    });

    it('should truncate at exactly 100 characters', () => {
      const longReason = 'a'.repeat(150);
      const request = { ...baseRequest, reason: longReason };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      const displayedText = screen.getByText(/a+\.\.\./);
      expect(displayedText.textContent?.length).toBeLessThanOrEqual(103); // 100 + '...'
    });
  });

  describe('Approval Information', () => {
    it('should show approval info for approved requests', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        wfm_reviewed_by: 'wfm-1',
      };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/Approved by/)).toBeInTheDocument();
    });

    it('should show WFM rejection info', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        wfm_reviewed_by: 'wfm-1',
      };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Rejected by WFM')).toBeInTheDocument();
    });

    it('should show TL rejection info when WFM not involved', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        tl_reviewed_by: 'tl-1',
      };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Rejected by TL')).toBeInTheDocument();
    });

    it('should not show approval info for pending requests', () => {
      const request = { ...baseRequest, status: 'pending_tl' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.queryByText(/Approved by/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Rejected by/)).not.toBeInTheDocument();
    });

    it('should not show approval info for cancelled requests', () => {
      const request = { ...baseRequest, status: 'cancelled' as const };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.queryByText(/Approved by/)).not.toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Enter key is pressed', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Space key is pressed', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick for other keys', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      fireEvent.click(card);
      fireEvent.click(card);
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have role button', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have tabIndex 0', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have descriptive aria-label', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'View overtime request for Jan 15, 2024');
    });

    it('should have aria-label for overtime type', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const badge = screen.getByLabelText(/Overtime type:/);
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label for status', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const badge = screen.getByLabelText(/Request status:/);
      expect(badge).toBeInTheDocument();
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(
        <OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />
      );
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Layout and Styling', () => {
    it('should have cursor pointer', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have hover shadow effect', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('should have rounded corners', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('rounded-lg');
    });

    it('should have white background', () => {
      render(<OvertimeRequestCard request={baseRequest} onClick={mockOnClick} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('bg-white');
    });
  });

  describe('Edge Cases', () => {
    it('should handle request without requester info', () => {
      const request = { ...baseRequest, requester: undefined };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should handle very small hours', () => {
      const request = { ...baseRequest, total_hours: 0.25 };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('0.25 hrs')).toBeInTheDocument();
    });

    it('should handle very large hours', () => {
      const request = { ...baseRequest, total_hours: 12.5 };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText('12.50 hrs')).toBeInTheDocument();
    });

    it('should handle empty reason', () => {
      const request = { ...baseRequest, reason: '' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle special characters in reason', () => {
      const request = { ...baseRequest, reason: 'Emergency: <urgent> & "critical"' };
      render(<OvertimeRequestCard request={request} onClick={mockOnClick} />);
      expect(screen.getByText(/Emergency:/)).toBeInTheDocument();
    });
  });
});
