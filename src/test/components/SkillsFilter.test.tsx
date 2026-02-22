import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillsFilter from '../../components/Schedule/SkillsFilter';

// Mock the useSkills hook
vi.mock('../../hooks/useSkills', () => ({
  useSkills: vi.fn(),
}));

import { useSkills } from '../../hooks/useSkills';

describe('SkillsFilter Component', () => {
  const mockOnChange = vi.fn();
  const mockSkills = [
    { id: 'skill-1', name: 'JavaScript', color: '#F59E0B', is_active: true },
    { id: 'skill-2', name: 'TypeScript', color: '#3B82F6', is_active: true },
    { id: 'skill-3', name: 'React', color: '#10B981', is_active: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSkills).mockReturnValue({
      skills: mockSkills,
      isLoading: false,
      createSkill: { mutateAsync: vi.fn() } as any,
      updateSkill: { mutateAsync: vi.fn() } as any,
      deleteSkill: { mutateAsync: vi.fn() } as any,
    });
  });

  describe('Rendering', () => {
    it('should render filter label', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      expect(screen.getByText('Filter by Skills')).toBeInTheDocument();
    });

    it('should render dropdown trigger button', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      expect(button).toBeInTheDocument();
    });

    it('should show "All skills" when no skills are selected', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      expect(screen.getByText('All skills')).toBeInTheDocument();
    });

    it('should show count when skills are selected', () => {
      render(<SkillsFilter selectedSkillIds={['skill-1', 'skill-2']} onChange={mockOnChange} />);

      expect(screen.getByText('2 skills selected')).toBeInTheDocument();
    });

    it('should show singular form when one skill is selected', () => {
      render(<SkillsFilter selectedSkillIds={['skill-1']} onChange={mockOnChange} />);

      expect(screen.getByText('1 skill selected')).toBeInTheDocument();
    });
  });

  describe('Dropdown interaction', () => {
    it('should open dropdown when clicking trigger button', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking trigger button again', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });

      // Open dropdown
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      // Close dropdown
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
      });
    });

    it('should display loading state when skills are loading', async () => {
      vi.mocked(useSkills).mockReturnValue({
        skills: [],
        isLoading: true,
        createSkill: { mutateAsync: vi.fn() } as any,
        updateSkill: { mutateAsync: vi.fn() } as any,
        deleteSkill: { mutateAsync: vi.fn() } as any,
      });

      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Loading skills...')).toBeInTheDocument();
      });
    });

    it('should display empty state when no skills are available', async () => {
      vi.mocked(useSkills).mockReturnValue({
        skills: [],
        isLoading: false,
        createSkill: { mutateAsync: vi.fn() } as any,
        updateSkill: { mutateAsync: vi.fn() } as any,
        deleteSkill: { mutateAsync: vi.fn() } as any,
      });

      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('No skills available')).toBeInTheDocument();
      });
    });
  });

  describe('Skill selection', () => {
    it('should call onChange when selecting a skill', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      // Open dropdown
      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      // Click on JavaScript skill
      const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });
      await user.click(jsCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['skill-1']);
    });

    it('should call onChange when deselecting a skill', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={['skill-1', 'skill-2']} onChange={mockOnChange} />);

      // Open dropdown
      const button = screen.getByRole('button', { name: /2 skills selected/i });
      await user.click(button);

      // Click on JavaScript skill to deselect
      const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });
      await user.click(jsCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['skill-2']);
    });

    it('should show checkboxes as checked for selected skills', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={['skill-1', 'skill-3']} onChange={mockOnChange} />);

      // Open dropdown
      const button = screen.getByRole('button', { name: /2 skills selected/i });
      await user.click(button);

      await waitFor(() => {
        const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });
        const tsCheckbox = screen.getByRole('checkbox', { name: /typescript/i });
        const reactCheckbox = screen.getByRole('checkbox', { name: /react/i });

        expect(jsCheckbox).toBeChecked();
        expect(tsCheckbox).not.toBeChecked();
        expect(reactCheckbox).toBeChecked();
      });
    });

    it('should display skill colors', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      // Open dropdown
      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        // Check that color indicators are rendered
        const colorIndicators = document.querySelectorAll('.h-3.w-3.rounded');
        expect(colorIndicators.length).toBe(3);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for dropdown trigger', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      expect(button).toHaveAttribute('id', 'skills-filter');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });

      // Tab to button and press Enter
      await user.tab();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });
    });
  });
});
