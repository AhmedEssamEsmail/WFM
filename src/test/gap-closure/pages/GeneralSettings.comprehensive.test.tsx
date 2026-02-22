import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneralSettings from '../../../pages/Settings/GeneralSettings';
import { settingsService } from '../../../services';

/**
 * Comprehensive tests for GeneralSettings component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.6, CR-2.1.4, PR-4.2.4
 */

vi.mock('../../../services', () => ({
  settingsService: {
    updateSetting: vi.fn(),
  },
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('GeneralSettings Component', () => {
  const defaultProps = {
    autoApprove: false,
    allowLeaveExceptions: false,
    onAutoApproveChange: vi.fn(),
    onAllowLeaveExceptionsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsService.updateSetting).mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByText('Auto-Approve Requests')).toBeInTheDocument();
      expect(screen.getByText('Allow Leave Exceptions')).toBeInTheDocument();
    });

    it('should render auto-approve description', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(
        screen.getByText('Automatically approve swap and leave requests when TL approves them')
      ).toBeInTheDocument();
    });

    it('should render leave exceptions description', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(
        screen.getByText(
          'Allow users to request exceptions for denied leave requests (insufficient balance)'
        )
      ).toBeInTheDocument();
    });

    it('should render note about changes', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(
        screen.getByText('Note: Changes take effect immediately for all new requests.')
      ).toBeInTheDocument();
    });

    it('should have white background with shadow', () => {
      const { container } = render(<GeneralSettings {...defaultProps} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('bg-white');
      expect(mainDiv).toHaveClass('shadow');
    });
  });

  describe('Auto-Approve Toggle', () => {
    it('should render toggle in off state when autoApprove is false', () => {
      render(<GeneralSettings {...defaultProps} autoApprove={false} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];
      expect(autoApproveToggle).toHaveClass('bg-gray-200');
    });

    it('should render toggle in on state when autoApprove is true', () => {
      render(<GeneralSettings {...defaultProps} autoApprove={true} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];
      expect(autoApproveToggle).toHaveClass('bg-indigo-600');
    });

    it('should call updateSetting when toggle is clicked', async () => {
      render(<GeneralSettings {...defaultProps} autoApprove={false} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalledWith('wfm_auto_approve', 'true');
      });
    });

    it('should call onAutoApproveChange with new value', async () => {
      const onAutoApproveChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          autoApprove={false}
          onAutoApproveChange={onAutoApproveChange}
        />
      );
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(onAutoApproveChange).toHaveBeenCalledWith(true);
      });
    });

    it('should toggle from true to false', async () => {
      const onAutoApproveChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          autoApprove={true}
          onAutoApproveChange={onAutoApproveChange}
        />
      );
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalledWith('wfm_auto_approve', 'false');
        expect(onAutoApproveChange).toHaveBeenCalledWith(false);
      });
    });

    it('should disable toggle while saving', async () => {
      vi.mocked(settingsService.updateSetting).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<GeneralSettings {...defaultProps} autoApprove={false} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(autoApproveToggle).toHaveClass('cursor-not-allowed');
        expect(autoApproveToggle).toHaveClass('opacity-50');
      });
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(settingsService.updateSetting).mockRejectedValue(new Error('Save failed'));

      render(<GeneralSettings {...defaultProps} autoApprove={false} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error saving settings:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Leave Exceptions Toggle', () => {
    it('should render toggle in off state when allowLeaveExceptions is false', () => {
      render(<GeneralSettings {...defaultProps} allowLeaveExceptions={false} />);
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];
      expect(exceptionsToggle).toHaveClass('bg-gray-200');
    });

    it('should render toggle in on state when allowLeaveExceptions is true', () => {
      render(<GeneralSettings {...defaultProps} allowLeaveExceptions={true} />);
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];
      expect(exceptionsToggle).toHaveClass('bg-indigo-600');
    });

    it('should call updateSetting when toggle is clicked', async () => {
      render(<GeneralSettings {...defaultProps} allowLeaveExceptions={false} />);
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];

      fireEvent.click(exceptionsToggle);

      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalledWith(
          'allow_leave_exceptions',
          'true'
        );
      });
    });

    it('should call onAllowLeaveExceptionsChange with new value', async () => {
      const onAllowLeaveExceptionsChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          allowLeaveExceptions={false}
          onAllowLeaveExceptionsChange={onAllowLeaveExceptionsChange}
        />
      );
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];

      fireEvent.click(exceptionsToggle);

      await waitFor(() => {
        expect(onAllowLeaveExceptionsChange).toHaveBeenCalledWith(true);
      });
    });

    it('should toggle from true to false', async () => {
      const onAllowLeaveExceptionsChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          allowLeaveExceptions={true}
          onAllowLeaveExceptionsChange={onAllowLeaveExceptionsChange}
        />
      );
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];

      fireEvent.click(exceptionsToggle);

      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalledWith(
          'allow_leave_exceptions',
          'false'
        );
        expect(onAllowLeaveExceptionsChange).toHaveBeenCalledWith(false);
      });
    });

    it('should disable toggle while saving', async () => {
      vi.mocked(settingsService.updateSetting).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<GeneralSettings {...defaultProps} allowLeaveExceptions={false} />);
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];

      fireEvent.click(exceptionsToggle);

      await waitFor(() => {
        expect(exceptionsToggle).toHaveClass('cursor-not-allowed');
        expect(exceptionsToggle).toHaveClass('opacity-50');
      });
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(settingsService.updateSetting).mockRejectedValue(new Error('Save failed'));

      render(<GeneralSettings {...defaultProps} allowLeaveExceptions={false} />);
      const toggles = screen.getAllByRole('button');
      const exceptionsToggle = toggles[1];

      fireEvent.click(exceptionsToggle);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error saving settings:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Multiple Toggles', () => {
    it('should handle both toggles being on', () => {
      render(<GeneralSettings {...defaultProps} autoApprove={true} allowLeaveExceptions={true} />);
      const toggles = screen.getAllByRole('button');
      expect(toggles[0]).toHaveClass('bg-indigo-600');
      expect(toggles[1]).toHaveClass('bg-indigo-600');
    });

    it('should handle both toggles being off', () => {
      render(
        <GeneralSettings {...defaultProps} autoApprove={false} allowLeaveExceptions={false} />
      );
      const toggles = screen.getAllByRole('button');
      expect(toggles[0]).toHaveClass('bg-gray-200');
      expect(toggles[1]).toHaveClass('bg-gray-200');
    });

    it('should handle mixed toggle states', () => {
      render(<GeneralSettings {...defaultProps} autoApprove={true} allowLeaveExceptions={false} />);
      const toggles = screen.getAllByRole('button');
      expect(toggles[0]).toHaveClass('bg-indigo-600');
      expect(toggles[1]).toHaveClass('bg-gray-200');
    });

    it('should allow toggling both settings independently', async () => {
      render(
        <GeneralSettings {...defaultProps} autoApprove={false} allowLeaveExceptions={false} />
      );
      const toggles = screen.getAllByRole('button');

      fireEvent.click(toggles[0]);
      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalledWith('wfm_auto_approve', 'true');
      });

      fireEvent.click(toggles[1]);
      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalledWith(
          'allow_leave_exceptions',
          'true'
        );
      });

      expect(settingsService.updateSetting).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const { container } = render(<GeneralSettings {...defaultProps} />);
      const headings = container.querySelectorAll('h3');
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Auto-Approve Requests');
      expect(headings[1]).toHaveTextContent('Allow Leave Exceptions');
    });

    it('should have descriptive text for each setting', () => {
      render(<GeneralSettings {...defaultProps} />);
      const descriptions = screen.getAllByText(/approve|exceptions/i);
      expect(descriptions.length).toBeGreaterThan(2);
    });

    it('should have focus styles on toggles', () => {
      render(<GeneralSettings {...defaultProps} />);
      const toggles = screen.getAllByRole('button');
      toggles.forEach((toggle) => {
        expect(toggle).toHaveClass('focus:outline-none');
        expect(toggle).toHaveClass('focus:ring-2');
        expect(toggle).toHaveClass('focus:ring-indigo-500');
      });
    });
  });

  describe('Layout', () => {
    it('should have border between sections', () => {
      const { container } = render(<GeneralSettings {...defaultProps} />);
      const sections = container.querySelectorAll('.border-t');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have proper spacing', () => {
      const { container } = render(<GeneralSettings {...defaultProps} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('space-y-6');
      expect(mainDiv).toHaveClass('p-6');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', async () => {
      render(<GeneralSettings {...defaultProps} autoApprove={false} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);
      fireEvent.click(autoApproveToggle);
      fireEvent.click(autoApproveToggle);

      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalled();
      });
    });

    it('should maintain state during save', async () => {
      vi.mocked(settingsService.updateSetting).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      const { rerender } = render(<GeneralSettings {...defaultProps} autoApprove={false} />);
      const toggles = screen.getAllByRole('button');
      const autoApproveToggle = toggles[0];

      fireEvent.click(autoApproveToggle);

      // Rerender with updated prop
      rerender(<GeneralSettings {...defaultProps} autoApprove={true} />);

      await waitFor(() => {
        expect(settingsService.updateSetting).toHaveBeenCalled();
      });
    });
  });
});
