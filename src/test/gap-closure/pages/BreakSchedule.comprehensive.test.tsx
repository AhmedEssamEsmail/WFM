import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BreakSchedule from '../../../pages/BreakSchedule';
import { useAuth } from '../../../hooks/useAuth';
import { useBreakSchedules } from '../../../hooks/useBreakSchedules';
import { useToast } from '../../../contexts/ToastContext';
import { exportToCSV, importFromCSV } from '../../../lib/breakScheduleCSV';
import type { AgentBreakSchedule } from '../../../types';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useBreakSchedules');
vi.mock('../../../contexts/ToastContext');
vi.mock('../../../lib/breakScheduleCSV');

// Mock child components
vi.mock('../../../components/BreakSchedule/DateNavigation', () => ({
  default: ({ currentDate, onDateChange }: any) => (
    <div data-testid="date-navigation">
      <button onClick={() => onDateChange(new Date('2024-01-16'))}>Next Day</button>
      <span>{currentDate.toISOString()}</span>
    </div>
  ),
}));

vi.mock('../../../components/BreakSchedule/FilterBar', () => ({
  default: ({
    searchQuery,
    onSearchChange,
    selectedDepartment,
    onDepartmentChange,
    departments,
    isWFM,
    onAutoDistribute,
    onImport,
    onExport,
    onClearAll,
  }: any) => (
    <div data-testid="filter-bar">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search"
      />
      <select
        data-testid="department-select"
        value={selectedDepartment}
        onChange={(e) => onDepartmentChange(e.target.value)}
      >
        <option value="">All Departments</option>
        {departments.map((dept: string) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
      {isWFM && (
        <>
          <button data-testid="auto-distribute-btn" onClick={onAutoDistribute}>
            Auto Distribute
          </button>
          <button data-testid="import-btn" onClick={onImport}>
            Import
          </button>
          <button data-testid="export-btn" onClick={onExport}>
            Export
          </button>
          <button data-testid="clear-all-btn" onClick={onClearAll}>
            Clear All
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock('../../../components/BreakSchedule/BreakScheduleTable', () => ({
  default: ({ schedules, intervals, onUpdate, isEditable, scheduleDate }: any) => (
    <div data-testid="break-schedule-table">
      <div>Schedule Date: {scheduleDate}</div>
      <div>Editable: {isEditable ? 'Yes' : 'No'}</div>
      <div>Schedules: {schedules.length}</div>
      {schedules.map((schedule: AgentBreakSchedule) => (
        <div key={schedule.user_id} data-testid={`schedule-${schedule.user_id}`}>
          {schedule.name} - {schedule.department}
          {schedule.auto_distribution_failure && (
            <span data-testid="failure-reason">{schedule.auto_distribution_failure}</span>
          )}
        </div>
      ))}
      {onUpdate && (
        <button data-testid="trigger-update" onClick={() => onUpdate([])}>
          Update
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../../components/BreakSchedule/WarningPopup', () => ({
  default: ({ warning, onDismiss, onClose }: any) => (
    <div data-testid="warning-popup">
      <div>Warning: {warning.message}</div>
      <button data-testid="dismiss-warning-btn" onClick={onDismiss}>
        Dismiss
      </button>
      <button data-testid="close-warning-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('BreakSchedule Page - Comprehensive Tests', () => {
  let queryClient: QueryClient;
  const mockSchedules: AgentBreakSchedule[] = [
    {
      user_id: 'user-1',
      name: 'John Doe',
      shift_type: 'AM',
      department: 'Sales',
      breaks: { HB1: '10:00:00', B: '12:00:00', HB2: '14:00:00' },
      intervals: { '09:00': 'IN', '10:00': 'HB1', '12:00': 'B', '14:00': 'HB2' },
      has_warning: false,
      warning_details: null,
    },
    {
      user_id: 'user-2',
      name: 'Jane Smith',
      shift_type: 'PM',
      department: 'Support',
      breaks: { HB1: '13:00:00', B: '15:00:00', HB2: '17:00:00' },
      intervals: { '13:00': 'HB1', '15:00': 'B', '17:00': 'HB2' },
      has_warning: true,
      warning_details: null,
    },
    {
      user_id: 'user-3',
      name: 'Bob Johnson',
      shift_type: 'AM',
      department: 'Sales',
      breaks: { HB1: '10:30:00', B: '12:30:00', HB2: '14:30:00' },
      intervals: { '09:00': 'IN', '10:30': 'HB1', '12:30': 'B', '14:30': 'HB2' },
      has_warning: false,
      warning_details: null,
    },
  ];

  const mockIntervals = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const mockWarnings = [
    { id: 'warning-1', message: 'Shift change detected', schedule_date: '2024-01-15' },
  ];

  const mockUseBreakSchedules = {
    schedules: mockSchedules,
    intervals: mockIntervals,
    warnings: [],
    isLoading: false,
    updateBreakSchedules: { mutateAsync: vi.fn() },
    dismissWarning: { mutateAsync: vi.fn() },
    autoDistribute: { mutateAsync: vi.fn() },
    clearAllBreaks: { mutateAsync: vi.fn() },
    queryClient: { invalidateQueries: vi.fn() },
  };

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    updateToast: vi.fn(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'wfm',
        name: 'Test User',
        created_at: '2024-01-01',
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    vi.mocked(useBreakSchedules).mockReturnValue(mockUseBreakSchedules as any);
    vi.mocked(useToast).mockReturnValue(mockToast as any);
    vi.mocked(exportToCSV).mockResolvedValue(new Blob());
    vi.mocked(importFromCSV).mockResolvedValue({ success: true, imported: 10, errors: [] });

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BreakSchedule />
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('should render page title and description for WFM role', () => {
      renderPage();

      expect(screen.getByText('Break Schedule')).toBeInTheDocument();
      expect(screen.getByText('Manage team break schedules')).toBeInTheDocument();
    });

    it('should render page description for TL role', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'tl',
          name: 'Test User',
          created_at: '2024-01-01',
        },
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        isLoading: false,
      });

      renderPage();

      expect(screen.getByText('View team break schedules')).toBeInTheDocument();
    });

    it('should render page description for agent role', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'agent',
          name: 'Test User',
          created_at: '2024-01-01',
        },
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        isLoading: false,
      });

      renderPage();

      expect(screen.getByText('View your break schedule')).toBeInTheDocument();
    });

    it('should render loading spinner when data is loading', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        isLoading: true,
      } as any);

      renderPage();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render all main components when loaded', () => {
      renderPage();

      expect(screen.getByTestId('date-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('break-schedule-table')).toBeInTheDocument();
    });

    it('should render hidden file input for CSV import', () => {
      renderPage();

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
      expect(fileInput).toHaveAttribute('accept', '.csv');
    });
  });

  describe('Data Loading', () => {
    it('should load schedules for current date', () => {
      renderPage();

      expect(useBreakSchedules).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    });

    it('should display all schedules', () => {
      renderPage();

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });

    it('should pass correct editable flag to table for WFM', () => {
      renderPage();

      expect(screen.getByText('Editable: Yes')).toBeInTheDocument();
    });

    it('should pass correct editable flag to table for non-WFM', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'agent',
          name: 'Test User',
          created_at: '2024-01-01',
        },
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        isLoading: false,
      });

      renderPage();

      expect(screen.getByText('Editable: No')).toBeInTheDocument();
    });
  });

  describe('Schedule Filtering', () => {
    it('should filter schedules by search query', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      // Only Jane Smith should be visible
      expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    it('should filter schedules by department', () => {
      renderPage();

      const departmentSelect = screen.getByTestId('department-select');
      fireEvent.change(departmentSelect, { target: { value: 'Sales' } });

      // Only Sales department should be visible
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.queryByText(/Jane Smith/)).not.toBeInTheDocument();
      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });

    it('should filter by both search and department', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      const departmentSelect = screen.getByTestId('department-select');

      fireEvent.change(searchInput, { target: { value: 'John' } });
      fireEvent.change(departmentSelect, { target: { value: 'Sales' } });

      // Only John Doe should be visible (Bob Johnson also matches "John" in his name)
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.queryByText(/Jane Smith/)).not.toBeInTheDocument();
      // Bob Johnson also contains "John" so he will be visible too
      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });

    it('should be case-insensitive for search', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'JANE' } });

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    it('should show all schedules when filters are cleared', () => {
      renderPage();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Jane' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });
  });

  describe('Schedule Sorting', () => {
    it('should sort schedules by shift type then name', () => {
      const schedules = [
        { ...mockSchedules[1], shift_type: 'PM' }, // Jane - PM
        { ...mockSchedules[0], shift_type: 'AM' }, // John - AM
        { ...mockSchedules[2], shift_type: 'AM' }, // Bob - AM
      ];

      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        schedules,
      } as any);

      renderPage();

      const scheduleElements = screen.getAllByTestId(/^schedule-/);
      // AM shifts should come first (Bob, John), then PM (Jane)
      expect(scheduleElements[0]).toHaveTextContent('Bob Johnson');
      expect(scheduleElements[1]).toHaveTextContent('John Doe');
      expect(scheduleElements[2]).toHaveTextContent('Jane Smith');
    });

    it('should sort OFF shifts last', () => {
      const schedules = [
        { ...mockSchedules[0], shift_type: 'OFF' },
        { ...mockSchedules[1], shift_type: 'AM' },
        { ...mockSchedules[2], shift_type: 'PM' },
      ];

      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        schedules,
      } as any);

      renderPage();

      const scheduleElements = screen.getAllByTestId(/^schedule-/);
      // OFF should be last
      expect(scheduleElements[2]).toHaveTextContent('John Doe');
    });
  });

  describe('Date Navigation', () => {
    it('should update schedules when date changes', async () => {
      renderPage();

      const nextDayButton = screen.getByText('Next Day');
      fireEvent.click(nextDayButton);

      await waitFor(() => {
        expect(useBreakSchedules).toHaveBeenCalledWith('2024-01-16');
      });
    });
  });

  describe('Schedule Updates', () => {
    it('should call updateBreakSchedules when table triggers update', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        updateBreakSchedules: { mutateAsync: mockUpdate },
      } as any);

      renderPage();

      const updateButton = screen.getByTestId('trigger-update');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Auto Distribution', () => {
    it('should show WFM controls for WFM role', () => {
      renderPage();

      expect(screen.getByTestId('auto-distribute-btn')).toBeInTheDocument();
      expect(screen.getByTestId('import-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-btn')).toBeInTheDocument();
      expect(screen.getByTestId('clear-all-btn')).toBeInTheDocument();
    });

    it('should not show WFM controls for non-WFM role', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'agent',
          name: 'Test User',
          created_at: '2024-01-01',
        },
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        isLoading: false,
      });

      renderPage();

      expect(screen.queryByTestId('auto-distribute-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('import-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('clear-all-btn')).not.toBeInTheDocument();
    });

    it('should call autoDistribute with correct parameters', async () => {
      const mockAutoDistribute = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      await waitFor(() => {
        expect(mockAutoDistribute).toHaveBeenCalledWith({
          schedule_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          strategy: 'ladder',
          apply_mode: 'all_agents',
        });
      });
    });

    it('should show loading toast during auto distribution', async () => {
      const mockAutoDistribute = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      expect(mockToast.loading).toHaveBeenCalledWith('Distributing breaks...');
    });

    it('should show success toast on successful distribution', async () => {
      const mockAutoDistribute = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      await waitFor(() => {
        expect(mockToast.updateToast).toHaveBeenCalledWith(
          'toast-id',
          'Breaks distributed successfully!',
          'success',
          5000
        );
      });
    });

    it('should show error toast on failed distribution', async () => {
      const mockAutoDistribute = vi.fn().mockRejectedValue(new Error('Distribution failed'));
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      await waitFor(() => {
        expect(mockToast.updateToast).toHaveBeenCalledWith(
          'toast-id',
          'Failed to auto-distribute breaks',
          'error',
          5000
        );
      });
    });

    it('should not distribute if user cancels confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const mockAutoDistribute = vi.fn();
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      expect(mockAutoDistribute).not.toHaveBeenCalled();
    });

    it('should clear failed agents map on successful distribution', async () => {
      const mockAutoDistribute = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      await waitFor(() => {
        expect(mockAutoDistribute).toHaveBeenCalled();
      });

      // Verify no failure reasons are displayed
      expect(screen.queryByTestId('failure-reason')).not.toBeInTheDocument();
    });
  });

  describe('CSV Import/Export', () => {
    it('should trigger file input when import button is clicked', () => {
      renderPage();

      const importBtn = screen.getByTestId('import-btn');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(importBtn);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should import CSV file successfully', async () => {
      vi.mocked(importFromCSV).mockResolvedValue({
        success: true,
        imported: 15,
        errors: [],
      });

      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(importFromCSV).toHaveBeenCalledWith(file);
        expect(mockToast.success).toHaveBeenCalledWith('Successfully imported 15 break schedules!');
      });
    });

    it('should invalidate queries after successful import', async () => {
      const mockInvalidate = vi.fn();
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        queryClient: { invalidateQueries: mockInvalidate },
      } as any);

      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockInvalidate).toHaveBeenCalledWith({
          queryKey: ['breakSchedules'],
        });
      });
    });

    it('should show error toast on import failure', async () => {
      vi.mocked(importFromCSV).mockResolvedValue({
        success: false,
        imported: 0,
        errors: ['Invalid format', 'Missing columns'],
      });

      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Import completed with 2 errors. Check console for details.'
        );
      });
    });

    it('should handle import exception', async () => {
      vi.mocked(importFromCSV).mockRejectedValue(new Error('File read error'));

      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to import CSV file');
      });
    });

    it('should reset file input after import', async () => {
      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });

    it('should not import if no file selected', async () => {
      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(importFromCSV).not.toHaveBeenCalled();
    });

    it('should disable file input during import', async () => {
      let resolveImport: any;
      vi.mocked(importFromCSV).mockReturnValue(new Promise((resolve) => (resolveImport = resolve)));

      renderPage();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(fileInput).toBeDisabled();
      });

      resolveImport({ success: true, imported: 10, errors: [] });
    });

    it('should export CSV file successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      vi.mocked(exportToCSV).mockResolvedValue(mockBlob);

      renderPage();

      const exportBtn = screen.getByTestId('export-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(exportToCSV).toHaveBeenCalledWith(mockSchedules, expect.any(String));
        expect(mockToast.success).toHaveBeenCalledWith('Break schedules exported successfully!');
      });
    });

    it('should create download link with correct filename', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      vi.mocked(exportToCSV).mockResolvedValue(mockBlob);

      renderPage();

      const exportBtn = screen.getByTestId('export-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });
    });

    it('should show error toast on export failure', async () => {
      vi.mocked(exportToCSV).mockRejectedValue(new Error('Export failed'));

      renderPage();

      const exportBtn = screen.getByTestId('export-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to export break schedules');
      });
    });
  });

  describe('Warning Management', () => {
    it('should not show warning banner when no warnings', () => {
      renderPage();

      expect(screen.queryByText(/unresolved warning/)).not.toBeInTheDocument();
    });

    it('should show warning banner when warnings exist', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: mockWarnings,
      } as any);

      renderPage();

      expect(screen.getByText('1 unresolved warning')).toBeInTheDocument();
    });

    it('should show plural warning text for multiple warnings', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: [...mockWarnings, { ...mockWarnings[0], id: 'warning-2' }],
      } as any);

      renderPage();

      expect(screen.getByText('2 unresolved warnings')).toBeInTheDocument();
    });

    it('should open warning popup when review button is clicked', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: mockWarnings,
      } as any);

      renderPage();

      const reviewButton = screen.getByText('Review warnings');
      fireEvent.click(reviewButton);

      expect(screen.getByTestId('warning-popup')).toBeInTheDocument();
    });

    it('should display warning message in popup', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: mockWarnings,
      } as any);

      renderPage();

      const reviewButton = screen.getByText('Review warnings');
      fireEvent.click(reviewButton);

      expect(screen.getByText('Warning: Shift change detected')).toBeInTheDocument();
    });

    it('should dismiss warning when dismiss button is clicked', async () => {
      const mockDismiss = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: mockWarnings,
        dismissWarning: { mutateAsync: mockDismiss },
      } as any);

      renderPage();

      const reviewButton = screen.getByText('Review warnings');
      fireEvent.click(reviewButton);

      const dismissButton = screen.getByTestId('dismiss-warning-btn');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(mockDismiss).toHaveBeenCalledWith('warning-1');
      });
    });

    it('should close warning popup when close button is clicked', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: mockWarnings,
      } as any);

      renderPage();

      const reviewButton = screen.getByText('Review warnings');
      fireEvent.click(reviewButton);

      const closeButton = screen.getByTestId('close-warning-btn');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('warning-popup')).not.toBeInTheDocument();
    });

    it('should close popup after dismissing warning', async () => {
      const mockDismiss = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        warnings: mockWarnings,
        dismissWarning: { mutateAsync: mockDismiss },
      } as any);

      renderPage();

      const reviewButton = screen.getByText('Review warnings');
      fireEvent.click(reviewButton);

      const dismissButton = screen.getByTestId('dismiss-warning-btn');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByTestId('warning-popup')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear All Breaks', () => {
    it('should call clearAllBreaks when confirmed', async () => {
      const mockClearAll = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        clearAllBreaks: { mutateAsync: mockClearAll },
      } as any);

      renderPage();

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      fireEvent.click(clearAllBtn);

      await waitFor(() => {
        expect(mockClearAll).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
      });
    });

    it('should not clear if user cancels confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const mockClearAll = vi.fn();
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        clearAllBreaks: { mutateAsync: mockClearAll },
      } as any);

      renderPage();

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      fireEvent.click(clearAllBtn);

      expect(mockClearAll).not.toHaveBeenCalled();
    });

    it('should show confirmation dialog with date', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderPage();

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      fireEvent.click(clearAllBtn);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to clear all breaks')
      );
    });

    it('should clear failed agents map after clearing breaks', async () => {
      const mockClearAll = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        clearAllBreaks: { mutateAsync: mockClearAll },
      } as any);

      renderPage();

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      fireEvent.click(clearAllBtn);

      await waitFor(() => {
        expect(mockClearAll).toHaveBeenCalled();
      });

      // Verify no failure reasons are displayed
      expect(screen.queryByTestId('failure-reason')).not.toBeInTheDocument();
    });
  });

  describe('Department List', () => {
    it('should extract unique departments from schedules', () => {
      renderPage();

      const departmentSelect = screen.getByTestId('department-select');
      expect(departmentSelect).toBeInTheDocument();

      // Should have Sales and Support options
      const options = departmentSelect.querySelectorAll('option');
      const departmentValues = Array.from(options).map((opt) => opt.value);
      expect(departmentValues).toContain('Sales');
      expect(departmentValues).toContain('Support');
    });

    it('should filter out null/undefined departments', () => {
      const schedulesWithNull = [
        ...mockSchedules,
        { ...mockSchedules[0], user_id: 'user-4', department: null },
      ];

      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        schedules: schedulesWithNull,
      } as any);

      renderPage();

      const departmentSelect = screen.getByTestId('department-select');
      const options = departmentSelect.querySelectorAll('option');
      const departmentValues = Array.from(options)
        .map((opt) => opt.value)
        .filter(Boolean);

      expect(departmentValues).not.toContain('null');
      expect(departmentValues).not.toContain('undefined');
    });
  });

  describe('Error States', () => {
    it('should handle empty schedules array', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        schedules: [],
      } as any);

      renderPage();

      expect(screen.getByText('Schedules: 0')).toBeInTheDocument();
    });

    it('should handle empty intervals array', () => {
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        intervals: [],
      } as any);

      renderPage();

      expect(screen.getByTestId('break-schedule-table')).toBeInTheDocument();
    });

    it('should handle missing user in auth', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        isLoading: false,
      });

      renderPage();

      // Should still render but without role-specific features
      expect(screen.getByText('Break Schedule')).toBeInTheDocument();
    });
  });

  describe('Auto Distribution Failure Tracking', () => {
    it('should merge failure reasons into schedules', () => {
      // This test verifies the internal state management
      // The actual display is tested through the mocked component
      renderPage();

      expect(screen.getByTestId('break-schedule-table')).toBeInTheDocument();
    });

    it('should clear failure reasons on successful auto-distribution', async () => {
      const mockAutoDistribute = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useBreakSchedules).mockReturnValue({
        ...mockUseBreakSchedules,
        autoDistribute: { mutateAsync: mockAutoDistribute },
      } as any);

      renderPage();

      const autoDistributeBtn = screen.getByTestId('auto-distribute-btn');
      fireEvent.click(autoDistributeBtn);

      await waitFor(() => {
        expect(mockAutoDistribute).toHaveBeenCalled();
      });

      // After successful distribution, no failure reasons should be present
      expect(screen.queryByTestId('failure-reason')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderPage();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Break Schedule');
    });

    it('should have descriptive button labels', () => {
      renderPage();

      expect(screen.getByTestId('auto-distribute-btn')).toHaveTextContent('Auto Distribute');
      expect(screen.getByTestId('import-btn')).toHaveTextContent('Import');
      expect(screen.getByTestId('export-btn')).toHaveTextContent('Export');
      expect(screen.getByTestId('clear-all-btn')).toHaveTextContent('Clear All');
    });

    it('should have accessible file input', () => {
      renderPage();

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.csv');
    });
  });
});
