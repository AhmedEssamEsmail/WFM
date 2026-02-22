import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditEmployeeModal from '../../../../components/Headcount/EditEmployeeModal';
import { skillsService } from '../../../../services';
import type { HeadcountUser } from '../../../../types';

vi.mock('../../../../services', () => ({
  skillsService: {
    assignSkillsToUser: vi.fn(),
  },
}));

vi.mock('../../../../components/Skills/SkillsMultiSelect', () => ({
  default: ({ selectedSkillIds, onChange, label, placeholder }: any) => (
    <div data-testid="skills-multi-select">
      <label>{label}</label>
      <input
        data-testid="skills-input"
        placeholder={placeholder}
        value={selectedSkillIds.join(',')}
        onChange={(e) => onChange(e.target.value.split(',').filter(Boolean))}
      />
    </div>
  ),
}));

/**
 * Comprehensive tests for EditEmployeeModal component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.3, CR-2.1.4, PR-4.3.1
 */
describe('EditEmployeeModal Component', () => {
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
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<EditEmployeeModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
    });

    it('should not render when employee is null', () => {
      render(<EditEmployeeModal {...defaultProps} employee={null} />);
      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true and employee exists', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    });

    it('should render X button for closing', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find((btn) => btn.querySelector('svg'));
      expect(xButton).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Job Title')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('should render skills multi-select', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByTestId('skills-multi-select')).toBeInTheDocument();
    });

    it('should render Cancel and Save buttons', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Form Initialization', () => {
    it('should populate form with employee data', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument(); // Role option text
      expect(screen.getByDisplayValue('Support')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Agent')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument(); // Status option text
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
    });

    it('should populate skills from employee', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const skillsInput = screen.getByTestId('skills-input');
      expect(skillsInput).toHaveValue('skill-1,skill-2');
    });

    it('should handle employee with no skills', () => {
      const employeeNoSkills = { ...mockEmployee, assigned_skills: [] };
      render(<EditEmployeeModal {...defaultProps} employee={employeeNoSkills} />);
      const skillsInput = screen.getByTestId('skills-input');
      expect(skillsInput).toHaveValue('');
    });

    it('should handle employee with undefined skills', () => {
      const employeeNoSkills = { ...mockEmployee, assigned_skills: undefined };
      render(<EditEmployeeModal {...defaultProps} employee={employeeNoSkills} />);
      const skillsInput = screen.getByTestId('skills-input');
      expect(skillsInput).toHaveValue('');
    });

    it('should update form when employee prop changes', () => {
      const { rerender } = render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();

      const newEmployee = { ...mockEmployee, name: 'Jane Smith' };
      rerender(<EditEmployeeModal {...defaultProps} employee={newEmployee} />);
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Form Field Updates', () => {
    it('should update name field', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      expect(nameInput).toHaveValue('Jane Smith');
    });

    it('should update email field', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const emailInput = screen.getByDisplayValue('john@example.com');
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      expect(emailInput).toHaveValue('jane@example.com');
    });

    it('should update department field', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const deptInput = screen.getByDisplayValue('Support');
      fireEvent.change(deptInput, { target: { value: 'Sales' } });
      expect(deptInput).toHaveValue('Sales');
    });

    it('should update job title field', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const titleInput = screen.getByDisplayValue('Senior Agent');
      fireEvent.change(titleInput, { target: { value: 'Lead Agent' } });
      expect(titleInput).toHaveValue('Lead Agent');
    });

    it('should update location field', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const locationInput = screen.getByDisplayValue('New York');
      fireEvent.change(locationInput, { target: { value: 'Boston' } });
      expect(locationInput).toHaveValue('Boston');
    });

    it('should update phone field', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const phoneInput = screen.getByDisplayValue('555-1234');
      fireEvent.change(phoneInput, { target: { value: '555-9999' } });
      expect(phoneInput).toHaveValue('555-9999');
    });

    it('should update skills selection', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const skillsInput = screen.getByTestId('skills-input');
      fireEvent.change(skillsInput, { target: { value: 'skill-3,skill-4' } });
      expect(skillsInput).toHaveValue('skill-3,skill-4');
    });
  });

  describe('Role Selection', () => {
    it('should render role select with options', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByText('Team Lead')).toBeInTheDocument();
      expect(screen.getByText('WFM')).toBeInTheDocument();
    });
  });

  describe('Status Selection', () => {
    it('should render status select with all options', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('On Leave')).toBeInTheDocument();
      expect(screen.getByText('Terminated')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with updated data on submit', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Smith',
          })
        );
      });
    });

    it('should call assignSkillsToUser with selected skills', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const skillsInput = screen.getByTestId('skills-input');
      fireEvent.change(skillsInput, { target: { value: 'skill-3,skill-4' } });

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(skillsService.assignSkillsToUser).toHaveBeenCalledWith('emp-1', [
          'skill-3',
          'skill-4',
        ]);
      });
    });

    it('should close modal after successful save', async () => {
      const onClose = vi.fn();
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<EditEmployeeModal {...defaultProps} onClose={onClose} onSave={onSave} />);

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should show Saving... text while saving', async () => {
      let resolveSave: any;
      const onSave = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const saveButton = screen.getByText('Save Changes');
      const form = saveButton.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      if (resolveSave) resolveSave();
    });

    it('should disable buttons while saving', async () => {
      let resolveSave: any;
      const onSave = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const saveButton = screen.getByText('Save Changes');
      const form = saveButton.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        const savingButton = screen.getByText('Saving...') as HTMLButtonElement;
        expect(savingButton.disabled).toBe(true);
        const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
        expect(cancelButton.disabled).toBe(true);
      });

      if (resolveSave) resolveSave();
    });

    it('should handle save errors gracefully', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to save:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should re-enable buttons after save error', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      const saveButton = screen.getByText('Save Changes') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(false);

      consoleError.mockRestore();
    });

    it('should not close modal on save error', async () => {
      const onClose = vi.fn();
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<EditEmployeeModal {...defaultProps} onClose={onClose} onSave={onSave} />);

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      expect(onClose).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when X button is clicked', () => {
      const onClose = vi.fn();
      render(<EditEmployeeModal {...defaultProps} onClose={onClose} />);

      // Find the X button by its SVG path
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find((btn) => btn.querySelector('svg'));
      fireEvent.click(xButton!);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<EditEmployeeModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<EditEmployeeModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('.fixed.inset-0.bg-black');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside modal content', () => {
      const onClose = vi.fn();
      render(<EditEmployeeModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Edit Employee').closest('.relative');
      fireEvent.click(modalContent!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Required Fields', () => {
    it('should mark name as required', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toBeRequired();
    });

    it('should mark email as required', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const emailInput = screen.getByDisplayValue('john@example.com');
      expect(emailInput).toBeRequired();
    });

    it('should have required fields marked with asterisk', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const asterisks = document.querySelectorAll('.text-red-500');
      expect(asterisks.length).toBeGreaterThan(0);
    });

    it('should not mark department as required', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const deptInput = screen.getByDisplayValue('Support');
      expect(deptInput).not.toBeRequired();
    });

    it('should not mark job title as required', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const titleInput = screen.getByDisplayValue('Senior Agent');
      expect(titleInput).not.toBeRequired();
    });
  });

  describe('Edge Cases', () => {
    it('should handle employee with empty optional fields', () => {
      const minimalEmployee = {
        ...mockEmployee,
        department: '',
        job_title: '',
        location: '',
        phone: '',
      };
      render(<EditEmployeeModal {...defaultProps} employee={minimalEmployee} />);

      // Just verify the modal renders with empty fields
      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should handle rapid form changes', () => {
      render(<EditEmployeeModal {...defaultProps} />);
      const nameInput = screen.getByDisplayValue('John Doe');

      fireEvent.change(nameInput, { target: { value: 'Name 1' } });
      fireEvent.change(nameInput, { target: { value: 'Name 2' } });
      fireEvent.change(nameInput, { target: { value: 'Name 3' } });

      expect(nameInput).toHaveValue('Name 3');
    });

    it('should prevent multiple simultaneous saves', async () => {
      let resolveSave: any;
      const onSave = vi.fn(() => new Promise((resolve) => (resolveSave = resolve)));
      render(<EditEmployeeModal {...defaultProps} onSave={onSave} />);

      const form = screen.getByRole('button', { name: /save changes/i }).closest('form');

      // Submit once
      fireEvent.submit(form!);

      // Wait for saving state
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // The button should be disabled, preventing additional submissions
      const savingButton = screen.getByText('Saving...') as HTMLButtonElement;
      expect(savingButton.disabled).toBe(true);

      if (resolveSave) resolveSave();
    });
  });
});
