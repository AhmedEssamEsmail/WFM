import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmployeeCard from '../../../components/Headcount/EmployeeCard';
import type { HeadcountUser } from '../../../types';

vi.mock('../../../components/Skills/SkillsBadges', () => ({
  default: ({ skills }: any) => (
    <div data-testid="skills-badges">
      {skills.map((skill: any) => (
        <span key={skill.id}>{skill.name}</span>
      ))}
    </div>
  ),
}));

describe('EmployeeCard - Comprehensive Coverage', () => {
  const mockEmployee: HeadcountUser = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'agent',
    department: 'Sales',
    status: 'active',
    job_title: 'Sales Agent',
    location: 'New York',
    created_at: '2024-01-01',
    assigned_skills: [
      {
        id: 'skill1',
        name: 'Sales',
        description: null,
        color: '#blue',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 'skill2',
        name: 'Support',
        description: null,
        color: '#green',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
  };

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render employee name', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render employee email', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should render employee role', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('Agent')).toBeInTheDocument();
    });

    it('should render employee department', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      const departments = screen.getAllByText('Sales');
      expect(departments.length).toBeGreaterThan(0);
    });

    it('should render employee status', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should render employee job title', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('Sales Agent')).toBeInTheDocument();
    });

    it('should render employee location', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
  });

  describe('Avatar Initials', () => {
    it('should display initials for two-word name', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display initials for single-word name', () => {
      const employee = { ...mockEmployee, name: 'John' };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display first two initials for three-word name', () => {
      const employee = { ...mockEmployee, name: 'John Michael Doe' };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should display uppercase initials', () => {
      const employee = { ...mockEmployee, name: 'john doe' };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Status Badge Colors', () => {
    it('should apply green color for active status', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      const statusBadge = screen.getByText('active');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply gray color for inactive status', () => {
      const employee = { ...mockEmployee, status: 'inactive' as const };
      render(<EmployeeCard employee={employee} />);
      const statusBadge = screen.getByText('inactive');
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should apply yellow color for on_leave status', () => {
      const employee = { ...mockEmployee, status: 'on_leave' as const };
      render(<EmployeeCard employee={employee} />);
      const statusBadge = screen.getByText('on leave');
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply red color for terminated status', () => {
      const employee = { ...mockEmployee, status: 'terminated' as const };
      render(<EmployeeCard employee={employee} />);
      const statusBadge = screen.getByText('terminated');
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should apply orange color for suspended status', () => {
      const employee = { ...mockEmployee, status: 'suspended' as const };
      render(<EmployeeCard employee={employee} />);
      const statusBadge = screen.getByText('suspended');
      expect(statusBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  describe('Role Labels', () => {
    it('should display "Agent" for agent role', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByText('Agent')).toBeInTheDocument();
    });

    it('should display "Team Lead" for tl role', () => {
      const employee = { ...mockEmployee, role: 'tl' as const };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('Team Lead')).toBeInTheDocument();
    });

    it('should display "WFM" for wfm role', () => {
      const employee = { ...mockEmployee, role: 'wfm' as const };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('WFM')).toBeInTheDocument();
    });
  });

  describe('Skills Display', () => {
    it('should render skills badges when employee has skills', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByTestId('skills-badges')).toBeInTheDocument();
      const skillsBadges = screen.getByTestId('skills-badges');
      expect(skillsBadges).toHaveTextContent('Sales');
      expect(skillsBadges).toHaveTextContent('Support');
    });

    it('should not render skills section when employee has no skills', () => {
      const employee = { ...mockEmployee, assigned_skills: undefined };
      render(<EmployeeCard employee={employee} />);
      expect(screen.queryByTestId('skills-badges')).not.toBeInTheDocument();
    });

    it('should not render skills section when skills array is empty', () => {
      const employee = { ...mockEmployee, assigned_skills: [] };
      render(<EmployeeCard employee={employee} />);
      expect(screen.queryByTestId('skills-badges')).not.toBeInTheDocument();
    });
  });

  describe('Edit Button', () => {
    it('should render edit button when canEdit is true and onEdit is provided', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={true} onEdit={mockOnEdit} />);
      const editButton = screen.getByTitle('Edit employee');
      expect(editButton).toBeInTheDocument();
    });

    it('should not render edit button when canEdit is false', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={false} onEdit={mockOnEdit} />);
      expect(screen.queryByTitle('Edit employee')).not.toBeInTheDocument();
    });

    it('should not render edit button when onEdit is not provided', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={true} />);
      expect(screen.queryByTitle('Edit employee')).not.toBeInTheDocument();
    });

    it('should call onEdit with employee when edit button is clicked', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={true} onEdit={mockOnEdit} />);
      const editButton = screen.getByTitle('Edit employee');
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(mockEmployee);
    });
  });

  describe('Delete Button', () => {
    it('should always render delete button', () => {
      render(<EmployeeCard employee={mockEmployee} />);
      expect(screen.getByTitle('Delete employee')).toBeInTheDocument();
    });

    it('should render delete button even when canEdit is false', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={false} />);
      expect(screen.getByTitle('Delete employee')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('should display "Unassigned" when department is missing', () => {
      const employee = { ...mockEmployee, department: undefined };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should display "Unassigned" when department is empty string', () => {
      const employee = { ...mockEmployee, department: '' };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should not render job title tag when job_title is missing', () => {
      const employee = { ...mockEmployee, job_title: undefined };
      render(<EmployeeCard employee={employee} />);
      expect(screen.queryByText('Sales Agent')).not.toBeInTheDocument();
    });

    it('should not render location tag when location is missing', () => {
      const employee = { ...mockEmployee, location: undefined };
      render(<EmployeeCard employee={employee} />);
      expect(screen.queryByText('New York')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should apply hover shadow effect', () => {
      const { container } = render(<EmployeeCard employee={mockEmployee} />);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('should have proper border and background', () => {
      const { container } = render(<EmployeeCard employee={mockEmployee} />);
      const card = container.firstChild;
      expect(card).toHaveClass('border', 'border-gray-200', 'bg-white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<EmployeeCard employee={mockEmployee} />);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-lg');
    });
  });

  describe('Text Truncation', () => {
    it('should truncate long employee names', () => {
      const employee = {
        ...mockEmployee,
        name: 'Very Long Employee Name That Should Be Truncated',
      };
      render(<EmployeeCard employee={employee} />);
      const nameElement = screen.getByText('Very Long Employee Name That Should Be Truncated');
      expect(nameElement).toHaveClass('truncate');
    });

    it('should truncate long email addresses', () => {
      const employee = { ...mockEmployee, email: 'verylongemailaddress@example.com' };
      render(<EmployeeCard employee={employee} />);
      const emailElement = screen.getByText('verylongemailaddress@example.com');
      expect(emailElement).toHaveClass('truncate');
    });

    it('should truncate long job titles', () => {
      const employee = {
        ...mockEmployee,
        job_title: 'Very Long Job Title That Should Be Truncated',
      };
      render(<EmployeeCard employee={employee} />);
      const titleElement = screen.getByText('Very Long Job Title That Should Be Truncated');
      expect(titleElement).toHaveClass('truncate');
    });

    it('should truncate long locations', () => {
      const employee = {
        ...mockEmployee,
        location: 'Very Long Location Name That Should Be Truncated',
      };
      render(<EmployeeCard employee={employee} />);
      const locationElement = screen.getByText('Very Long Location Name That Should Be Truncated');
      expect(locationElement).toHaveClass('truncate');
    });
  });

  describe('Edge Cases', () => {
    it('should handle employee with all optional fields missing', () => {
      const minimalEmployee: HeadcountUser = {
        id: 'user2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'agent',
        status: 'active',
        created_at: '2024-01-01',
      };

      render(<EmployeeCard employee={minimalEmployee} />);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle employee with null values', () => {
      const employee: HeadcountUser = {
        ...mockEmployee,
        department: null as any,
        job_title: null as any,
        location: null as any,
      };

      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle status with underscores correctly', () => {
      const employee = { ...mockEmployee, status: 'on_leave' as const };
      render(<EmployeeCard employee={employee} />);
      expect(screen.getByText('on leave')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles for screen readers', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={true} onEdit={mockOnEdit} />);
      expect(screen.getByTitle('Edit employee')).toBeInTheDocument();
      expect(screen.getByTitle('Delete employee')).toBeInTheDocument();
    });

    it('should have proper hover states on buttons', () => {
      render(<EmployeeCard employee={mockEmployee} canEdit={true} onEdit={mockOnEdit} />);
      const editButton = screen.getByTitle('Edit employee');
      expect(editButton).toHaveClass('hover:bg-gray-100', 'hover:text-gray-600');
    });
  });
});
