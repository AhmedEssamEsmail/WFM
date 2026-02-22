import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedEdit from '../../../components/Headcount/ProtectedEdit';

const mockCanEditHeadcount = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    canEditHeadcount: mockCanEditHeadcount,
  }),
}));

describe('ProtectedEdit - Comprehensive Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission Granted', () => {
    it('should render children when user can edit headcount', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    });

    it('should render multiple children when user can edit', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <button>Edit</button>
          <button>Delete</button>
          <button>Update</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('should render complex children when user can edit', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <div>
            <h1>Edit Form</h1>
            <form>
              <input type="text" placeholder="Name" />
              <button type="submit">Save</button>
            </form>
          </div>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit Form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should not render fallback when user can edit', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit fallback={<div>No Permission</div>}>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
      expect(screen.queryByText('No Permission')).not.toBeInTheDocument();
    });
  });

  describe('Permission Denied', () => {
    it('should not render children when user cannot edit headcount', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
    });

    it('should render nothing when no fallback provided', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      const { container } = render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render fallback when user cannot edit and fallback provided', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      render(
        <ProtectedEdit fallback={<div>No Permission</div>}>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
      expect(screen.getByText('No Permission')).toBeInTheDocument();
    });

    it('should render complex fallback component', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      render(
        <ProtectedEdit
          fallback={
            <div>
              <h2>Access Denied</h2>
              <p>You do not have permission to edit employees.</p>
              <button>Request Access</button>
            </div>
          }
        >
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to edit employees.')).toBeInTheDocument();
      expect(screen.getByText('Request Access')).toBeInTheDocument();
      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
    });
  });

  describe('useAuth Hook Integration', () => {
    it('should call canEditHeadcount from useAuth', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(mockCanEditHeadcount).toHaveBeenCalled();
    });

    it('should call canEditHeadcount only once per render', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(mockCanEditHeadcount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      const { container } = render(<ProtectedEdit>{null}</ProtectedEdit>);

      expect(container.firstChild).toBeNull();
    });

    it('should handle undefined children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      const { container } = render(<ProtectedEdit>{undefined}</ProtectedEdit>);

      expect(container.firstChild).toBeNull();
    });

    it('should handle empty string children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      const { container } = render(<ProtectedEdit>{''}</ProtectedEdit>);

      expect(container.textContent).toBe('');
    });

    it('should handle text node children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(<ProtectedEdit>Edit Mode Active</ProtectedEdit>);

      expect(screen.getByText('Edit Mode Active')).toBeInTheDocument();
    });

    it('should handle number children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(<ProtectedEdit>{42}</ProtectedEdit>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle boolean children (renders nothing)', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      const { container } = render(<ProtectedEdit>{true}</ProtectedEdit>);

      expect(container.textContent).toBe('');
    });

    it('should handle array of children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          {[
            <button key="1">Edit</button>,
            <button key="2">Delete</button>,
            <button key="3">Save</button>,
          ]}
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      mockCanEditHeadcount.mockReturnValue(true);
      const showEdit = true;

      render(<ProtectedEdit>{showEdit && <button>Edit</button>}</ProtectedEdit>);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should handle null fallback', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      const { container } = render(
        <ProtectedEdit fallback={null}>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle undefined fallback', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      const { container } = render(
        <ProtectedEdit fallback={undefined}>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Re-rendering Behavior', () => {
    it('should update when permission changes from false to true', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      const { rerender } = render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();

      mockCanEditHeadcount.mockReturnValue(true);
      rerender(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    });

    it('should update when permission changes from true to false', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      const { rerender } = render(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();

      mockCanEditHeadcount.mockReturnValue(false);
      rerender(
        <ProtectedEdit>
          <button>Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.queryByText('Edit Employee')).not.toBeInTheDocument();
    });

    it('should update children when permission remains true', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      const { rerender } = render(
        <ProtectedEdit>
          <button>Edit</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();

      rerender(
        <ProtectedEdit>
          <button>Update</button>
        </ProtectedEdit>
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('should update fallback when permission remains false', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      const { rerender } = render(
        <ProtectedEdit fallback={<div>No Access</div>}>
          <button>Edit</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('No Access')).toBeInTheDocument();

      rerender(
        <ProtectedEdit fallback={<div>Permission Denied</div>}>
          <button>Edit</button>
        </ProtectedEdit>
      );

      expect(screen.queryByText('No Access')).not.toBeInTheDocument();
      expect(screen.getByText('Permission Denied')).toBeInTheDocument();
    });
  });

  describe('Component Composition', () => {
    it('should work with nested ProtectedEdit components', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <div>
            <ProtectedEdit>
              <button>Nested Edit</button>
            </ProtectedEdit>
          </div>
        </ProtectedEdit>
      );

      expect(screen.getByText('Nested Edit')).toBeInTheDocument();
    });

    it('should work with other wrapper components', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <div className="container">
          <ProtectedEdit>
            <button>Edit Employee</button>
          </ProtectedEdit>
        </div>
      );

      expect(screen.getByText('Edit Employee')).toBeInTheDocument();
    });

    it('should preserve event handlers on children', () => {
      mockCanEditHeadcount.mockReturnValue(true);
      const handleClick = vi.fn();

      render(
        <ProtectedEdit>
          <button onClick={handleClick}>Edit Employee</button>
        </ProtectedEdit>
      );

      const button = screen.getByText('Edit Employee');
      button.click();

      expect(handleClick).toHaveBeenCalled();
    });

    it('should preserve className on children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <button className="custom-class">Edit Employee</button>
        </ProtectedEdit>
      );

      const button = screen.getByText('Edit Employee');
      expect(button).toHaveClass('custom-class');
    });

    it('should preserve data attributes on children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <button data-testid="edit-button">Edit Employee</button>
        </ProtectedEdit>
      );

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });
  });

  describe('Fragment Handling', () => {
    it('should handle React Fragment as children', () => {
      mockCanEditHeadcount.mockReturnValue(true);

      render(
        <ProtectedEdit>
          <>
            <button>Edit</button>
            <button>Delete</button>
          </>
        </ProtectedEdit>
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should handle React Fragment as fallback', () => {
      mockCanEditHeadcount.mockReturnValue(false);

      render(
        <ProtectedEdit
          fallback={
            <>
              <div>No Permission</div>
              <button>Request Access</button>
            </>
          }
        >
          <button>Edit</button>
        </ProtectedEdit>
      );

      expect(screen.getByText('No Permission')).toBeInTheDocument();
      expect(screen.getByText('Request Access')).toBeInTheDocument();
    });
  });
});
