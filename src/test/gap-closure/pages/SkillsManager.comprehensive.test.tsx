import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SkillsManager from '../../../pages/Settings/SkillsManager';
import type { Skill } from '../../../types';

/**
 * Comprehensive tests for SkillsManager component
 * Target: Increase coverage from 0% to 80%
 * Requirements: FR-1.2.6, CR-2.1.4, PR-4.2.4
 */

const mockSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'JavaScript',
    description: 'Programming language',
    color: '#F7DF1E',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'skill-2',
    name: 'Python',
    description: null,
    color: '#3776AB',
    is_active: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const mockUseSkills = vi.fn();

vi.mock('../../../hooks/useSkills', () => ({
  useSkills: () => mockUseSkills(),
}));

describe('SkillsManager Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    mockUseSkills.mockReturnValue({
      skills: mockSkills,
      isLoading: false,
      createSkill: {
        mutate: vi.fn((data, options) => options?.onSuccess?.()),
        isPending: false,
      },
      updateSkill: {
        mutate: vi.fn((data, options) => options?.onSuccess?.()),
        isPending: false,
      },
      deleteSkill: {
        mutate: vi.fn(),
        isPending: false,
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<SkillsManager />, { wrapper });
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<SkillsManager />, { wrapper });
      expect(
        screen.getByText('Manage skills that can be assigned to employees')
      ).toBeInTheDocument();
    });

    it('should render Create Skill button', () => {
      render(<SkillsManager />, { wrapper });
      expect(screen.getByText('Create Skill')).toBeInTheDocument();
    });

    it('should show loading spinner while fetching', () => {
      mockUseSkills.mockReturnValue({
        skills: [],
        isLoading: true,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should display skills after loading', () => {
      render(<SkillsManager />, { wrapper });
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should show empty state when no skills', () => {
      mockUseSkills.mockReturnValue({
        skills: [],
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });
      expect(
        screen.getByText('No skills configured. Create one to get started.')
      ).toBeInTheDocument();
    });
  });

  describe('Skill Display', () => {
    it('should display skill name', () => {
      render(<SkillsManager />, { wrapper });
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('should display skill description when present', () => {
      render(<SkillsManager />, { wrapper });
      expect(screen.getByText('Programming language')).toBeInTheDocument();
    });

    it('should not display description when null', () => {
      render(<SkillsManager />, { wrapper });
      const pythonSkill = screen.getByText('Python').closest('li');
      expect(pythonSkill).not.toHaveTextContent('null');
    });

    it('should display active status badge', () => {
      render(<SkillsManager />, { wrapper });
      const badges = screen.getAllByText('Active');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display inactive status badge', () => {
      render(<SkillsManager />, { wrapper });
      const badges = screen.getAllByText('Inactive');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display color indicator', () => {
      const { container } = render(<SkillsManager />, { wrapper });
      const colorBoxes = container.querySelectorAll('[style*="backgroundColor"]');
      expect(colorBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Skill', () => {
    it('should show edit form when Edit button is clicked', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByDisplayValue('JavaScript')).toBeInTheDocument();
    });

    it('should populate form with skill data', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByDisplayValue('JavaScript')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Programming language')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#F7DF1E')).toBeInTheDocument();
    });

    it('should update name field', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('JavaScript');
      fireEvent.change(nameInput, { target: { value: 'TypeScript' } });

      expect(nameInput).toHaveValue('TypeScript');
    });

    it('should update description field', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const descInput = screen.getByDisplayValue('Programming language');
      fireEvent.change(descInput, { target: { value: 'Updated description' } });

      expect(descInput).toHaveValue('Updated description');
    });

    it('should update color field', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const colorInputs = screen.getAllByDisplayValue('#F7DF1E');
      fireEvent.change(colorInputs[0], { target: { value: '#FF0000' } });

      expect(colorInputs[0]).toHaveValue('#FF0000');
    });

    it('should toggle active status', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should call updateSkill when Save is clicked', async () => {
      const mutateFn = vi.fn((data, options) => options?.onSuccess?.());
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: mutateFn, isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('JavaScript');
      fireEvent.change(nameInput, { target: { value: 'TypeScript' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith(
          {
            id: 'skill-1',
            updates: {
              name: 'TypeScript',
              description: 'Programming language',
              color: '#F7DF1E',
              is_active: true,
            },
          },
          expect.any(Object)
        );
      });
    });

    it('should cancel edit when Cancel is clicked', () => {
      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByDisplayValue('JavaScript')).not.toBeInTheDocument();
    });

    it('should show Saving... text while saving', () => {
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: true },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable Save button while saving', () => {
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: true },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Create Skill', () => {
    it('should show create form when Create Skill button is clicked', () => {
      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      expect(screen.getByText('Create New Skill')).toBeInTheDocument();
    });

    it('should have empty form fields', () => {
      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('e.g., JavaScript');
      expect(nameInput).toHaveValue('');
    });

    it('should update name field', () => {
      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('e.g., JavaScript');
      fireEvent.change(nameInput, { target: { value: 'React' } });

      expect(nameInput).toHaveValue('React');
    });

    it('should call createSkill when Create Skill is clicked', async () => {
      const mutateFn = vi.fn((data, options) => options?.onSuccess?.());
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: mutateFn, isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('e.g., JavaScript');
      fireEvent.change(nameInput, { target: { value: 'React' } });

      const submitButton = screen.getAllByText('Create Skill')[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith(
          {
            name: 'React',
            description: null,
            color: '#3B82F6',
            is_active: true,
          },
          expect.any(Object)
        );
      });
    });

    it('should not call createSkill when name is empty', async () => {
      const mutateFn = vi.fn();
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: mutateFn, isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const submitButton = screen.getAllByText('Create Skill')[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mutateFn).not.toHaveBeenCalled();
      });
    });

    it('should cancel create when Cancel is clicked', () => {
      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      expect(screen.getByText('Create New Skill')).toBeInTheDocument();

      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      expect(screen.queryByText('Create New Skill')).not.toBeInTheDocument();
    });

    it('should reset form after successful create', async () => {
      const mutateFn = vi.fn((data, options) => options?.onSuccess?.());
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: mutateFn, isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('e.g., JavaScript');
      fireEvent.change(nameInput, { target: { value: 'React' } });

      const submitButton = screen.getAllByText('Create Skill')[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Skill')).not.toBeInTheDocument();
      });
    });

    it('should show Creating... text while creating', () => {
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: true },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Delete Skill', () => {
    it('should show confirmation dialog when Delete is clicked', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      render(<SkillsManager />, { wrapper });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this skill? This will remove it from all employees.'
      );
    });

    it('should call deleteSkill when confirmed', async () => {
      const mutateFn = vi.fn();
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: mutateFn, isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith('skill-1');
      });
    });

    it('should not call deleteSkill when cancelled', async () => {
      window.confirm = vi.fn(() => false);
      const mutateFn = vi.fn();
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: vi.fn(), isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: mutateFn, isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mutateFn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const { container } = render(<SkillsManager />, { wrapper });
      const heading = container.querySelector('h3');
      expect(heading).toHaveTextContent('Skills');
    });

    it('should have descriptive labels', () => {
      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Description (optional)')).toBeInTheDocument();
      expect(screen.getByText('Color (hex)')).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const colorInput = screen.getByDisplayValue('#3B82F6');
      expect(colorInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle skills with null description', () => {
      render(<SkillsManager />, { wrapper });
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should trim whitespace from skill name', async () => {
      const mutateFn = vi.fn((data, options) => options?.onSuccess?.());
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: mutateFn, isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('e.g., JavaScript');
      fireEvent.change(nameInput, { target: { value: '  React  ' } });

      const submitButton = screen.getAllByText('Create Skill')[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'React',
          }),
          expect.any(Object)
        );
      });
    });

    it('should handle empty description as null', async () => {
      const mutateFn = vi.fn((data, options) => options?.onSuccess?.());
      mockUseSkills.mockReturnValue({
        skills: mockSkills,
        isLoading: false,
        createSkill: { mutate: mutateFn, isPending: false },
        updateSkill: { mutate: vi.fn(), isPending: false },
        deleteSkill: { mutate: vi.fn(), isPending: false },
      });

      render(<SkillsManager />, { wrapper });

      const createButton = screen.getByText('Create Skill');
      fireEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('e.g., JavaScript');
      fireEvent.change(nameInput, { target: { value: 'React' } });

      const submitButton = screen.getAllByText('Create Skill')[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledWith(
          expect.objectContaining({
            description: null,
          }),
          expect.any(Object)
        );
      });
    });
  });
});
