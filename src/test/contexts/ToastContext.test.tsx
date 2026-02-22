import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../contexts/ToastContext';

// Test component that uses ToastContext
function TestComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
      <button onClick={() => toast.loading('Loading message')}>Show Loading</button>
      <button
        onClick={() => {
          const id = toast.showToast('Custom toast', 'info', 3000);
          setTimeout(() => toast.updateToast(id, 'Updated toast', 'success'), 100);
        }}
      >
        Show and Update
      </button>
      <button
        onClick={() => {
          const id = toast.showToast('Toast to remove', 'info');
          setTimeout(() => toast.removeToast(id), 100);
        }}
      >
        Show and Remove
      </button>
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div>Test Child</div>
        </ToastProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should throw error when useToast is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('showToast', () => {
    it('should show toast with default type and duration', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Info');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should return toast id', () => {
      let toastId: string = '';

      function TestIdComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => {
              toastId = toast.showToast('Test', 'info');
            }}
          >
            Show
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestIdComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      act(() => {
        button.click();
      });

      expect(toastId).toMatch(/^toast-/);
    });
  });

  describe('success', () => {
    it('should show success toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Success');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should accept custom duration', () => {
      function TestDurationComponent() {
        const toast = useToast();
        return <button onClick={() => toast.success('Success', 1000)}>Show</button>;
      }

      render(
        <ToastProvider>
          <TestDurationComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('error', () => {
    it('should show error toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Error');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('warning', () => {
    it('should show warning toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Warning');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('info', () => {
    it('should show info toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Info');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  describe('loading', () => {
    it('should show loading toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Loading');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Loading message')).toBeInTheDocument();
    });

    it('should return toast id for loading toast', () => {
      let toastId: string = '';

      function TestLoadingComponent() {
        const toast = useToast();
        return (
          <button
            onClick={() => {
              toastId = toast.loading('Loading');
            }}
          >
            Show
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestLoadingComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      act(() => {
        button.click();
      });

      expect(toastId).toMatch(/^toast-/);
    });
  });

  describe('updateToast', () => {
    it('should update existing toast', async () => {
      vi.useRealTimers(); // Use real timers for this test

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show and Update');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Custom toast')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.getByText('Updated toast')).toBeInTheDocument();
        },
        { timeout: 200 }
      );

      vi.useFakeTimers(); // Restore fake timers
    });
  });

  describe('removeToast', () => {
    it('should remove toast', async () => {
      vi.useRealTimers(); // Use real timers for this test

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show and Remove');
      act(() => {
        button.click();
      });

      expect(screen.getByText('Toast to remove')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByText('Toast to remove')).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );

      vi.useFakeTimers(); // Restore fake timers
    });
  });

  describe('Multiple toasts', () => {
    it('should show multiple toasts simultaneously', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      act(() => {
        screen.getByText('Show Success').click();
        screen.getByText('Show Error').click();
        screen.getByText('Show Warning').click();
      });

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });
});
