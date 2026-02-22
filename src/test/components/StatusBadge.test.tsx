import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/StatusBadge';
import type { SwapRequestStatus, LeaveRequestStatus } from '../../types';

describe('StatusBadge Component', () => {
  describe('Swap Request Statuses', () => {
    it('should render pending_acceptance status with correct label and color', () => {
      const status: SwapRequestStatus = 'pending_acceptance';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Pending Recipient');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });

    it('should render pending_tl status with correct label and color', () => {
      const status: SwapRequestStatus = 'pending_tl';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Pending TL');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('should render pending_wfm status with correct label and color', () => {
      const status: SwapRequestStatus = 'pending_wfm';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Pending WFM');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('should render approved status with correct label and color', () => {
      const status: SwapRequestStatus = 'approved';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Approved');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should render rejected status with correct label and color', () => {
      const status: SwapRequestStatus = 'rejected';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Rejected');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });
  });

  describe('Leave Request Statuses', () => {
    it('should render leave pending_tl status with correct label and color', () => {
      const status: LeaveRequestStatus = 'pending_tl';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Pending TL');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('should render leave pending_wfm status with correct label and color', () => {
      const status: LeaveRequestStatus = 'pending_wfm';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Pending WFM');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('should render leave approved status with correct label and color', () => {
      const status: LeaveRequestStatus = 'approved';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Approved');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should render leave rejected status with correct label and color', () => {
      const status: LeaveRequestStatus = 'rejected';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Rejected');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('should render denied status with correct label and color', () => {
      const status: LeaveRequestStatus = 'denied';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Denied');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for pending_acceptance status', () => {
      const status: SwapRequestStatus = 'pending_acceptance';
      render(<StatusBadge status={status} />);

      const badge = screen.getByLabelText('Request status: Pending Recipient');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label for approved status', () => {
      const status: SwapRequestStatus = 'approved';
      render(<StatusBadge status={status} />);

      const badge = screen.getByLabelText('Request status: Approved');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label for rejected status', () => {
      const status: SwapRequestStatus = 'rejected';
      render(<StatusBadge status={status} />);

      const badge = screen.getByLabelText('Request status: Rejected');
      expect(badge).toBeInTheDocument();
    });

    it('should have aria-label for denied status', () => {
      const status: LeaveRequestStatus = 'denied';
      render(<StatusBadge status={status} />);

      const badge = screen.getByLabelText('Request status: Denied');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const status: SwapRequestStatus = 'approved';
      render(<StatusBadge status={status} className="custom-class" />);

      const badge = screen.getByText('Approved');
      expect(badge).toHaveClass('custom-class');
    });

    it('should maintain base classes with custom className', () => {
      const status: SwapRequestStatus = 'pending_tl';
      render(<StatusBadge status={status} className="ml-2" />);

      const badge = screen.getByText('Pending TL');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'ml-2');
    });
  });

  describe('Badge Structure', () => {
    it('should render as a span element', () => {
      const status: SwapRequestStatus = 'approved';
      const { container } = render(<StatusBadge status={status} />);

      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
    });

    it('should have correct base styling classes', () => {
      const status: SwapRequestStatus = 'approved';
      render(<StatusBadge status={status} />);

      const badge = screen.getByText('Approved');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-medium'
      );
    });
  });
});
