import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilterBar from '../../../components/BreakSchedule/FilterBar';

describe('FilterBar Component', () => {
  const mockDepartments = ['Engineering', 'Sales', 'Support', 'Marketing'];
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedDepartment: '',
    onDepartmentChange: vi.fn(),
    departments: mockDepartments,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search agents...')).toBeInTheDocument();
    });

    it('should render department filter', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByLabelText('Filter by department')).toBeInTheDocument();
    });

    it('should render all department options', () => {
      render(<FilterBar {...defaultProps} />);
      const select = screen.getByLabelText('Filter by department');

      expect(screen.getByText('All Departments')).toBeInTheDocument();
      mockDepartments.forEach((dept) => {
        expect(screen.getByText(dept)).toBeInTheDocument();
      });
    });

    it('should not render WFM buttons when isWFM is false', () => {
      render(<FilterBar {...defaultProps} isWFM={false} />);

      expect(screen.queryByText('Auto-Distribute')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
      expect(screen.queryByText('Import CSV')).not.toBeInTheDocument();
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    it('should render WFM buttons when isWFM is true', () => {
      render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={vi.fn()}
          onImport={vi.fn()}
          onExport={vi.fn()}
          onClearAll={vi.fn()}
        />
      );

      expect(screen.getByText('Auto-Distribute')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('Import CSV')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should display initial search query', () => {
      render(<FilterBar {...defaultProps} searchQuery="John" />);
      const input = screen.getByPlaceholderText('Search agents...') as HTMLInputElement;
      expect(input.value).toBe('John');
    });

    it('should update local search state on input change', () => {
      render(<FilterBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search agents...') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'Jane' } });
      expect(input.value).toBe('Jane');
    });

    it('should debounce search input and call onSearchChange after 300ms', async () => {
      const onSearchChange = vi.fn();
      render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);
      const input = screen.getByPlaceholderText('Search agents...');

      fireEvent.change(input, { target: { value: 'John' } });

      // Should not be called immediately
      expect(onSearchChange).not.toHaveBeenCalled();

      // Should be called after debounce delay
      await waitFor(
        () => {
          expect(onSearchChange).toHaveBeenCalledWith('John');
        },
        { timeout: 500 }
      );
    });

    it('should cancel previous debounce timer on rapid input changes', async () => {
      const onSearchChange = vi.fn();
      render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);
      const input = screen.getByPlaceholderText('Search agents...');

      fireEvent.change(input, { target: { value: 'J' } });
      fireEvent.change(input, { target: { value: 'Jo' } });
      fireEvent.change(input, { target: { value: 'Joh' } });
      fireEvent.change(input, { target: { value: 'John' } });

      // Should only be called once with the final value
      await waitFor(
        () => {
          expect(onSearchChange).toHaveBeenCalledTimes(1);
          expect(onSearchChange).toHaveBeenCalledWith('John');
        },
        { timeout: 500 }
      );
    });

    it('should handle empty search input', async () => {
      const onSearchChange = vi.fn();
      render(<FilterBar {...defaultProps} searchQuery="John" onSearchChange={onSearchChange} />);
      const input = screen.getByPlaceholderText('Search agents...');

      fireEvent.change(input, { target: { value: '' } });

      await waitFor(
        () => {
          expect(onSearchChange).toHaveBeenCalledWith('');
        },
        { timeout: 500 }
      );
    });
  });

  describe('Department Filter', () => {
    it('should display selected department', () => {
      render(<FilterBar {...defaultProps} selectedDepartment="Engineering" />);
      const select = screen.getByLabelText('Filter by department') as HTMLSelectElement;
      expect(select.value).toBe('Engineering');
    });

    it('should call onDepartmentChange when department is selected', () => {
      const onDepartmentChange = vi.fn();
      render(<FilterBar {...defaultProps} onDepartmentChange={onDepartmentChange} />);
      const select = screen.getByLabelText('Filter by department');

      fireEvent.change(select, { target: { value: 'Sales' } });
      expect(onDepartmentChange).toHaveBeenCalledWith('Sales');
    });

    it('should call onDepartmentChange with empty string when All Departments is selected', () => {
      const onDepartmentChange = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          selectedDepartment="Engineering"
          onDepartmentChange={onDepartmentChange}
        />
      );
      const select = screen.getByLabelText('Filter by department');

      fireEvent.change(select, { target: { value: '' } });
      expect(onDepartmentChange).toHaveBeenCalledWith('');
    });

    it('should handle empty departments array', () => {
      render(<FilterBar {...defaultProps} departments={[]} />);
      expect(screen.getByText('All Departments')).toBeInTheDocument();
    });
  });

  describe('WFM Action Buttons', () => {
    it('should call onAutoDistribute when Auto-Distribute button is clicked', () => {
      const onAutoDistribute = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={onAutoDistribute}
          onImport={vi.fn()}
          onExport={vi.fn()}
          onClearAll={vi.fn()}
        />
      );

      const button = screen.getByText('Auto-Distribute');
      fireEvent.click(button);
      expect(onAutoDistribute).toHaveBeenCalledTimes(1);
    });

    it('should call onClearAll when Clear All button is clicked', () => {
      const onClearAll = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={vi.fn()}
          onImport={vi.fn()}
          onExport={vi.fn()}
          onClearAll={onClearAll}
        />
      );

      const button = screen.getByText('Clear All');
      fireEvent.click(button);
      expect(onClearAll).toHaveBeenCalledTimes(1);
    });

    it('should call onImport when Import CSV button is clicked', () => {
      const onImport = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={vi.fn()}
          onImport={onImport}
          onExport={vi.fn()}
          onClearAll={vi.fn()}
        />
      );

      const button = screen.getByText('Import CSV');
      fireEvent.click(button);
      expect(onImport).toHaveBeenCalledTimes(1);
    });

    it('should call onExport when Export CSV button is clicked', () => {
      const onExport = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={vi.fn()}
          onImport={vi.fn()}
          onExport={onExport}
          onClearAll={vi.fn()}
        />
      );

      const button = screen.getByText('Export CSV');
      fireEvent.click(button);
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('should have title attribute on Clear All button', () => {
      render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={vi.fn()}
          onImport={vi.fn()}
          onExport={vi.fn()}
          onClearAll={vi.fn()}
        />
      );

      const button = screen.getByText('Clear All');
      expect(button).toHaveAttribute('title', 'Clear all breaks for this date');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for search input', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByLabelText('Search agents')).toBeInTheDocument();
    });

    it('should have proper label for department filter', () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByLabelText('Filter by department')).toBeInTheDocument();
    });

    it('should use sr-only class for labels', () => {
      const { container } = render(<FilterBar {...defaultProps} />);
      const labels = container.querySelectorAll('.sr-only');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Layout', () => {
    it('should render with responsive flex classes', () => {
      const { container } = render(<FilterBar {...defaultProps} />);
      const flexContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render WFM buttons with flex-wrap', () => {
      const { container } = render(
        <FilterBar
          {...defaultProps}
          isWFM={true}
          onAutoDistribute={vi.fn()}
          onImport={vi.fn()}
          onExport={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      const buttonContainer = container.querySelector('.flex-wrap');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined WFM callbacks gracefully', () => {
      render(<FilterBar {...defaultProps} isWFM={true} />);

      // Should render buttons even without callbacks
      expect(screen.getByText('Auto-Distribute')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('Import CSV')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should handle special characters in search input', async () => {
      const onSearchChange = vi.fn();
      render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);
      const input = screen.getByPlaceholderText('Search agents...');

      fireEvent.change(input, { target: { value: "O'Brien" } });

      await waitFor(
        () => {
          expect(onSearchChange).toHaveBeenCalledWith("O'Brien");
        },
        { timeout: 500 }
      );
    });

    it('should handle very long search queries', async () => {
      const onSearchChange = vi.fn();
      const longQuery = 'a'.repeat(100);
      render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);
      const input = screen.getByPlaceholderText('Search agents...');

      fireEvent.change(input, { target: { value: longQuery } });

      await waitFor(
        () => {
          expect(onSearchChange).toHaveBeenCalledWith(longQuery);
        },
        { timeout: 500 }
      );
    });

    it('should handle department names with special characters', () => {
      const specialDepartments = ['R&D', 'Sales & Marketing', 'IT/Support'];
      render(<FilterBar {...defaultProps} departments={specialDepartments} />);

      specialDepartments.forEach((dept) => {
        expect(screen.getByText(dept)).toBeInTheDocument();
      });
    });
  });
});
