import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeCard from '../../../../components/Headcount/EmployeeCard';
import type { HeadcountUser } from '../../../../types';

vi.mock('../../../../components/Skills/SkillsBadges', () => ({
  default: ({ skills }: any) => (
    <div data-testid="skills-badges">
      {skills.map((skill: any) => (
        <span key={skill.id}>{skill.name}</span>
      ))}
    </div>
  ),
}));

/**
 * Comprehensive tests for EmployeeCard component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.3, CR-2.1.4, PR-4.3.1
 */
describe('EmployeeCard Component', () => {
  const mockEmployee: HeadcountUser = {
    id: 'emp-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'agent',
    department: 'Support',
    job_title: 'Senior Agent',
    status: 'active',
    location: 'New York',
    phone: '555-1234',
    assigned_skills: [
      { id: 'skill-1', name: 'Customer Service', description: null, created_at: '' },
      { id: 'skill-2', name: 'Technical Support', description: null, created_at: '' },
    ],
    employee_id: 'EMP001',
    hire_date: '2023-01-01',
    manager_id: null,
    manager_name: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const defaultProps = {
    employee: mockEmployee,
    onEdit: vi.fn(),
    canEdit: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render employee card', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render employee name', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render employee email', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should render employee role', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('Agent')).toBeInTheDocument();
    });

    it('should render employee department', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('Support')).toBeInTheDocument();
    });

    it('should render employee status', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should render employee job title', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('Senior Agent')).toBeInTheDocument();
    });

    it('should render employee location', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    it('should render employee initials', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render skills badges when employee has skills', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByTestId('skills-badges')).toBeInTheDocument();
      expect(screen.getByText('Customer Service')).toBeInTheDocument();
      expect(screen.getByText('Technical Support')).toBeInTheDocument();
    });
  });

  describe('Initials Generation', () => {
    it('should generate initials from first and last name', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should generate initials from single name', () => {
      const employee = { ...mockEmployee, name: 'John' };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should generate initials from three names', () => {
      const employee = { ...mockEmployee, name: 'John Michael Doe' };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should uppercase initials', () => {
      const employee = { ...mockEmployee, name: 'john doe' };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should limit initials to 2 characters', () => {
      const employee = { ...mockEmployee, name: 'John Michael David Smith' };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      const initials = screen.getByText(/^[A-Z]{2}$/);
      expect(initials).toBeInTheDocument();
    });
  });

  describe('Role Labels', () => {
    it('should display Agent for agent role', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, role: 'agent' }} />);
      expect(screen.getByText('Agent')).toBeInTheDocument();
    });

    it('should display Team Lead for tl role', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, role: 'tl' }} />);
      expect(screen.getByText('Team Lead')).toBeInTheDocument();
    });

    it('should display WFM for wfm role', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, role: 'wfm' }} />);
      expect(screen.getByText('WFM')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply green color for active status', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, status: 'active' }} />);
      const statusBadge = screen.getByText('active');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply gray color for inactive status', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, status: 'inactive' }} />);
      const statusBadge = screen.getByText('inactive');
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should apply yellow color for on_leave status', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, status: 'on_leave' }} />);
      const statusBadge = screen.getByText('on leave');
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should apply red color for terminated status', () => {
      render(
        <EmployeeCard {...defaultProps} employee={{ ...mockEmployee, status: 'terminated' }} />
      );
      const statusBadge = screen.getByText('terminated');
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should apply orange color for suspended status', () => {
      render(
        <EmployeeCard {...defaultProps} employee={{ ...mockEmployee, status: 'suspended' }} />
      );
      const statusBadge = screen.getByText('suspended');
      expect(statusBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  describe('Status Display', () => {
    it('should replace underscores with spaces in status', () => {
      render(<EmployeeCard {...defaultProps} employee={{ ...mockEmployee, status: 'on_leave' }} />);
      expect(screen.getByText('on leave')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('should display Unassigned when department is null', () => {
      const employee = { ...mockEmployee, department: null };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should display Unassigned when department is empty', () => {
      const employee = { ...mockEmployee, department: '' };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should not render job title tag when job_title is null', () => {
      const employee = { ...mockEmployee, job_title: null };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.queryByText('Senior Agent')).not.toBeInTheDocument();
    });

    it('should not render location tag when location is null', () => {
      const employee = { ...mockEmployee, location: null };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.queryByText('New York')).not.toBeInTheDocument();
    });

    it('should not render skills section when assigned_skills is null', () => {
      const employee = { ...mockEmployee, assigned_skills: null };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.queryByTestId('skills-badges')).not.toBeInTheDocument();
    });

    it('should not render skills section when assigned_skills is empty', () => {
      const employee = { ...mockEmployee, assigned_skills: [] };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.queryByTestId('skills-badges')).not.toBeInTheDocument();
    });
  });

  describe('Edit Button', () => {
    it('should render edit button when canEdit is true and onEdit is provided', () => {
      render(<EmployeeCard {...defaultProps} canEdit={true} />);
      const editButton = screen.getByTitle('Edit employee');
      expect(editButton).toBeInTheDocument();
    });

    it('should not render edit button when canEdit is false', () => {
      render(<EmployeeCard {...defaultProps} canEdit={false} />);
      const editButton = screen.queryByTitle('Edit employee');
      expect(editButton).not.toBeInTheDocument();
    });

    it('should not render edit button when onEdit is not provided', () => {
      render(<EmployeeCard {...defaultProps} onEdit={undefined} />);
      const editButton = screen.queryByTitle('Edit employee');
      expect(editButton).not.toBeInTheDocument();
    });

    it('should call onEdit with employee when edit button is clicked', () => {
      const onEdit = vi.fn();
      render(<EmployeeCard {...defaultProps} onEdit={onEdit} />);

      const editButton = screen.getByTitle('Edit employee');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockEmployee);
    });

    it('should call onEdit only once per click', () => {
      const onEdit = vi.fn();
      render(<EmployeeCard {...defaultProps} onEdit={onEdit} />);

      const editButton = screen.getByTitle('Edit employee');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Button', () => {
    it('should always render delete button', () => {
      render(<EmployeeCard {...defaultProps} />);
      const deleteButton = screen.getByTitle('Delete employee');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should render delete button even when canEdit is false', () => {
      render(<EmployeeCard {...defaultProps} canEdit={false} />);
      const deleteButton = screen.getByTitle('Delete employee');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should render delete button even when onEdit is not provided', () => {
      render(<EmployeeCard {...defaultProps} onEdit={undefined} />);
      const deleteButton = screen.getByTitle('Delete employee');
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have hover shadow effect', () => {
      const { container } = render(<EmployeeCard {...defaultProps} />);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('should have border and rounded corners', () => {
      const { container } = render(<EmployeeCard {...defaultProps} />);
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-lg', 'border', 'border-gray-200');
    });

    it('should position status badge in top right', () => {
      render(<EmployeeCard {...defaultProps} />);
      const statusBadge = screen.getByText('active').closest('div');
      expect(statusBadge).toHaveClass('absolute', 'right-4', 'top-4');
    });

    it('should position action buttons in bottom right', () => {
      render(<EmployeeCard {...defaultProps} />);
      const deleteButton = screen.getByTitle('Delete employee').closest('div');
      expect(deleteButton).toHaveClass('absolute', 'bottom-4', 'right-4');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button titles', () => {
      render(<EmployeeCard {...defaultProps} />);
      expect(screen.getByTitle('Edit employee')).toBeInTheDocument();
      expect(screen.getByTitle('Delete employee')).toBeInTheDocument();
    });

    it('should have proper button hover states', () => {
      render(<EmployeeCard {...defaultProps} />);
      const editButton = screen.getByTitle('Edit employee');
      expect(editButton).toHaveClass('hover:bg-gray-100', 'hover:text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      const employee = {
        ...mockEmployee,
        name: 'John Michael Christopher Alexander Benjamin',
      };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText(/John Michael Christopher/)).toBeInTheDocument();
    });

    it('should handle very long emails', () => {
      const employee = {
        ...mockEmployee,
        email: 'verylongemailaddress@verylongdomainname.com',
      };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByText('verylongemailaddress@verylongdomainname.com')).toBeInTheDocument();
    });

    it('should handle very long department names', () => {
      const employee = {
        ...mockEmployee,
        department: 'Customer Support and Technical Services Department',
      };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(
        screen.getByText('Customer Support and Technical Services Department')
      ).toBeInTheDocument();
    });

    it('should handle employee with all optional fields null', () => {
      const minimalEmployee = {
        ...mockEmployee,
        department: null,
        job_title: null,
        location: null,
        phone: null,
        assigned_skills: null,
      };
      render(<EmployeeCard {...defaultProps} employee={minimalEmployee} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle multiple rapid edit clicks', () => {
      const onEdit = vi.fn();
      render(<EmployeeCard {...defaultProps} onEdit={onEdit} />);

      const editButton = screen.getByTitle('Edit employee');
      fireEvent.click(editButton);
      fireEvent.click(editButton);
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(3);
    });

    it('should handle employee with many skills', () => {
      const employee = {
        ...mockEmployee,
        assigned_skills: [
          { id: '1', name: 'Skill 1', description: null, created_at: '' },
          { id: '2', name: 'Skill 2', description: null, created_at: '' },
          { id: '3', name: 'Skill 3', description: null, created_at: '' },
          { id: '4', name: 'Skill 4', description: null, created_at: '' },
          { id: '5', name: 'Skill 5', description: null, created_at: '' },
        ],
      };
      render(<EmployeeCard {...defaultProps} employee={employee} />);
      expect(screen.getByTestId('skills-badges')).toBeInTheDocument();
    });
  });
});
