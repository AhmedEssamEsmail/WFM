import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeTable from '../../../../components/Headcount/EmployeeTable';
import type { HeadcountUser } from '../../../../types';

/**
 * Comprehensive tests for EmployeeTable component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.3, CR-2.1.4, PR-4.3.1
 */
describe('EmployeeTable Component', () => {
  const mockEmployees: HeadcountUser[] = [
    {
      id: 'emp-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'agent',
      department: 'Support',
      job_title: 'Senior Agent',
      status: 'active',
      location: 'New York',
      phone: '555-1234',
      assigned_skills: [],
      employee_id: 'EMP001',
      hire_date: '2023-01-01',
      manager_id: 'mgr-1',
      manager_name: 'Jane Manager',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: 'emp-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'tl',
      department: 'Sales',
      job_title: 'Team Lead',
      status: 'inactive',
      location: 'Boston',
      phone: '555-5678',
      assigned_skills: [],
      employee_id: 'EMP002',
      hire_date: '2023-02-01',
      manager_id: null,
      manager_name: null,
      created_at: '2023-02-01',
      updated_at: '2023-02-01',
    },
    {
      id: 'emp-3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'wfm',
      department: null,
      job_title: 'WFM Specialist',
      status: 'on_leave',
      location: 'Chicago',
      phone: '555-9999',
      assigned_skills: [],
      employee_id: null,
      hire_date: '2023-03-01',
      manager_id: 'mgr-2',
      manager_name: 'Tom Boss',
      created_at: '2023-03-01',
      updated_at: '2023-03-01',
    },
  ];

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with employees', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('should render all employee rows', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render employee emails', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should render employee IDs', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('EMP001')).toBeInTheDocument();
      expect(screen.getByText('EMP002')).toBeInTheDocument();
    });

    it('should render departments', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('should render manager names', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.getByText('Tom Boss')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      renderWithRouter(<EmployeeTable employees={[]} loading={true} />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render 5 skeleton rows', () => {
      renderWithRouter(<EmployeeTable employees={[]} loading={true} />);
      const skeletons = document.querySelectorAll('.animate-pulse > div');
      expect(skeletons).toHaveLength(5);
    });

    it('should not render table when loading', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} loading={true} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not render empty state when loading', () => {
      renderWithRouter(<EmployeeTable employees={[]} loading={true} />);
      expect(screen.queryByText(/no employees found/i)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no employees', () => {
      renderWithRouter(<EmployeeTable employees={[]} />);
      expect(screen.getByText('No employees found matching your criteria.')).toBeInTheDocument();
    });

    it('should not render table when no employees', () => {
      renderWithRouter(<EmployeeTable employees={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not render empty state when employees exist', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.queryByText(/no employees found/i)).not.toBeInTheDocument();
    });
  });

  describe('Employee Initials', () => {
    it('should display first letter of name as initial', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const initials = screen.getAllByText('J');
      expect(initials.length).toBeGreaterThan(0);
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should uppercase initials', () => {
      const employees = [
        {
          ...mockEmployees[0],
          name: 'john doe',
        },
      ];
      renderWithRouter(<EmployeeTable employees={employees} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });
  });

  describe('Role Display', () => {
    it('should display AGENT for agent role', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('AGENT')).toBeInTheDocument();
    });

    it('should display TL for tl role', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('TL')).toBeInTheDocument();
    });

    it('should display WFM for wfm role', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('WFM')).toBeInTheDocument();
    });

    it('should apply blue color for agent role', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const agentBadge = screen.getByText('AGENT');
      expect(agentBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should apply purple color for tl role', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const tlBadge = screen.getByText('TL');
      expect(tlBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('should apply indigo color for wfm role', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const wfmBadge = screen.getByText('WFM');
      expect(wfmBadge).toHaveClass('bg-indigo-100', 'text-indigo-800');
    });
  });

  describe('Status Display', () => {
    it('should display active status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should display inactive status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });

    it('should display on leave status with space', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('on leave')).toBeInTheDocument();
    });

    it('should apply green color for active status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const activeBadge = screen.getByText('active');
      expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply gray color for inactive status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const inactiveBadge = screen.getByText('inactive');
      expect(inactiveBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should apply yellow color for on_leave status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const onLeaveBadge = screen.getByText('on leave');
      expect(onLeaveBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply red color for terminated status', () => {
      const employees = [{ ...mockEmployees[0], status: 'terminated' as const }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      const terminatedBadge = screen.getByText('terminated');
      expect(terminatedBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should apply orange color for suspended status', () => {
      const employees = [{ ...mockEmployees[0], status: 'suspended' as const }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      const suspendedBadge = screen.getByText('suspended');
      expect(suspendedBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  describe('Optional Fields', () => {
    it('should display dash when employee_id is null', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const rows = screen.getAllByText('-');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should display Unassigned when department is null', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should display dash when manager_name is null', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const rows = screen.getAllByText('-');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe('Links', () => {
    it('should render links to employee detail pages', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(mockEmployees.length);
    });

    it('should link to correct employee detail page', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const link = screen.getByText('John Doe').closest('a');
      expect(link).toHaveAttribute('href', '/headcount/employees/emp-1');
    });

    it('should link all employees to their detail pages', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const johnLink = screen.getByText('John Doe').closest('a');
      const janeLink = screen.getByText('Jane Smith').closest('a');
      const bobLink = screen.getByText('Bob Wilson').closest('a');

      expect(johnLink).toHaveAttribute('href', '/headcount/employees/emp-1');
      expect(janeLink).toHaveAttribute('href', '/headcount/employees/emp-2');
      expect(bobLink).toHaveAttribute('href', '/headcount/employees/emp-3');
    });
  });

  describe('Table Styling', () => {
    it('should have hover effect on rows', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      dataRows.forEach((row) => {
        expect(row).toHaveClass('hover:bg-gray-50');
      });
    });

    it('should have proper table structure', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByRole('table')).toHaveClass('min-w-full');
    });

    it('should have proper header styling', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const thead = container.querySelector('thead');
      expect(thead).toHaveClass('bg-gray-50');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single employee', () => {
      renderWithRouter(<EmployeeTable employees={[mockEmployees[0]]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should handle many employees', () => {
      const manyEmployees = Array.from({ length: 50 }, (_, i) => ({
        ...mockEmployees[0],
        id: `emp-${i}`,
        name: `Employee ${i}`,
        email: `emp${i}@example.com`,
      }));
      renderWithRouter(<EmployeeTable employees={manyEmployees} />);
      expect(screen.getByText('Employee 0')).toBeInTheDocument();
      expect(screen.getByText('Employee 49')).toBeInTheDocument();
    });

    it('should handle employee with all null optional fields', () => {
      const minimalEmployee = {
        ...mockEmployees[0],
        employee_id: null,
        department: null,
        manager_name: null,
      };
      renderWithRouter(<EmployeeTable employees={[minimalEmployee]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle employee with empty string department', () => {
      const employee = { ...mockEmployees[0], department: '' };
      renderWithRouter(<EmployeeTable employees={[employee]} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle very long names', () => {
      const employee = {
        ...mockEmployees[0],
        name: 'John Michael Christopher Alexander Benjamin',
      };
      renderWithRouter(<EmployeeTable employees={[employee]} />);
      expect(screen.getByText(/John Michael Christopher/)).toBeInTheDocument();
    });

    it('should handle very long emails', () => {
      const employee = {
        ...mockEmployees[0],
        email: 'verylongemailaddress@verylongdomainname.com',
      };
      renderWithRouter(<EmployeeTable employees={[employee]} />);
      expect(screen.getByText('verylongemailaddress@verylongdomainname.com')).toBeInTheDocument();
    });

    it('should handle loading state with employees prop', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} loading={true} />);
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('should transition from loading to loaded', () => {
      const { rerender } = renderWithRouter(<EmployeeTable employees={[]} loading={true} />);
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      rerender(
        <BrowserRouter>
          <EmployeeTable employees={mockEmployees} loading={false} />
        </BrowserRouter>
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse').length).toBe(0);
    });

    it('should transition from loaded to empty', () => {
      const { rerender } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      rerender(
        <BrowserRouter>
          <EmployeeTable employees={[]} />
        </BrowserRouter>
      );
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('No employees found matching your criteria.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table semantics', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have proper column headers', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(6);
    });

    it('should have proper row structure', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(mockEmployees.length + 1); // +1 for header
    });

    it('should have accessible links', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});
