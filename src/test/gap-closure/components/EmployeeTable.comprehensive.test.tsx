import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import EmployeeTable from '../../../components/Headcount/EmployeeTable';
import type { HeadcountUser } from '../../../types';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('EmployeeTable - Comprehensive Coverage', () => {
  const mockEmployees: HeadcountUser[] = [
    {
      id: 'user1',
      employee_id: 'EMP001',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'agent',
      department: 'Sales',
      status: 'active',
      manager_name: 'Jane Manager',
      created_at: '2024-01-01',
    },
    {
      id: 'user2',
      employee_id: 'EMP002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'tl',
      department: 'Support',
      status: 'on_leave',
      manager_name: 'Bob Director',
      created_at: '2024-01-02',
    },
    {
      id: 'user3',
      employee_id: 'EMP003',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'wfm',
      department: 'Operations',
      status: 'inactive',
      created_at: '2024-01-03',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={[]} loading={true} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render 5 skeleton rows', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={[]} loading={true} />);
      const skeletons = container.querySelectorAll('.animate-pulse > div');
      expect(skeletons).toHaveLength(5);
    });

    it('should not render table when loading', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} loading={true} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty message when no employees', () => {
      renderWithRouter(<EmployeeTable employees={[]} loading={false} />);
      expect(screen.getByText('No employees found matching your criteria.')).toBeInTheDocument();
    });

    it('should not render table when no employees', () => {
      renderWithRouter(<EmployeeTable employees={[]} loading={false} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Table Headers', () => {
    it('should render all table headers', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('should have proper header styling', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveClass('text-xs', 'font-medium', 'uppercase', 'text-gray-500');
      });
    });
  });

  describe('Employee Data Rendering', () => {
    it('should render all employees', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should render employee IDs', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('EMP001')).toBeInTheDocument();
      expect(screen.getByText('EMP002')).toBeInTheDocument();
      expect(screen.getByText('EMP003')).toBeInTheDocument();
    });

    it('should render employee emails', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should render departments', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
    });

    it('should render manager names', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.getByText('Bob Director')).toBeInTheDocument();
    });
  });

  describe('Avatar Rendering', () => {
    it('should render avatar with first letter of name', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const avatars = screen.getAllByText('J');
      expect(avatars.length).toBe(2); // John and Jane
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should render avatar with uppercase letter', () => {
      const employees = [{ ...mockEmployees[0], name: 'john doe' }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });
  });

  describe('Role Badges', () => {
    it('should render role badges with correct text', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('AGENT')).toBeInTheDocument();
      expect(screen.getByText('TL')).toBeInTheDocument();
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

  describe('Status Badges', () => {
    it('should render status badges with correct text', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('on leave')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });

    it('should apply green color for active status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const activeBadge = screen.getByText('active');
      expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply yellow color for on_leave status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const onLeaveBadge = screen.getByText('on leave');
      expect(onLeaveBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply gray color for inactive status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const inactiveBadge = screen.getByText('inactive');
      expect(inactiveBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should replace underscores with spaces in status', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByText('on leave')).toBeInTheDocument();
      expect(screen.queryByText('on_leave')).not.toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should render links to employee detail pages', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute('href', '/headcount/employees/user1');
      expect(links[1]).toHaveAttribute('href', '/headcount/employees/user2');
      expect(links[2]).toHaveAttribute('href', '/headcount/employees/user3');
    });
  });

  describe('Row Hover Effect', () => {
    it('should apply hover effect to rows', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        expect(row).toHaveClass('hover:bg-gray-50');
      });
    });
  });

  describe('Missing Data Handling', () => {
    it('should display "-" when employee_id is missing', () => {
      const employees = [{ ...mockEmployees[0], employee_id: undefined }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      const cells = screen.getAllByText('-');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should display "Unassigned" when department is missing', () => {
      const employees = [{ ...mockEmployees[0], department: undefined }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should display "-" when manager_name is missing', () => {
      const employees = [{ ...mockEmployees[2] }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      const cells = screen.getAllByText('-');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should display "Unassigned" when department is empty string', () => {
      const employees = [{ ...mockEmployees[0], department: '' }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });

  describe('Status Variations', () => {
    it('should handle terminated status', () => {
      const employees = [{ ...mockEmployees[0], status: 'terminated' as const }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      const badge = screen.getByText('terminated');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should handle suspended status', () => {
      const employees = [{ ...mockEmployees[0], status: 'suspended' as const }];
      renderWithRouter(<EmployeeTable employees={employees} />);
      const badge = screen.getByText('suspended');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  describe('Table Structure', () => {
    it('should have proper table structure', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(6);
      expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data rows
    });

    it('should have overflow-x-auto for responsive scrolling', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have min-w-full on table', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-full');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single employee', () => {
      renderWithRouter(<EmployeeTable employees={[mockEmployees[0]]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(2); // 1 header + 1 data row
    });

    it('should handle large number of employees', () => {
      const manyEmployees = Array.from({ length: 100 }, (_, i) => ({
        ...mockEmployees[0],
        id: `user${i}`,
        name: `Employee ${i}`,
        email: `employee${i}@example.com`,
      }));
      renderWithRouter(<EmployeeTable employees={manyEmployees} />);
      expect(screen.getAllByRole('row')).toHaveLength(101); // 1 header + 100 data rows
    });

    it('should handle employee with all optional fields missing', () => {
      const minimalEmployee: HeadcountUser = {
        id: 'user4',
        name: 'Minimal User',
        email: 'minimal@example.com',
        role: 'agent',
        status: 'active',
        created_at: '2024-01-01',
      };
      renderWithRouter(<EmployeeTable employees={[minimalEmployee]} />);
      expect(screen.getByText('Minimal User')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      const employeeWithNulls: HeadcountUser = {
        ...mockEmployees[0],
        department: null as any,
        manager_name: null as any,
        employee_id: null as any,
      };
      renderWithRouter(<EmployeeTable employees={[employeeWithNulls]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper cell padding', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const cells = container.querySelectorAll('td');
      cells.forEach((cell) => {
        expect(cell).toHaveClass('px-6', 'py-4');
      });
    });

    it('should have whitespace-nowrap on cells', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const cells = container.querySelectorAll('td');
      cells.forEach((cell) => {
        expect(cell).toHaveClass('whitespace-nowrap');
      });
    });

    it('should have proper header background', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const thead = container.querySelector('thead');
      expect(thead).toHaveClass('bg-gray-50');
    });

    it('should have proper body background', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const tbody = container.querySelector('tbody');
      expect(tbody).toHaveClass('bg-white');
    });

    it('should have dividers between rows', () => {
      const { container } = renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      const tbody = container.querySelector('tbody');
      expect(tbody).toHaveClass('divide-y', 'divide-gray-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic table structure', () => {
      renderWithRouter(<EmployeeTable employees={mockEmployees} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(6);
      expect(screen.getAllByRole('row')).toHaveLength(4);
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
