import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Signup from '../../../../pages/Auth/Signup';
import { AuthProvider } from '../../../../contexts/AuthContext';
import * as useAuthModule from '../../../../hooks/useAuth';

// Mock hooks
vi.mock('../../../../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Signup Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: mockSignUp,
      signOut: vi.fn(),
      isAuthenticated: false,
      loading: false,
      isLoading: false,
    } as any);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Signup />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Form Rendering', () => {
    it('renders the signup form with all elements', () => {
      renderComponent();

      expect(screen.getByText('SwapTool')).toBeInTheDocument();
      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Full name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders link to login page', () => {
      renderComponent();

      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('renders name input with correct attributes', () => {
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('name', 'name');
      expect(nameInput).toHaveAttribute('autocomplete', 'name');
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('placeholder', 'John Doe');
    });

    it('renders email input with correct attributes', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'name@dabdoob.com');
    });

    it('renders email domain hint', () => {
      renderComponent();

      expect(screen.getByText('Only @dabdoob.com emails are allowed')).toBeInTheDocument();
    });

    it('renders password inputs with correct attributes', () => {
      renderComponent();

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('placeholder', 'At least 6 characters');

      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('name', 'confirmPassword');
      expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });

    it('does not show error message initially', () => {
      renderComponent();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates name minimum length', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'A');
      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('validates name contains only letters and spaces', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John123');
      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name can only contain letters and spaces/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('validates email domain (dabdoob.com)', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'user@gmail.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be from @dabdoob.com domain/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('validates password minimum length', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('validates passwords match', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('accepts valid signup data', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@dabdoob.com', 'password123', 'John Doe');
      });
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });

    it('calls signUp with correct data', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'Jane Smith');
      await user.type(emailInput, 'jane@dabdoob.com');
      await user.type(passwordInput, 'mypassword123');
      await user.type(confirmPasswordInput, 'mypassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('jane@dabdoob.com', 'mypassword123', 'Jane Smith');
      });
    });

    it('prevents multiple submissions', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success message after successful signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Account created successfully! Please check your email to confirm.')
        ).toBeInTheDocument();
      });
    });

    it('redirects to login after 3 seconds on success', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });

      vi.useFakeTimers();
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
      });

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      vi.useRealTimers();
    });

    it('clears error on new submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already exists' } });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // First submission - error
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      // Second submission - should clear error first
      mockSignUp.mockResolvedValueOnce({ error: null });
      await user.clear(emailInput);
      await user.type(emailInput, 'different@dabdoob.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays authentication error from signUp', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({
        error: { message: 'Email already registered' },
      });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument();
      });
    });

    it('displays network error', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({
        error: { message: 'Network error. Please try again.' },
      });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error with icon', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({
        error: { message: 'Signup failed' },
      });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorDiv = screen.getByText('Signup failed').closest('div');
        expect(errorDiv).toHaveClass('bg-red-50');
        const svg = errorDiv?.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('removes loading state after error', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({
        error: { message: 'Signup failed' },
      });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signup failed')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText('Creating account...')).not.toBeInTheDocument();
    });

    it('does not show success screen on error', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({
        error: { message: 'Signup failed' },
      });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signup failed')).toBeInTheDocument();
      });

      expect(screen.queryByText(/account created successfully/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates name input value', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name') as HTMLInputElement;
      await user.type(nameInput, 'John Doe');

      expect(nameInput.value).toBe('John Doe');
    });

    it('updates email input value', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
      await user.type(emailInput, 'test@dabdoob.com');

      expect(emailInput.value).toBe('test@dabdoob.com');
    });

    it('updates password input values', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirm password') as HTMLInputElement;

      await user.type(passwordInput, 'mypassword');
      await user.type(confirmPasswordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
      expect(confirmPasswordInput.value).toBe('mypassword');
    });

    it('allows clearing and re-entering values', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name') as HTMLInputElement;

      await user.type(nameInput, 'First Name');
      expect(nameInput.value).toBe('First Name');

      await user.clear(nameInput);
      expect(nameInput.value).toBe('');

      await user.type(nameInput, 'Second Name');
      expect(nameInput.value).toBe('Second Name');
    });

    it('submits form on Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@dabdoob.com', 'password123', 'John Doe');
      });
    });
  });

  describe('Success State', () => {
    it('shows success screen with checkmark icon', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const successDiv = screen.getByText(/account created successfully/i).closest('div');
        expect(successDiv).toHaveClass('bg-green-50');
        const svg = successDiv?.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('hides form after successful signup', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
    });

    it('shows email confirmation message', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please check your email to confirm your account/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty form submission', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('handles whitespace in name', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, '  John Doe  ');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        // Zod should trim the name
        expect(mockSignUp).toHaveBeenCalledWith('john@dabdoob.com', 'password123', 'John Doe');
      });
    });

    it('handles whitespace in email', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, '  john@dabdoob.com  ');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        // Zod should trim the email
        expect(mockSignUp).toHaveBeenCalledWith('john@dabdoob.com', 'password123', 'John Doe');
      });
    });

    it('handles very long name', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      const longName = 'A'.repeat(101);
      await user.type(nameInput, longName);
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be less than 100 characters/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('handles very long password', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      const longPassword = 'a'.repeat(129);
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, longPassword);
      await user.type(confirmPasswordInput, longPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be less than 128 characters/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('handles special characters in password', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      const specialPassword = 'P@ssw0rd!#$%';
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, specialPassword);
      await user.type(confirmPasswordInput, specialPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@dabdoob.com', specialPassword, 'John Doe');
      });
    });

    it('handles name with multiple spaces', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John   Doe   Smith');
      await user.type(emailInput, 'john@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'john@dabdoob.com',
          'password123',
          'John   Doe   Smith'
        );
      });
    });

    it('handles case-sensitive email', async () => {
      const user = userEvent.setup({ delay: null });
      mockSignUp.mockResolvedValue({ error: null });
      renderComponent();

      const nameInput = screen.getByLabelText('Full name');
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'John.Doe@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        // Email should be lowercased by Zod
        expect(mockSignUp).toHaveBeenCalledWith('john.doe@dabdoob.com', 'password123', 'John Doe');
      });
    });
  });
});
