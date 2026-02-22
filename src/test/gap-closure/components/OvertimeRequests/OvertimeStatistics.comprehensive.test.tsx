import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OvertimeStatistics from '../../../../components/OvertimeRequests/OvertimeStatistics';
import type {
  OvertimeRequestFilters,
  OvertimeStatistics as Stats,
} from '../../../../types/overtime';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../../contexts/ToastContext';

// Mock hooks and services
vi.mock('../../../../hooks/useOvertimeStatistics', () => ({
  useOvertimeStatistics: vi.fn(),
}));

vi.mock('../../../../services/overtimeRequestsService', () => ({
  overtimeRequestsService: {
    exportOvertimeCSV: vi.fn(),
  },
}));

vi.mock('../../../../utils/overtimeCsvHelpers', () => ({
  generateOvertimeCSVFilename: vi.fn(() => 'overtime-export.csv'),
}));

vi.mock('../../../../utils', () => ({
  downloadCSV: vi.fn(),
}));

import { useOvertimeStatistics } from '../../../../hooks/useOvertimeStatistics';
import { overtimeRequestsService } from '../../../../services/overtimeRequestsService';
import { downloadCSV } from '../../../../utils';

/**
 * Comprehensive tests for OvertimeStatistics component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.4, CR-2.1.4, PR-4.3.2
 */
describe('OvertimeStatistics Component', () => {
  let queryClient: QueryClient;

  const mockFilters: OvertimeRequestFilters = {
    status: 'all',
    date_from: '2024-01-01',
    date_to: '2024-01-31',
  };

  const mockStatistics: Stats = {
    summary: {
      total_requests: 100,
      approved: 80,
      rejected: 15,
      pending: 5,
      approval_rate: 80,
    },
    hours: {
      total_hours: 300,
      regular_hours: 200,
      double_hours: 100,
      equivalent_hours: 500,
    },
    by_agent: [
      {
        user_id: 'user-1',
        name: 'John Doe',
        department: 'Support',
        total_hours: 50,
        regular_hours: 30,
        double_hours: 20,
        equivalent_hours: 85,
        request_count: 10,
      },
      {
        user_id: 'user-2',
        name: 'Jane Smith',
        department: 'Sales',
        total_hours: 40,
        regular_hours: 25,
        double_hours: 15,
        equivalent_hours: 67.5,
        request_count: 8,
      },
    ],
    by_type: {
      regular: {
        count: 60,
        hours: 200,
      },
      double: {
        count: 40,
        hours: 100,
      },
    },
    trend: [
      { week: '2024-W01', hours: 50 },
      { week: '2024-W02', hours: 75 },
      { week: '2024-W03', hours: 60 },
    ],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );

  describe('Loading State', () => {
    it('should show loading message when data is loading', () => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });

    it('should render loading container with proper styling', () => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const loadingContainer = container.querySelector('.rounded-lg.bg-white.p-6.shadow');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when data loading fails', () => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
    });

    it('should render error container with proper styling', () => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
      } as any);

      const { container } = render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const errorDiv = screen.getByText('Error loading statistics').closest('div');
      expect(errorDiv).toHaveClass('text-red-600');
    });
  });

  describe('Empty State', () => {
    it('should render nothing when data is null', () => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.queryByText('Total Requests')).not.toBeInTheDocument();
    });

    it('should render nothing when data is undefined', () => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.queryByText('Total Requests')).not.toBeInTheDocument();
    });
  });

  describe('Summary Cards', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display total requests', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      const summaryCards = screen.getByText('Total Requests').parentElement?.parentElement;
      expect(summaryCards?.textContent).toContain('100');
    });

    it('should display approved count', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('should display rejected count', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      const rejectedCard = screen.getByText('Rejected').parentElement?.parentElement;
      expect(rejectedCard?.textContent).toContain('15');
    });

    it('should display approval rate', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Approval Rate')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('Hours Breakdown', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display hours breakdown section', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Hours Breakdown')).toBeInTheDocument();
    });

    it('should display total hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const hoursSection = screen.getByText('Hours Breakdown').closest('div');
      expect(hoursSection?.textContent).toContain('Total Hours');
      expect(hoursSection?.textContent).toContain('300');
    });

    it('should display regular hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Regular (1.5x)')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should display double hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const hoursSection = screen.getByText('Hours Breakdown').closest('div');
      expect(hoursSection?.textContent).toContain('Double (2.0x)');
      expect(hoursSection?.textContent).toContain('100');
    });

    it('should display equivalent hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Equivalent Hours')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('For payroll')).toBeInTheDocument();
    });
  });

  describe('Top Agents Table', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display top agents section', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Top 5 Agents by Overtime Hours')).toBeInTheDocument();
    });

    it('should display agent names', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display agent departments', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('should display agent hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const table = screen.getByText('Top 5 Agents by Overtime Hours').closest('div');
      expect(table?.textContent).toContain('50');
      expect(table?.textContent).toContain('40');
    });

    it('should display agent request counts', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should show empty state when no agents', () => {
      const emptyStats = { ...mockStatistics, by_agent: [] };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: emptyStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('No approved overtime requests')).toBeInTheDocument();
    });
  });

  describe('Overtime by Type', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display overtime distribution section', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Overtime Distribution by Type')).toBeInTheDocument();
    });

    it('should display regular overtime count and hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('Total: 200 hours')).toBeInTheDocument();
    });

    it('should display double overtime count and hours', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const distributionSection = screen.getByText('Overtime Distribution by Type').closest('div');
      expect(distributionSection?.textContent).toContain('40');
      expect(distributionSection?.textContent).toContain('Total: 100 hours');
    });

    it('should render progress bars for distribution', () => {
      const { container } = render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const progressBars = container.querySelectorAll('.bg-blue-600, .bg-purple-600');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Weekly Trend', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display weekly trend section', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Weekly Trend (Last 8 Weeks)')).toBeInTheDocument();
    });

    it('should display week labels', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('2024-W01')).toBeInTheDocument();
      expect(screen.getByText('2024-W02')).toBeInTheDocument();
      expect(screen.getByText('2024-W03')).toBeInTheDocument();
    });

    it('should display hours for each week', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('50h')).toBeInTheDocument();
      expect(screen.getByText('75h')).toBeInTheDocument();
      expect(screen.getByText('60h')).toBeInTheDocument();
    });

    it('should not render trend section when no trend data', () => {
      const noTrendStats = { ...mockStatistics, trend: [] };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: noTrendStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.queryByText('Weekly Trend (Last 8 Weeks)')).not.toBeInTheDocument();
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display export button', () => {
      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should call export service when button clicked', async () => {
      vi.mocked(overtimeRequestsService.exportOvertimeCSV).mockResolvedValue('csv,content');

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(overtimeRequestsService.exportOvertimeCSV).toHaveBeenCalledWith(mockFilters);
      });
    });

    it('should download CSV after successful export', async () => {
      vi.mocked(overtimeRequestsService.exportOvertimeCSV).mockResolvedValue('csv,content');

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(downloadCSV).toHaveBeenCalledWith('overtime-export.csv', 'csv,content');
      });
    });

    it('should show exporting state during export', async () => {
      vi.mocked(overtimeRequestsService.exportOvertimeCSV).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('csv,content'), 100))
      );

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should disable button during export', async () => {
      vi.mocked(overtimeRequestsService.exportOvertimeCSV).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('csv,content'), 100))
      );

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      const button = screen.getByText('Exporting...').closest('button');
      expect(button).toBeDisabled();
    });

    it('should handle export errors', async () => {
      vi.mocked(overtimeRequestsService.exportOvertimeCSV).mockRejectedValue(
        new Error('Export failed')
      );

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
    });

    it('should log error to console on export failure', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(overtimeRequestsService.exportOvertimeCSV).mockRejectedValue(
        new Error('Export failed')
      );

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total requests', () => {
      const zeroStats = {
        ...mockStatistics,
        summary: { ...mockStatistics.summary, total_requests: 0 },
      };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: zeroStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle 100% approval rate', () => {
      const perfectStats = {
        ...mockStatistics,
        summary: { ...mockStatistics.summary, approval_rate: 100 },
      };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: perfectStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle 0% approval rate', () => {
      const zeroApprovalStats = {
        ...mockStatistics,
        summary: { ...mockStatistics.summary, approval_rate: 0 },
      };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: zeroApprovalStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle single agent in list', () => {
      const singleAgentStats = {
        ...mockStatistics,
        by_agent: [mockStatistics.by_agent[0]],
      };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: singleAgentStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle single week in trend', () => {
      const singleWeekStats = {
        ...mockStatistics,
        trend: [{ week: '2024-W01', hours: 50 }],
      };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: singleWeekStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('2024-W01')).toBeInTheDocument();
    });

    it('should handle zero hours in trend week', () => {
      const zeroHoursStats = {
        ...mockStatistics,
        trend: [{ week: '2024-W01', hours: 0 }],
      };
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: zeroHoursStats,
        isLoading: false,
        error: null,
      } as any);

      render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      expect(screen.getByText('0h')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    beforeEach(() => {
      vi.mocked(useOvertimeStatistics).mockReturnValue({
        data: mockStatistics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should render with proper spacing', () => {
      const { container } = render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render cards with shadow', () => {
      const { container } = render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const cards = container.querySelectorAll('.shadow');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should render cards with rounded corners', () => {
      const { container } = render(<OvertimeStatistics filters={mockFilters} />, { wrapper });
      const cards = container.querySelectorAll('.rounded-lg');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
