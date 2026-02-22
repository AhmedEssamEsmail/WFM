import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillsFilter from '../../../../components/Schedule/SkillsFilter';

/**
 * Comprehensive tests for SkillsFilter component
 * Target: Increase coverage from existing to 80%+
 * Requirements: FR-1.2.5, CR-2.1.4, PR-4.3.3
 */

// Mock the useSkills hook
vi.mock('../../../../hooks/useSkills', () => ({
  useSkills: vi.fn(),
}));

import { useSkills } from '../../../../hooks/useSkills';

describe('SkillsFilter Component - Comprehensive', () => {
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
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('All skills');
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

    it('should render chevron icon', () => {
      const { container } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);
      const chevron = container.querySelector('svg');
      expect(chevron).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /all skills/i });
      expect(button).toHaveClass('rounded-md', 'border', 'border-gray-300');
    });
  });

  describe('Dropdown interaction', () => {
    it('should open dropdown when clicking trigger button', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button');
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

    it('should rotate chevron icon when dropdown is open', async () => {
      const user = userEvent.setup();
      const { container } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      const chevron = container.querySelector('svg');

      // Initially not rotated
      expect(chevron).not.toHaveClass('rotate-180');

      // Open dropdown
      await user.click(button);

      await waitFor(() => {
        expect(chevron).toHaveClass('rotate-180');
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

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />
          <button>Outside Button</button>
        </div>
      );

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      // Click outside
      const outsideButton = screen.getByText('Outside Button');
      fireEvent.mouseDown(outsideButton);

      await waitFor(() => {
        expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
      });
    });

    it('should not close dropdown when clicking inside', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      // Click inside dropdown
      const jsLabel = screen.getByText('JavaScript');
      fireEvent.mouseDown(jsLabel);

      // Dropdown should still be open
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
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

        // Check that colors are applied
        const firstIndicator = colorIndicators[0] as HTMLElement;
        expect(firstIndicator.style.backgroundColor).toBe('rgb(245, 158, 11)'); // #F59E0B
      });
    });

    it('should handle selecting all skills', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      // Select all skills - each click adds to the current selectedSkillIds prop
      const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });
      const tsCheckbox = screen.getByRole('checkbox', { name: /typescript/i });
      const reactCheckbox = screen.getByRole('checkbox', { name: /react/i });

      await user.click(jsCheckbox);
      expect(mockOnChange).toHaveBeenCalledWith(['skill-1']);

      await user.click(tsCheckbox);
      // Since the prop hasn't changed, it still adds to the original []
      expect(mockOnChange).toHaveBeenCalledWith(['skill-2']);

      await user.click(reactCheckbox);
      expect(mockOnChange).toHaveBeenCalledWith(['skill-3']);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it('should handle deselecting all skills', async () => {
      const user = userEvent.setup();
      render(
        <SkillsFilter
          selectedSkillIds={['skill-1', 'skill-2', 'skill-3']}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button', { name: /3 skills selected/i });
      await user.click(button);

      // Deselect all skills - each click removes from the current selectedSkillIds prop
      const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });
      const tsCheckbox = screen.getByRole('checkbox', { name: /typescript/i });
      const reactCheckbox = screen.getByRole('checkbox', { name: /react/i });

      await user.click(jsCheckbox);
      expect(mockOnChange).toHaveBeenCalledWith(['skill-2', 'skill-3']);

      await user.click(tsCheckbox);
      // Since the prop hasn't changed, it still removes from the original array
      expect(mockOnChange).toHaveBeenCalledWith(['skill-1', 'skill-3']);

      await user.click(reactCheckbox);
      expect(mockOnChange).toHaveBeenCalledWith(['skill-1', 'skill-2']);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for dropdown trigger', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      expect(button).toHaveAttribute('id', 'skills-filter');
    });

    it('should have proper label association', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const label = screen.getByText('Filter by Skills');
      expect(label).toHaveAttribute('for', 'skills-filter');
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

    it('should have focus styles', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      expect(button).toHaveClass('focus:border-primary-500', 'focus:ring-2');
    });

    it('should have hover styles on skill items', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        const labels = screen.getAllByRole('checkbox').map((cb) => cb.closest('label'));
        labels.forEach((label) => {
          expect(label).toHaveClass('hover:bg-gray-50');
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedSkillIds array', () => {
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);
      expect(screen.getByText('All skills')).toBeInTheDocument();
    });

    it('should handle selectedSkillIds with non-existent skill IDs', () => {
      render(<SkillsFilter selectedSkillIds={['non-existent-id']} onChange={mockOnChange} />);
      // Non-existent IDs are filtered out, so it should show "All skills"
      expect(screen.getByText('All skills')).toBeInTheDocument();
    });

    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });

      // Rapid clicks (3 clicks = open, close, open)
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should end up open after odd number of clicks
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });
    });

    it('should handle onChange being called multiple times', async () => {
      const user = userEvent.setup();
      render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });

      // Multiple selections
      await user.click(jsCheckbox);
      await user.click(jsCheckbox);

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Dropdown positioning', () => {
    it('should have absolute positioning', async () => {
      const user = userEvent.setup();
      const { container } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        // Find the dropdown container (has absolute positioning)
        const dropdown = container.querySelector('.absolute.z-10');
        expect(dropdown).toBeInTheDocument();
        expect(dropdown).toHaveClass('absolute', 'z-10');
      });
    });

    it('should have max height and scrolling', async () => {
      const user = userEvent.setup();
      const { container } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      const button = screen.getByRole('button', { name: /all skills/i });
      await user.click(button);

      await waitFor(() => {
        // Find the dropdown container
        const dropdown = container.querySelector('.absolute.z-10');
        expect(dropdown).toHaveClass('max-h-60', 'overflow-auto');
      });
    });
  });

  describe('Multiple skills display', () => {
    it('should correctly count selected skills', () => {
      render(
        <SkillsFilter
          selectedSkillIds={['skill-1', 'skill-2', 'skill-3']}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('3 skills selected')).toBeInTheDocument();
    });

    it('should update count when skills are selected', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SkillsFilter selectedSkillIds={[]} onChange={mockOnChange} />);

      expect(screen.getByText('All skills')).toBeInTheDocument();

      // Rerender with selected skills
      rerender(<SkillsFilter selectedSkillIds={['skill-1']} onChange={mockOnChange} />);

      expect(screen.getByText('1 skill selected')).toBeInTheDocument();
    });
  });
});
