import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditEmployeeModal from '../../../components/Headcount/EditEmployeeModal';
import { skillsService } from '../../../services';
import type { HeadcountUser } from '../../../types';

vi.mock('../../../services', () => ({
  skillsService: {
    assignSkillsToUser: vi.fn(),
  },
}));

vi.mock('../../../components/Skills/SkillsMultiSelect', () => ({
  default: ({ selectedSkillIds, onChange, label, placeholder }: any) => (
    <div data-testid="skills-multiselect">
      <label>{label}</label>
      <input
        placeholder={placeholder}
        value={selectedSkillIds.join(',')}
        onChange={(e) => onChange(e.target.value.split(',').filter(Boolean))}
      />
    </div>
  ),
}));

describe('EditEmployeeModal - Comprehensive Coverage', () => {
  const mockEmployee: HeadcountUser = {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'agent',
    department: 'Sales',
    status: 'active',
    job_title: 'Sales Agent',
    location: 'New York',
    phone: '555-0100',
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

  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when employee is null', () => {
      const { container } = render(
        <EditEmployeeModal
          employee={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true and employee exists', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('should populate all form fields with employee data', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Agent' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sales')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sales Agent')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-0100')).toBeInTheDocument();
    });

    it('should load employee skills into multiselect', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const skillsInput = screen.getByPlaceholderText('Select skills for this employee...');
      expect(skillsInput).toHaveValue('skill1,skill2');
    });
  });

  describe('Form Interactions', () => {
    it('should update name field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      expect(nameInput).toHaveValue('Jane Smith');
    });

    it('should update email field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const emailInput = screen.getByDisplayValue('john@example.com');
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

      expect(emailInput).toHaveValue('jane@example.com');
    });

    it('should update role field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const roleSelect = selects[0]; // First select is role
      fireEvent.change(roleSelect, { target: { value: 'tl' } });

      expect(roleSelect).toHaveValue('tl');
    });

    it('should update department field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deptInput = screen.getByDisplayValue('Sales');
      fireEvent.change(deptInput, { target: { value: 'Support' } });

      expect(deptInput).toHaveValue('Support');
    });

    it('should update job title field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const titleInput = screen.getByDisplayValue('Sales Agent');
      fireEvent.change(titleInput, { target: { value: 'Senior Agent' } });

      expect(titleInput).toHaveValue('Senior Agent');
    });

    it('should update status field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const statusSelect = selects[1]; // Second select is status
      fireEvent.change(statusSelect, { target: { value: 'on_leave' } });

      expect(statusSelect).toHaveValue('on_leave');
    });

    it('should update location field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const locationInput = screen.getByDisplayValue('New York');
      fireEvent.change(locationInput, { target: { value: 'Los Angeles' } });

      expect(locationInput).toHaveValue('Los Angeles');
    });

    it('should update phone field', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const phoneInput = screen.getByDisplayValue('555-0100');
      fireEvent.change(phoneInput, { target: { value: '555-0200' } });

      expect(phoneInput).toHaveValue('555-0200');
    });

    it('should update skills selection', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const skillsInput = screen.getByPlaceholderText('Select skills for this employee...');
      fireEvent.change(skillsInput, { target: { value: 'skill1,skill3' } });

      expect(skillsInput).toHaveValue('skill1,skill3');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with updated data on submit', async () => {
      mockOnSave.mockResolvedValue(undefined);
      vi.mocked(skillsService.assignSkillsToUser).mockResolvedValue(undefined);

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Smith',
          })
        );
      });
    });

    it('should call assignSkillsToUser with selected skills', async () => {
      mockOnSave.mockResolvedValue(undefined);
      vi.mocked(skillsService.assignSkillsToUser).mockResolvedValue(undefined);

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const skillsInput = screen.getByPlaceholderText('Select skills for this employee...');
      fireEvent.change(skillsInput, { target: { value: 'skill1,skill3' } });

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(skillsService.assignSkillsToUser).toHaveBeenCalledWith('user1', [
          'skill1',
          'skill3',
        ]);
      });
    });

    it('should close modal after successful save', async () => {
      mockOnSave.mockResolvedValue(undefined);
      vi.mocked(skillsService.assignSkillsToUser).mockResolvedValue(undefined);

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show saving state during submission', async () => {
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      vi.mocked(skillsService.assignSkillsToUser).mockResolvedValue(undefined);

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      const form = submitButton.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('should disable buttons during save', async () => {
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      vi.mocked(skillsService.assignSkillsToUser).mockResolvedValue(undefined);

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const form = submitButton.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle save error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSave.mockRejectedValue(new Error('Save failed'));

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to save:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle skills assignment error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSave.mockResolvedValue(undefined);
      vi.mocked(skillsService.assignSkillsToUser).mockRejectedValue(
        new Error('Skills assignment failed')
      );

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should re-enable buttons after error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSave.mockRejectedValue(new Error('Save failed'));

      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      const form = submitButton.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByRole('button', { name: '' }).closest('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when cancel button is clicked', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when backdrop is clicked', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const backdrop = document.querySelector('.fixed.inset-0.bg-black');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle employee without assigned skills', () => {
      const employeeNoSkills = { ...mockEmployee, assigned_skills: undefined };

      render(
        <EditEmployeeModal
          employee={employeeNoSkills}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const skillsInput = screen.getByPlaceholderText('Select skills for this employee...');
      expect(skillsInput).toHaveValue('');
    });

    it('should handle employee with empty skills array', () => {
      const employeeNoSkills = { ...mockEmployee, assigned_skills: [] };

      render(
        <EditEmployeeModal
          employee={employeeNoSkills}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const skillsInput = screen.getByPlaceholderText('Select skills for this employee...');
      expect(skillsInput).toHaveValue('');
    });

    it('should handle employee with missing optional fields', () => {
      const minimalEmployee: HeadcountUser = {
        id: 'user2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'agent',
        status: 'active',
        created_at: '2024-01-01',
      };

      render(
        <EditEmployeeModal
          employee={minimalEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    });

    it('should reset form data when employee changes', () => {
      const { rerender } = render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();

      const newEmployee: HeadcountUser = {
        ...mockEmployee,
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      rerender(
        <EditEmployeeModal
          employee={newEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    });
  });

  describe('Role Options', () => {
    it('should display all role options', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('option', { name: 'Agent' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Team Lead' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'WFM' })).toBeInTheDocument();
    });
  });

  describe('Status Options', () => {
    it('should display all status options', () => {
      render(
        <EditEmployeeModal
          employee={mockEmployee}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'On Leave' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Terminated' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Suspended' })).toBeInTheDocument();
    });
  });
});
