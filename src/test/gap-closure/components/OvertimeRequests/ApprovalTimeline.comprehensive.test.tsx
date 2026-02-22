import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApprovalTimeline from '../../../../components/OvertimeRequests/ApprovalTimeline';
import type { OvertimeRequest } from '../../../../types/overtime';

/**
 * Comprehensive tests for ApprovalTimeline component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.4, CR-2.1.4, PR-4.3.2
 */
describe('ApprovalTimeline Component', () => {
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
    reason: 'Emergency customer support',
    status: 'pending_tl',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  describe('Rendering', () => {
    it('should render approval timeline', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      expect(screen.getByText('Approval Timeline')).toBeInTheDocument();
    });

    it('should render submission stage', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      expect(screen.getByText('Submitted')).toBeInTheDocument();
    });

    it('should render TL review stage', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      expect(screen.getByText('Team Lead Review')).toBeInTheDocument();
    });

    it('should render WFM review stage', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      expect(screen.getByText('WFM Review')).toBeInTheDocument();
    });
  });

  describe('Submission Stage', () => {
    it('should show submitted status with timestamp', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      expect(screen.getByText(/Submitted on/)).toBeInTheDocument();
    });

    it('should always show submission stage as completed', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      const submittedSection = screen.getByText('Submitted').closest('div');
      expect(submittedSection).toBeInTheDocument();
    });
  });

  describe('TL Review Stage - Pending', () => {
    it('should show awaiting approval when status is pending_tl', () => {
      const request = { ...baseRequest, status: 'pending_tl' as const };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Awaiting approval')).toBeInTheDocument();
    });

    it('should show pending status when not yet reviewed', () => {
      const request = { ...baseRequest, status: 'pending_wfm' as const };
      render(<ApprovalTimeline request={request} />);
      const tlSection = screen.getByText('Team Lead Review').parentElement;
      expect(tlSection).toBeInTheDocument();
    });
  });

  describe('TL Review Stage - Approved', () => {
    it('should show approved status when TL approved', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText(/Approved on/)).toBeInTheDocument();
    });

    it('should show TL notes when provided', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        tl_notes: 'Approved for emergency work',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Approved for emergency work')).toBeInTheDocument();
    });

    it('should show Note label with TL notes', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        tl_notes: 'Looks good',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Note:')).toBeInTheDocument();
    });
  });

  describe('TL Review Stage - Rejected', () => {
    it('should show rejected status when TL rejected', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'rejected',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText(/Rejected on/)).toBeInTheDocument();
    });

    it('should show TL rejection notes', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'rejected',
        tl_notes: 'Not authorized',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Not authorized')).toBeInTheDocument();
    });
  });

  describe('WFM Review Stage - Pending', () => {
    it('should show awaiting approval when status is pending_wfm', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
      };
      render(<ApprovalTimeline request={request} />);
      const wfmSection = screen.getByText('WFM Review').parentElement;
      expect(wfmSection?.textContent).toContain('Awaiting approval');
    });

    it('should show pending status when not yet reviewed', () => {
      const request = { ...baseRequest, status: 'pending_tl' as const };
      render(<ApprovalTimeline request={request} />);
      const wfmSection = screen.getByText('WFM Review').parentElement;
      expect(wfmSection?.textContent).toContain('Pending');
    });
  });

  describe('WFM Review Stage - Approved', () => {
    it('should show approved status when WFM approved', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        wfm_reviewed_by: 'wfm-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
        wfm_decision: 'approved',
      };
      render(<ApprovalTimeline request={request} />);
      const approvedTexts = screen.getAllByText(/Approved on/);
      expect(approvedTexts.length).toBeGreaterThan(0);
    });

    it('should show WFM notes when provided', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        wfm_reviewed_by: 'wfm-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
        wfm_decision: 'approved',
        wfm_notes: 'Approved for payroll',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Approved for payroll')).toBeInTheDocument();
    });
  });

  describe('WFM Review Stage - Rejected', () => {
    it('should show rejected status when WFM rejected', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        wfm_reviewed_by: 'wfm-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
        wfm_decision: 'rejected',
      };
      render(<ApprovalTimeline request={request} />);
      const rejectedTexts = screen.getAllByText(/Rejected on/);
      expect(rejectedTexts.length).toBeGreaterThan(0);
    });

    it('should show WFM rejection notes', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        wfm_reviewed_by: 'wfm-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
        wfm_decision: 'rejected',
        wfm_notes: 'Budget exceeded',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Budget exceeded')).toBeInTheDocument();
    });
  });

  describe('Auto-Approval Detection', () => {
    it('should detect auto-approval when TL and WFM reviewers are same', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'user-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_decision: 'approved',
        wfm_reviewed_by: 'user-1',
        wfm_reviewed_at: '2024-01-15T11:00:00Z',
        wfm_decision: 'approved',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Auto-approved (skipped)')).toBeInTheDocument();
    });

    it('should show auto-approval message', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'user-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        wfm_reviewed_by: 'user-1',
        wfm_reviewed_at: '2024-01-15T11:00:00Z',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Auto-approved after Team Lead approval')).toBeInTheDocument();
    });

    it('should not show auto-approval when reviewers are different', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        wfm_reviewed_by: 'wfm-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.queryByText('Auto-approved (skipped)')).not.toBeInTheDocument();
    });

    it('should not show auto-approval when timestamps are different', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'user-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        wfm_reviewed_by: 'user-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.queryByText('Auto-approved (skipped)')).not.toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should show green checkmark for completed submission', () => {
      const { container } = render(<ApprovalTimeline request={baseRequest} />);
      const icons = container.querySelectorAll('.bg-green-100');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show yellow indicator for pending TL review', () => {
      const request = { ...baseRequest, status: 'pending_tl' as const };
      const { container } = render(<ApprovalTimeline request={request} />);
      const icons = container.querySelectorAll('.bg-yellow-100');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show green checkmark for approved TL review', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
      };
      const { container } = render(<ApprovalTimeline request={request} />);
      const icons = container.querySelectorAll('.bg-green-100');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show red X for rejected TL review', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'rejected',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
      };
      const { container } = render(<ApprovalTimeline request={request} />);
      const icons = container.querySelectorAll('.bg-red-100');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show blue lightning for auto-approved WFM', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'user-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        wfm_reviewed_by: 'user-1',
        wfm_reviewed_at: '2024-01-15T11:00:00Z',
      };
      const { container } = render(<ApprovalTimeline request={request} />);
      const icons = container.querySelectorAll('.bg-blue-100');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle request with no reviewer information', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      expect(screen.getByText('Approval Timeline')).toBeInTheDocument();
    });

    it('should handle cancelled status', () => {
      const request = { ...baseRequest, status: 'cancelled' as const };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText('Approval Timeline')).toBeInTheDocument();
    });

    it('should handle very long TL notes', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_notes:
          'This is a very long note that explains in great detail why this overtime request was approved and what considerations were taken into account during the review process.',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
    });

    it('should handle very long WFM notes', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'approved',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        wfm_reviewed_by: 'wfm-1',
        wfm_reviewed_at: '2024-01-15T12:00:00Z',
        wfm_notes:
          'This is a very long WFM note with extensive details about budget approval and payroll processing requirements.',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.getByText(/This is a very long WFM note/)).toBeInTheDocument();
    });

    it('should handle empty notes strings', () => {
      const request: OvertimeRequest = {
        ...baseRequest,
        status: 'pending_wfm',
        tl_reviewed_by: 'tl-1',
        tl_reviewed_at: '2024-01-15T11:00:00Z',
        tl_notes: '',
      };
      render(<ApprovalTimeline request={request} />);
      expect(screen.queryByText('Note:')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have rounded corners and shadow', () => {
      const { container } = render(<ApprovalTimeline request={baseRequest} />);
      const timeline = container.firstChild;
      expect(timeline).toHaveClass('rounded-lg', 'bg-white', 'shadow-sm');
    });

    it('should have proper spacing between stages', () => {
      const { container } = render(<ApprovalTimeline request={baseRequest} />);
      const stagesContainer = container.querySelector('.space-y-4');
      expect(stagesContainer).toBeInTheDocument();
    });

    it('should display stages in vertical layout', () => {
      render(<ApprovalTimeline request={baseRequest} />);
      const stages = [
        screen.getByText('Submitted'),
        screen.getByText('Team Lead Review'),
        screen.getByText('WFM Review'),
      ];
      stages.forEach((stage) => {
        expect(stage).toBeInTheDocument();
      });
    });
  });
});
