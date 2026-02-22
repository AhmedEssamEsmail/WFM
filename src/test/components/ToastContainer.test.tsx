import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../../components/ToastContainer';
import type { ToastProps } from '../../components/Toast';

describe('ToastContainer Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering toasts', () => {
    it('should render empty container when no toasts', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

      const toastContainer = container.querySelector('.pointer-events-auto');
      expect(toastContainer).toBeInTheDocument();
      // Empty container should have no toast children
      const toasts = container.querySelectorAll('[role="alert"]');
      expect(toasts).toHaveLength(0);
    });

    it('should render single toast', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'Test message', type: 'info' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render multiple toasts', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'First message', type: 'success' },
        { id: 'toast-2', message: 'Second message', type: 'error' },
        { id: 'toast-3', message: 'Third message', type: 'warning' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });

    it('should render toasts with different types', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'Success', type: 'success' },
        { id: 'toast-2', message: 'Error', type: 'error' },
        { id: 'toast-3', message: 'Warning', type: 'warning' },
        { id: 'toast-4', message: 'Info', type: 'info' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Toast management', () => {
    it('should pass onClose handler to each toast', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'Test 1', type: 'info' },
        { id: 'toast-2', message: 'Test 2', type: 'info' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      const closeButtons = screen.getAllByRole('button');
      fireEvent.click(closeButtons[0]);

      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    });

    it('should handle closing specific toast', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'First', type: 'info' },
        { id: 'toast-2', message: 'Second', type: 'info' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      const closeButtons = screen.getAllByRole('button');
      fireEvent.click(closeButtons[1]);

      expect(mockOnClose).toHaveBeenCalledWith('toast-2');
    });

    it('should use toast id as key', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'unique-1', message: 'Test 1', type: 'info' },
        { id: 'unique-2', message: 'Test 2', type: 'info' },
      ];

      const { container } = render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      // Check that toasts are rendered (keys are internal to React but we can verify rendering)
      expect(screen.getByText('Test 1')).toBeInTheDocument();
      expect(screen.getByText('Test 2')).toBeInTheDocument();
    });
  });

  describe('Positioning and layout', () => {
    it('should have fixed positioning at top-right', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('fixed', 'right-4', 'top-4');
    });

    it('should have high z-index for overlay', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('z-50');
    });

    it('should stack toasts vertically with gap', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

      const toastList = container.querySelector('.flex.flex-col.gap-2');
      expect(toastList).toBeInTheDocument();
      expect(toastList).toHaveClass('flex-col', 'gap-2');
    });

    it('should have max width constraint', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-sm');
    });

    it('should be pointer-events-none on wrapper but auto on content', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

      const wrapper = container.firstChild as HTMLElement;
      const content = wrapper.querySelector('.pointer-events-auto');

      expect(wrapper).toHaveClass('pointer-events-none');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Toast stacking behavior', () => {
    it('should maintain order of toasts', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'First', type: 'info' },
        { id: 'toast-2', message: 'Second', type: 'info' },
        { id: 'toast-3', message: 'Third', type: 'info' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      const messages = screen.getAllByText(/First|Second|Third/);
      expect(messages[0]).toHaveTextContent('First');
      expect(messages[1]).toHaveTextContent('Second');
      expect(messages[2]).toHaveTextContent('Third');
    });

    it('should handle dynamic toast list updates', () => {
      const initialToasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'Initial', type: 'info' },
      ];

      const { rerender } = render(<ToastContainer toasts={initialToasts} onClose={mockOnClose} />);

      expect(screen.getByText('Initial')).toBeInTheDocument();

      const updatedToasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'Initial', type: 'info' },
        { id: 'toast-2', message: 'New', type: 'success' },
      ];

      rerender(<ToastContainer toasts={updatedToasts} onClose={mockOnClose} />);

      expect(screen.getByText('Initial')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('Toast duration handling', () => {
    it('should pass duration prop to toasts', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'Auto dismiss', type: 'info', duration: 5000 },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      expect(screen.getByText('Auto dismiss')).toBeInTheDocument();
    });

    it('should handle toasts without duration', () => {
      const toasts: Omit<ToastProps, 'onClose'>[] = [
        { id: 'toast-1', message: 'No auto dismiss', type: 'info' },
      ];

      render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

      expect(screen.getByText('No auto dismiss')).toBeInTheDocument();
    });
  });
});
