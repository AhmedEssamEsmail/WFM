import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Schedule from '../../pages/Schedule/Schedule';
import { AuthContext } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import type { User } from '../../types';

// Mock the useSchedule hook
vi.mock('../../hooks/useSchedule', () => ({
  useSchedule: vi.fn(() => ({
    users: [
      { id: 'user-1', name: 'John Doe', email: 'john@test.com' },
      { id: 'user-2', name: 'Jane Smith', email: 'jane@test.com' },
    ],
    shifts: [
      {
        id: 'shift-1',
        user_id: 'user-1',
        date: '2024-02-15',
        shift_type: 'AM',
      },
    ],
    approvedLeaves: [],
    swappedUserNames: {},
    isLoading: false,
    createShift: { mutateAsync: vi.fn() },
    updateShift: { mutateAsync: vi.fn() },
    deleteShift: { mutateAsync: vi.fn() },
    createLeave: { mutateAsync: vi.fn() },
    updateLeave: { mutateAsync: vi.fn() },
    deleteLeave: { mutateAsync: vi.fn() },
  })),
}));

// Mock the useLeaveTypes hook
vi.mock('../../hooks/useLeaveTypes', () => ({
  useLeaveTypes: vi.fn(() => ({
    leaveTypes: [
      { id: 'lt-1', code: 'AL', label: 'Annual Leave', color: '#FEF3C7', is_active: true },
      { id: 'lt-2', code: 'SL', label: 'Sick Leave', color: '#FEE2E2', is_active: true },
    ],
    isLoading: false,
  })),
}));

// Mock the useSkills hook for SkillsFilter
vi.mock('../../hooks/useSkills', () => ({
  useSkills: vi.fn(() => ({
    skills: [
      { id: 'skill-1', name: 'JavaScript', color: '#F59E0B' },
      { id: 'skill-2', name: 'TypeScript', color: '#3B82F6' },
    ],
    isLoading: false,
  })),
}));

describe('Schedule Module Components', () => {
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

  describe('Calendar rendering', () => {
    it('should render page title', () => {
      renderSchedule();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    it('should render calendar with month and year', () => {
      renderSchedule();

      // Should show current month and year (e.g., "February 2024")
      const monthYearRegex = /\w+ \d{4}/;
      expect(screen.getByText(monthYearRegex)).toBeInTheDocument();
    });

    it('should render calendar grid with days of the month', () => {
      renderSchedule();

      // Should have table headers for days
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have Name column
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should render user rows in calendar', () => {
      renderSchedule();

      // Use getAllByText since the name appears in both the table and the filter dropdown
      const johnDoeElements = screen.getAllByText('John Doe');
      expect(johnDoeElements.length).toBeGreaterThan(0);

      const janeSmithElements = screen.getAllByText('Jane Smith');
      expect(janeSmithElements.length).toBeGreaterThan(0);
    });

    it('should render legend with shift types', () => {
      renderSchedule();

      expect(screen.getByText('Legend')).toBeInTheDocument();
      expect(screen.getByText('Shifts')).toBeInTheDocument();

      // Check for shift type labels
      expect(screen.getByText('AM')).toBeInTheDocument();
      expect(screen.getByText('PM')).toBeInTheDocument();
      expect(screen.getByText('BET')).toBeInTheDocument();
      expect(screen.getByText('OFF')).toBeInTheDocument();
    });

    it('should render legend with leave types', () => {
      renderSchedule();

      expect(screen.getByText('Leave Types')).toBeInTheDocument();
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
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

    it('should navigate to previous month when clicking previous button', async () => {
      const user = userEvent.setup();
      renderSchedule();

      // Get initial month
      const initialMonth = screen.getByText(/\w+ \d{4}/).textContent;

      // Click previous button
      const prevButtons = screen.getAllByRole('button');
      const prevButton = prevButtons.find((btn) =>
        btn.querySelector('svg path[d*="M15 19l-7-7 7-7"]')
      );

      if (prevButton) {
        await user.click(prevButton);

        // Month should change
        await waitFor(() => {
          const newMonth = screen.getByText(/\w+ \d{4}/).textContent;
          expect(newMonth).not.toBe(initialMonth);
        });
      }
    });

    it('should navigate to next month when clicking next button', async () => {
      const user = userEvent.setup();
      renderSchedule();

      // Get initial month
      const initialMonth = screen.getByText(/\w+ \d{4}/).textContent;

      // Click next button
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find((btn) =>
        btn.querySelector('svg path[d*="M9 5l7 7-7 7"]')
      );

      if (nextButton) {
        await user.click(nextButton);

        // Month should change
        await waitFor(() => {
          const newMonth = screen.getByText(/\w+ \d{4}/).textContent;
          expect(newMonth).not.toBe(initialMonth);
        });
      }
    });
  });

  describe('Date selection functionality', () => {
    it('should allow WFM users to click on calendar cells', () => {
      renderSchedule(mockUser);

      // Find calendar cells (td elements with role="button")
      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');

      expect(cells.length).toBeGreaterThan(0);
    });

    it('should not allow agent users to click on calendar cells', () => {
      const agentUser = { ...mockUser, role: 'agent' as const };
      renderSchedule(agentUser);

      // Calendar cells should not have role="button" for agents
      const table = screen.getByRole('table');
      const cells = table.querySelectorAll('td');

      cells.forEach((cell) => {
        expect(cell.getAttribute('role')).not.toBe('button');
      });
    });

    it('should open edit modal when WFM user clicks on a cell', async () => {
      const user = userEvent.setup();
      renderSchedule(mockUser);

      // Find a calendar cell and click it
      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');

      if (cells.length > 0) {
        await user.click(cells[0]);

        // Modal should appear
        await waitFor(() => {
          expect(screen.getByText(/Add Shift\/Leave|Edit Shift/)).toBeInTheDocument();
        });
      }
    });

    it('should display shift type options in edit modal', async () => {
      const user = userEvent.setup();
      renderSchedule(mockUser);

      // Click a cell to open modal
      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');

      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Shift Type')).toBeInTheDocument();
        });
      }
    });

    it('should display leave type options in edit modal', async () => {
      const user = userEvent.setup();
      renderSchedule(mockUser);

      // Click a cell to open modal
      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');

      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText('Or Assign Leave')).toBeInTheDocument();
        });
      }
    });

    it('should close modal when clicking Cancel button', async () => {
      const user = userEvent.setup();
      renderSchedule(mockUser);

      // Click a cell to open modal
      const cells = screen.getAllByRole('button').filter((el) => el.tagName === 'TD');

      if (cells.length > 0) {
        await user.click(cells[0]);

        await waitFor(() => {
          expect(screen.getByText(/Add Shift\/Leave|Edit Shift/)).toBeInTheDocument();
        });

        // Click Cancel
        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        // Modal should close
        await waitFor(() => {
          expect(screen.queryByText(/Add Shift\/Leave|Edit Shift/)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Skills filter', () => {
    it('should render skills filter for WFM users', () => {
      renderSchedule(mockUser);

      expect(screen.getByText('Filter by Skills')).toBeInTheDocument();
    });

    it('should not render skills filter for agent users', () => {
      const agentUser = { ...mockUser, role: 'agent' as const };
      renderSchedule(agentUser);

      expect(screen.queryByText('Filter by Skills')).not.toBeInTheDocument();
    });

    it('should render agent filter for WFM users', () => {
      renderSchedule(mockUser);

      expect(screen.getByText('Filter by Agent')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Agent')).toBeInTheDocument();
    });
  });
});
