import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RequestTable,
  type RequestTableRow,
  type RequestAction,
} from '../../components/RequestTable';

describe('RequestTable Component', () => {
  const mockOnRowClick = vi.fn();
  const mockOnAction = vi.fn();

  const mockRequests: RequestTableRow[] = [
    {
      id: '1',
      type: 'swap',
      requester: { id: 'user1', name: 'John Doe' },
      details: '→ Jane Smith',
      status: 'pending_tl',
      actions: ['approve', 'reject'],
    },
    {
      id: '2',
      type: 'leave',
      requester: { id: 'user2', name: 'Alice Johnson' },
      details: 'Jan 15 - Jan 20',
      status: 'approved',
      actions: [],
    },
    {
      id: '3',
      type: 'swap',
      requester: { id: 'user3', name: 'Bob Wilson' },
      details: '→ Charlie Brown',
      status: 'pending_acceptance',
      actions: ['revoke'],
    },
  ];

  beforeEach(() => {
    mockOnRowClick.mockClear();
    mockOnAction.mockClear();
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading is true', () => {
      const { container } = render(
        <RequestTable
          requests={[]}
          onRowClick={mockOnRowClick}
          onAction={mockOnAction}
          loading={true}
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should display "No requests found" when requests array is empty', () => {
      render(<RequestTable requests={[]} onRowClick={mockOnRowClick} onAction={mockOnAction} />);

      expect(screen.getByText('No requests found')).toBeInTheDocument();
    });
  });

  describe('Desktop Table View', () => {
    it('should render table with correct column headers', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      expect(screen.getByLabelText('Requester column')).toBeInTheDocument();
      expect(screen.getByLabelText('Type column')).toBeInTheDocument();
      expect(screen.getByLabelText('Details column')).toBeInTheDocument();
      expect(screen.getByLabelText('Status column')).toBeInTheDocument();
      expect(screen.getByLabelText('Actions column')).toBeInTheDocument();
    });

    it('should display requester name and avatar initials for all requests', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Check names are displayed
      expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Bob Wilson')[0]).toBeInTheDocument();

      // Check initials are displayed (JD, AJ, BW)
      expect(screen.getAllByText('JD')[0]).toBeInTheDocument();
      expect(screen.getAllByText('AJ')[0]).toBeInTheDocument();
      expect(screen.getAllByText('BW')[0]).toBeInTheDocument();
    });

    it('should display type badges for all requests', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Should have 2 swap badges and 1 leave badge
      const swapBadges = screen.getAllByText('Swap');
      const leaveBadges = screen.getAllByText('Leave');

      expect(swapBadges.length).toBeGreaterThanOrEqual(2);
      expect(leaveBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('should display type-specific details', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Swap details
      expect(screen.getAllByText('→ Jane Smith')[0]).toBeInTheDocument();
      expect(screen.getAllByText('→ Charlie Brown')[0]).toBeInTheDocument();

      // Leave details
      expect(screen.getAllByText('Jan 15 - Jan 20')[0]).toBeInTheDocument();
    });

    it('should display status badges for all requests', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Check for status text (badges render these)
      expect(screen.getAllByText('Pending TL')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Approved')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Pending Recipient')[0]).toBeInTheDocument();
    });

    it('should display action buttons based on permissions', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // First request has approve and reject
      const approveButtons = screen.getAllByText('Approve');
      const rejectButtons = screen.getAllByText('Reject');
      const revokeButtons = screen.getAllByText('Revoke');

      expect(approveButtons.length).toBeGreaterThanOrEqual(1);
      expect(rejectButtons.length).toBeGreaterThanOrEqual(1);
      expect(revokeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should call onRowClick when a row is clicked', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const firstRow = screen.getAllByText('John Doe')[0].closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      expect(mockOnRowClick).toHaveBeenCalledWith('1', 'swap');
      expect(mockOnRowClick).toHaveBeenCalledTimes(1);
    });

    it('should call onRowClick when Enter key is pressed on a row', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const firstRow = screen.getAllByText('John Doe')[0].closest('tr');
      if (firstRow) {
        fireEvent.keyDown(firstRow, { key: 'Enter' });
      }

      expect(mockOnRowClick).toHaveBeenCalledWith('1', 'swap');
    });

    it('should call onRowClick when Space key is pressed on a row', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const firstRow = screen.getAllByText('John Doe')[0].closest('tr');
      if (firstRow) {
        fireEvent.keyDown(firstRow, { key: ' ' });
      }

      expect(mockOnRowClick).toHaveBeenCalledWith('1', 'swap');
    });

    it('should call onAction when action button is clicked', async () => {
      mockOnAction.mockResolvedValue(undefined);

      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const approveButton = screen.getAllByText('Approve')[0];
      fireEvent.click(approveButton);

      expect(mockOnAction).toHaveBeenCalledWith('1', 'approve');
    });

    it('should not call onRowClick when action button is clicked', async () => {
      mockOnAction.mockResolvedValue(undefined);

      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const approveButton = screen.getAllByText('Approve')[0];
      fireEvent.click(approveButton);

      expect(mockOnRowClick).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Card View', () => {
    it('should render cards for mobile view', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Mobile cards should exist (even if hidden by CSS)
      const cards = screen
        .getAllByRole('button')
        .filter((el) => el.getAttribute('aria-label')?.includes('View'));

      // Should have at least the number of requests (desktop rows + mobile cards)
      expect(cards.length).toBeGreaterThanOrEqual(mockRequests.length);
    });

    it('should display requester name and initials in mobile cards', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Names should appear in both desktop and mobile views
      expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('JD').length).toBeGreaterThanOrEqual(2);
    });

    it('should call onRowClick when mobile card is clicked', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const mobileCards = screen
        .getAllByRole('button')
        .filter((el) => el.getAttribute('aria-label')?.includes('View swap request from John Doe'));

      if (mobileCards.length > 0) {
        fireEvent.click(mobileCards[0]);
        expect(mockOnRowClick).toHaveBeenCalledWith('1', 'swap');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on table headers', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      expect(screen.getByLabelText('Requester column')).toBeInTheDocument();
      expect(screen.getByLabelText('Type column')).toBeInTheDocument();
      expect(screen.getByLabelText('Details column')).toBeInTheDocument();
      expect(screen.getByLabelText('Status column')).toBeInTheDocument();
      expect(screen.getByLabelText('Actions column')).toBeInTheDocument();
    });

    it('should have proper ARIA labels on action buttons', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      // Use getAllByLabelText since buttons appear in both desktop and mobile views
      expect(
        screen.getAllByLabelText('Approve request from John Doe').length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByLabelText('Reject request from John Doe').length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByLabelText('Revoke request from Bob Wilson').length
      ).toBeGreaterThanOrEqual(1);
    });

    it('should have keyboard navigation support on rows', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const firstRow = screen.getAllByText('John Doe')[0].closest('tr');
      expect(firstRow).toHaveAttribute('tabIndex', '0');
      expect(firstRow).toHaveAttribute('role', 'button');
    });

    it('should have aria-hidden on avatar decorative elements', () => {
      const { container } = render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const avatars = container.querySelectorAll('[aria-hidden="true"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character names for initials', () => {
      const singleCharRequest: RequestTableRow[] = [
        {
          id: '1',
          type: 'swap',
          requester: { id: 'user1', name: 'X' },
          details: '→ Y',
          status: 'pending_tl',
          actions: [],
        },
      ];

      render(
        <RequestTable
          requests={singleCharRequest}
          onRowClick={mockOnRowClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getAllByText('X')[0]).toBeInTheDocument();
    });

    it('should handle requests with no actions', () => {
      const noActionRequest: RequestTableRow[] = [
        {
          id: '1',
          type: 'leave',
          requester: { id: 'user1', name: 'Test User' },
          details: 'Jan 1 - Jan 5',
          status: 'approved',
          actions: [],
        },
      ];

      render(
        <RequestTable
          requests={noActionRequest}
          onRowClick={mockOnRowClick}
          onAction={mockOnAction}
        />
      );

      // Should not have any action buttons
      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
    });

    it('should handle long names gracefully', () => {
      const longNameRequest: RequestTableRow[] = [
        {
          id: '1',
          type: 'swap',
          requester: { id: 'user1', name: 'Christopher Alexander Montgomery III' },
          details: '→ Elizabeth Victoria Pemberton-Smith',
          status: 'pending_tl',
          actions: [],
        },
      ];

      render(
        <RequestTable
          requests={longNameRequest}
          onRowClick={mockOnRowClick}
          onAction={mockOnAction}
        />
      );

      expect(screen.getAllByText('Christopher Alexander Montgomery III')[0]).toBeInTheDocument();
      // Initials should be limited to 2 characters
      expect(screen.getAllByText('CA')[0]).toBeInTheDocument();
    });
  });

  describe('Action Button Styling', () => {
    it('should apply correct styles to approve button', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const approveButton = screen.getAllByText('Approve')[0];
      expect(approveButton).toHaveClass('bg-green-50', 'text-green-700');
    });

    it('should apply correct styles to reject button', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const rejectButton = screen.getAllByText('Reject')[0];
      expect(rejectButton).toHaveClass('bg-red-50', 'text-red-700');
    });

    it('should apply correct styles to revoke button', () => {
      render(
        <RequestTable requests={mockRequests} onRowClick={mockOnRowClick} onAction={mockOnAction} />
      );

      const revokeButton = screen.getAllByText('Revoke')[0];
      expect(revokeButton).toHaveClass('bg-gray-50', 'text-gray-700');
    });
  });
});
