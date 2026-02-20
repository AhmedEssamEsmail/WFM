import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../../components/Toast';

describe('Toast Component', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    vi.clearAllTimers();
  });

  it('should render success toast', () => {
    render(<Toast id="test-1" message="Success message" type="success" onClose={mockOnClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    render(<Toast id="test-2" message="Error message" type="error" onClose={mockOnClose} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render warning toast', () => {
    render(<Toast id="test-3" message="Warning message" type="warning" onClose={mockOnClose} />);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should render info toast', () => {
    render(<Toast id="test-4" message="Info message" type="info" onClose={mockOnClose} />);

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<Toast id="test-5" message="Test message" type="info" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('test-5');
  });

  it('should auto-dismiss after duration', async () => {
    vi.useFakeTimers();

    render(
      <Toast id="test-6" message="Auto dismiss" type="info" duration={3000} onClose={mockOnClose} />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(mockOnClose).toHaveBeenCalledWith('test-6');

    vi.useRealTimers();
  });

  it('should not auto-dismiss when duration is 0', async () => {
    vi.useFakeTimers();

    render(
      <Toast id="test-7" message="No auto dismiss" type="info" duration={0} onClose={mockOnClose} />
    );

    vi.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
