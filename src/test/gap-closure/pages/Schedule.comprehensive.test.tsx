import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Schedule from '../../../pages/Schedule/Schedule';
import { AuthContext } from '../../../contexts/AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import type { User } from '../../../types';
import * as useScheduleModule from '../../../hooks/useSchedule';

/**
 * Comprehensive tests for Schedule page component
 * Target: Increase coverage from existing to 80%+
 * Requirements: FR-1.2.5, CR-2.1.4, PR-4.3.3
 */

// Mock the useSchedule hook
const mockCreateShift = vi.fn();
const mockUpdateShift = vi.fn();
const mockDeleteShift = vi.fn();
const mockCreateLeave = vi.fn();
const mockUpdateLeave = vi.fn();
const mockDeleteLeave = vi.fn();

vi.mock('../../../hooks/useSchedule', () => ({
  useSchedule: vi.fn(() => ({
    users: [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@test.com',
        assigned_skills: [{ id: 'skill-1', name: 'JavaScript' }],
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@test.com',
        assigned_skills: [{ id: 'skill-2', name: 'TypeScript' }],
      },
    ],
    shifts: [
      {
        id: 'shift-1',
        user_id: 'user-1',
        date: new Date().toISOString().split('T')[0],
        shift_type: 'AM',
      },
    ],
    approvedLeaves: [],
    swappedUserNames: {},
    isLoading: false,
    createShift: { mutateAsync: mockCreateShift },
    updateShift: { mutateAsync: mockUpdateShift },
    deleteShift: { mutateAsync: mockDeleteShift },
    createLeave: { mutateAsync: mockCreateLeave },
    updateLeave: { mutateAsync: mockUpdateLeave },
    deleteLeave: { mutateAsync: mockDeleteLeave },
  })),
}));

// Mock the useLeaveTypes hook
vi.mock('../../../hooks/useLeaveTypes', () => ({
  useLeaveTypes: vi.fn(() => ({
    leaveTypes: [
      { id: 'lt-1', code: 'annual', label: 'Annual Leave', color: '#FEF3C7', is_active: true },
      { id: 'lt-2', code: 'sick', label: 'Sick Leave', color: '#FEE2E2', is_active: true },
    ],
    isLoading: false,
  })),
}));

// Mock the useSkills hook for SkillsFilter
vi.mock('../../../hooks/useSkills', () => ({
  useSkills: vi.fn(() => ({
    skills: [
      { id: 'skill-1', name: 'JavaScript', color: '#F59E0B', is_active: true },
      { id: 'skill-2', name: 'TypeScript', color: '#3B82F6', is_active: true },
    ],
    isLoading: false,
  })),
}));

describe('Schedule Page - Comprehensive', () => {
  let queryClient: QueryClient;
  let mockUser: User;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUser = {
      id: 'user-1',
      email: 'user@dabdoob.com',
      name: 'John Doe',
      role: 'wfm',
      created_at: '2024-01-01T00:00:00Z',
    };

    vi.clearAllMocks();
    mockCreateShift.mockResolvedValue({});
    mockUpdateShift.mockResolvedValue({});
    mockDeleteShift.mockResolvedValue({});
    mockCreateLeave.mockResolvedValue({});
    mockUpdateLeave.mockResolvedValue({});
    mockDeleteLeave.mockResolvedValue({});
  });

  const renderSchedule = (user: User | null = mockUser) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={{ user, loading: false, signOut: vi.fn() }}>
            <ToastProvider>
              <Schedule />
            </ToastProvider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Page rendering', () => {
    it('should render page title', () => {
      renderSchedule();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    it('should render description for WFM users', () => {
      renderSchedule();
      expect(screen.getByText('View and manage team schedules')).toBeInTheDocument();
    });

    it('should render description for agent users', () => {
      const agentUser = { ...mockUser, role: 'agent' as const };
      renderSchedule(agentUser);
      expect(screen.getByText('View your schedule')).toBeInTheDocument();
    });

    it('should render description for TL users', () => {
      const tlUser = { ...mockUser, role: 'tl' as const };
      renderSchedule(tlUser);
      expect(screen.getByText('View and manage team schedules')).toBeInTheDocument();
    });

    it('should render calendar with month and year', () => {
      renderSchedule();
      const monthYearRegex = /\w+ \d{4}/;
      expect(screen.getByText(monthYearRegex)).toBeInTheDocument();
    });

    it('should render calendar grid', () => {
      renderSchedule();
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should render Name column header', () => {
      renderSchedule();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should render user rows', () => {
      renderSchedule();
      const johnDoeElements = screen.getAllByText('John Doe');
      expect(johnDoeElements.length).toBeGreaterThan(0);
    });

    it('should render legend', () => {
      renderSchedule();
      expect(screen.getByText('Legend')).toBeInTheDocument();
    });

    it('should render shift types in legend', () => {
      renderSchedule();
      expect(screen.getByText('Shifts')).toBeInTheDocument();
      expect(screen.getByText('AM')).toBeInTheDocument();
      expect(screen.getByText('PM')).toBeInTheDocument();
      expect(screen.getByText('BET')).toBeInTheDocument();
      expect(screen.getByText('OFF')).toBeInTheDocument();
    });

    it('should render leave types in legend', () => {
      renderSchedule();
      expect(screen.getByText('Leave Types')).toBeInTheDocument();
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should render loading spinner when data is loading', () => {
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [],
        shifts: [],
        approvedLeaves: [],
        swappedUserNames: {},
        isLoading: true,
        createShift: { mutateAsync: vi.fn() },
        updateShift: { mutateAsync: vi.fn() },
        deleteShift: { mutateAsync: vi.fn() },
        createLeave: { mutateAsync: vi.fn() },
        updateLeave: { mutateAsync: vi.fn() },
        deleteLeave: { mutateAsync: vi.fn() },
      });

      renderSchedule();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Date navigation', () => {
    it('should render previous month button', () => {
      renderSchedule();
      const prevButtons = screen.getAllByRole('button');
      const prevButton = prevButtons.find((btn) =>
        btn.querySelector('svg path[d*="M15 19l-7-7 7-7"]')
      );
      expect(prevButton).toBeInTheDocument();
    });

    it('should render next month button', () => {
      renderSchedule();
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find((btn) =>
        btn.querySelector('svg path[d*="M9 5l7 7-7 7"]')
      );
      expect(nextButton).toBeInTheDocument();
    });

    it('should navigate to previous month', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const initialMonth = screen.getByText(/\w+ \d{4}/).textContent;
      const prevButtons = screen.getAllByRole('button');
      const prevButton = prevButtons.find((btn) =>
        btn.querySelector('svg path[d*="M15 19l-7-7 7-7"]')
      );

      if (prevButton) {
        await user.click(prevButton);
        await waitFor(() => {
          const newMonth = screen.getByText(/\w+ \d{4}/).textContent;
          expect(newMonth).not.toBe(initialMonth);
        });
      }
    });

    it('should navigate to next month', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const initialMonth = screen.getByText(/\w+ \d{4}/).textContent;
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find((btn) =>
        btn.querySelector('svg path[d*="M9 5l7 7-7 7"]')
      );

      if (nextButton) {
        await user.click(nextButton);
        await waitFor(() => {
          const newMonth = screen.getByText(/\w+ \d{4}/).textContent;
          expect(newMonth).not.toBe(initialMonth);
        });
      }
    });
  });

  describe('Filters - WFM/TL users', () => {
    it('should render skills filter for WFM users', () => {
      renderSchedule();
      expect(screen.getByText('Filter by Skills')).toBeInTheDocument();
    });

    it('should render agent filter for WFM users', () => {
      renderSchedule();
      expect(screen.getByText('Filter by Agent')).toBeInTheDocument();
    });

    it('should not render filters for agent users', () => {
      const agentUser = { ...mockUser, role: 'agent' as const };
      renderSchedule(agentUser);
      expect(screen.queryByText('Filter by Skills')).not.toBeInTheDocument();
      expect(screen.queryByText('Filter by Agent')).not.toBeInTheDocument();
    });

    it('should render filters for TL users', () => {
      const tlUser = { ...mockUser, role: 'tl' as const };
      renderSchedule(tlUser);
      expect(screen.getByText('Filter by Skills')).toBeInTheDocument();
      expect(screen.getByText('Filter by Agent')).toBeInTheDocument();
    });

    it('should have "All Agents" option in agent filter', () => {
      renderSchedule();
      expect(screen.getByText('All Agents')).toBeInTheDocument();
    });

    it('should list all users in agent filter', () => {
      renderSchedule();
      const select = screen.getByLabelText('Filter by Agent');
      expect(select).toBeInTheDocument();

      // Check options
      const options = Array.from(select.querySelectorAll('option'));
      expect(options.some((opt) => opt.textContent === 'All Agents')).toBe(true);
      expect(options.some((opt) => opt.textContent === 'John Doe')).toBe(true);
      expect(options.some((opt) => opt.textContent === 'Jane Smith')).toBe(true);
    });

    it('should filter users by agent selection', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const select = screen.getByLabelText('Filter by Agent');
      await user.selectOptions(select, 'user-1');

      // Should still show John Doe
      const johnDoeElements = screen.getAllByText('John Doe');
      expect(johnDoeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Shift editing - WFM/TL users', () => {
    it('should allow WFM users to click on calendar cells', () => {
      renderSchedule();
      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should not allow agent users to click on calendar cells', () => {
      const agentUser = { ...mockUser, role: 'agent' as const };
      renderSchedule(agentUser);

      const table = screen.getByRole('table');
      const cells = table.querySelectorAll('td');

      cells.forEach((cell) => {
        expect(cell.getAttribute('role')).not.toBe('button');
      });
    });

    it('should open edit modal when clicking a cell', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText(/Add Shift\/Leave|Edit Shift/)).toBeInTheDocument();
        });
      }
    });

    it('should display shift type options in modal', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Shift Type')).toBeInTheDocument();
        });
      }
    });

    it('should display leave type options in modal', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Or Assign Leave')).toBeInTheDocument();
        });
      }
    });

    it('should close modal when clicking Cancel', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText(/Add Shift\/Leave|Edit Shift/)).toBeInTheDocument();
        });

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByText(/Add Shift\/Leave|Edit Shift/)).not.toBeInTheDocument();
        });
      }
    });

    it('should show Save button in modal', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Save')).toBeInTheDocument();
        });
      }
    });

    it('should show Delete button for existing shifts', async () => {
      const user = userEvent.setup();
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [{ id: 'user-1', name: 'John Doe', email: 'john@test.com' }],
        shifts: [
          {
            id: 'shift-1',
            user_id: 'user-1',
            date: new Date().toISOString().split('T')[0],
            shift_type: 'AM',
          },
        ],
        approvedLeaves: [],
        swappedUserNames: {},
        isLoading: false,
        createShift: { mutateAsync: mockCreateShift },
        updateShift: { mutateAsync: mockUpdateShift },
        deleteShift: { mutateAsync: mockDeleteShift },
        createLeave: { mutateAsync: mockCreateLeave },
        updateLeave: { mutateAsync: mockUpdateLeave },
        deleteLeave: { mutateAsync: mockDeleteLeave },
      });

      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Shift creation', () => {
    it('should create new shift when saving', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Save')).toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockCreateShift).toHaveBeenCalled();
        });
      }
    });

    it('should show saving state', async () => {
      const user = userEvent.setup();
      mockCreateShift.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Save')).toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        await waitFor(() => {
          expect(screen.getByText('Saving...')).toBeInTheDocument();
        });
      }
    });

    it('should handle save errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateShift.mockRejectedValue(new Error('Save failed'));

      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Save')).toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        });
      }

      consoleError.mockRestore();
    });
  });

  describe('Shift deletion', () => {
    it('should delete shift when clicking Delete button', async () => {
      const user = userEvent.setup();
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [{ id: 'user-1', name: 'John Doe', email: 'john@test.com' }],
        shifts: [
          {
            id: 'shift-1',
            user_id: 'user-1',
            date: new Date().toISOString().split('T')[0],
            shift_type: 'AM',
          },
        ],
        approvedLeaves: [],
        swappedUserNames: {},
        isLoading: false,
        createShift: { mutateAsync: mockCreateShift },
        updateShift: { mutateAsync: mockUpdateShift },
        deleteShift: { mutateAsync: mockDeleteShift },
        createLeave: { mutateAsync: mockCreateLeave },
        updateLeave: { mutateAsync: mockUpdateLeave },
        deleteLeave: { mutateAsync: mockDeleteLeave },
      });

      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);

        await waitFor(() => {
          expect(mockDeleteShift).toHaveBeenCalledWith('shift-1');
        });
      }
    });

    it('should handle delete errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteShift.mockRejectedValue(new Error('Delete failed'));

      const user = userEvent.setup();
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [{ id: 'user-1', name: 'John Doe', email: 'john@test.com' }],
        shifts: [
          {
            id: 'shift-1',
            user_id: 'user-1',
            date: new Date().toISOString().split('T')[0],
            shift_type: 'AM',
          },
        ],
        approvedLeaves: [],
        swappedUserNames: {},
        isLoading: false,
        createShift: { mutateAsync: mockCreateShift },
        updateShift: { mutateAsync: mockUpdateShift },
        deleteShift: { mutateAsync: mockDeleteShift },
        createLeave: { mutateAsync: mockCreateLeave },
        updateLeave: { mutateAsync: mockUpdateLeave },
        deleteLeave: { mutateAsync: mockDeleteLeave },
      });

      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalled();
        });
      }

      consoleError.mockRestore();
    });
  });

  describe('Leave management', () => {
    it('should display leave in calendar', () => {
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [{ id: 'user-1', name: 'John Doe', email: 'john@test.com' }],
        shifts: [],
        approvedLeaves: [
          {
            id: 'leave-1',
            user_id: 'user-1',
            leave_type: 'annual',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            status: 'approved',
          },
        ],
        swappedUserNames: {},
        isLoading: false,
        createShift: { mutateAsync: mockCreateShift },
        updateShift: { mutateAsync: mockUpdateShift },
        deleteShift: { mutateAsync: mockDeleteShift },
        createLeave: { mutateAsync: mockCreateLeave },
        updateLeave: { mutateAsync: mockUpdateLeave },
        deleteLeave: { mutateAsync: mockDeleteLeave },
      });

      renderSchedule();

      // Leave should be displayed in the calendar
      const leaveElements = screen.getAllByText('Annual Leave');
      expect(leaveElements.length).toBeGreaterThan(0);
    });

    it('should create leave when selecting leave type', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Or Assign Leave')).toBeInTheDocument();
        });

        // Find and click a leave type button
        const leaveButtons = screen.getAllByRole('button');
        const annualLeaveButton = leaveButtons.find((btn) =>
          btn.textContent?.includes('Annual Leave')
        );

        if (annualLeaveButton) {
          await user.click(annualLeaveButton);

          const saveButton = screen.getByText('Save');
          await user.click(saveButton);

          await waitFor(() => {
            expect(mockCreateLeave).toHaveBeenCalled();
          });
        }
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      renderSchedule();
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderSchedule();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Schedule');
    });

    it('should have keyboard navigation support for cells', async () => {
      const user = userEvent.setup();
      renderSchedule();

      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');
      if (cells.length > 0) {
        cells[0].focus();
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(screen.getByText(/Add Shift\/Leave|Edit Shift/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty users list', () => {
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [],
        shifts: [],
        approvedLeaves: [],
        swappedUserNames: {},
        isLoading: false,
        createShift: { mutateAsync: mockCreateShift },
        updateShift: { mutateAsync: mockUpdateShift },
        deleteShift: { mutateAsync: mockDeleteShift },
        createLeave: { mutateAsync: mockCreateLeave },
        updateLeave: { mutateAsync: mockUpdateLeave },
        deleteLeave: { mutateAsync: mockDeleteLeave },
      });

      renderSchedule();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    it('should handle swapped shifts', () => {
      vi.mocked(useScheduleModule.useSchedule).mockReturnValue({
        users: [{ id: 'user-1', name: 'John Doe', email: 'john@test.com' }],
        shifts: [
          {
            id: 'shift-1',
            user_id: 'user-1',
            date: new Date().toISOString().split('T')[0],
            shift_type: 'AM',
            swapped_with_user_id: 'user-2',
          },
        ],
        approvedLeaves: [],
        swappedUserNames: { 'user-2': 'Jane Smith' },
        isLoading: false,
        createShift: { mutateAsync: mockCreateShift },
        updateShift: { mutateAsync: mockUpdateShift },
        deleteShift: { mutateAsync: mockDeleteShift },
        createLeave: { mutateAsync: mockCreateLeave },
        updateLeave: { mutateAsync: mockUpdateLeave },
        deleteLeave: { mutateAsync: mockDeleteLeave },
      });

      renderSchedule();

      // Should show swap indicator
      const swapIndicator = screen.getByText('Jane');
      expect(swapIndicator).toBeInTheDocument();
    });
  });
});
