import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../../../../pages/Auth/Login';
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

describe('Login Page - Comprehensive Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Default mock - not authenticated, not loading
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      signIn: mockSignIn,
      signUp: vi.fn(),
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
            <Login />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Form Rendering', () => {
    it('renders the login form with all elements', () => {
      renderComponent();

      expect(screen.getByText('WFM System')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders link to signup page', () => {
      renderComponent();

      const signupLink = screen.getByRole('link', { name: /create a new account/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });

    it('renders email input with correct attributes', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'you@dabdoob.com');
    });

    it('renders password input with correct attributes', () => {
      renderComponent();

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('placeholder', '********');
    });

    it('does not show error message initially', () => {
      renderComponent();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates email domain (dabdoob.com)', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@gmail.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be from @dabdoob.com domain/i)).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('validates password minimum length', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('accepts valid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@dabdoob.com', 'password123');
      });
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it('calls signIn with correct credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@dabdoob.com');
      await user.type(passwordInput, 'mypassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@dabdoob.com', 'mypassword123');
      });
    });

    it('prevents multiple submissions', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(1);
      });
    });

    it('clears error on successful submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submission - error
      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Second submission - should clear error first
      mockSignIn.mockResolvedValueOnce({ error: null });
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays authentication error from signIn', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid email or password' },
      });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    it('displays network error', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Network error. Please try again.' },
      });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays validation error with icon', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@gmail.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const errorText = screen.getByText(/must be from @dabdoob.com domain/i);
        const errorContainer = errorText.closest('.bg-red-50');
        expect(errorContainer).toBeInTheDocument();
        const svg = errorContainer?.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('removes loading state after error', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State', () => {
    it('shows loading spinner when auth is loading', () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        isAuthenticated: false,
        loading: true,
        isLoading: true,
      } as any);

      renderComponent();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Sign in to your account')).not.toBeInTheDocument();
    });

    it('redirects to home when already authenticated', () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@dabdoob.com',
          role: 'agent',
          created_at: '2024-01-01',
        },
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        isAuthenticated: true,
        loading: false,
        isLoading: false,
      } as any);

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('does not redirect when loading', () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        isAuthenticated: false,
        loading: true,
        isLoading: true,
      } as any);

      renderComponent();

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('updates email input value', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
      await user.type(emailInput, 'test@dabdoob.com');

      expect(emailInput.value).toBe('test@dabdoob.com');
    });

    it('updates password input value', async () => {
      const user = userEvent.setup();
      renderComponent();

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('allows clearing and re-entering values', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;

      await user.type(emailInput, 'first@dabdoob.com');
      expect(emailInput.value).toBe('first@dabdoob.com');

      await user.clear(emailInput);
      expect(emailInput.value).toBe('');

      await user.type(emailInput, 'second@dabdoob.com');
      expect(emailInput.value).toBe('second@dabdoob.com');
    });

    it('submits form on Enter key', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@dabdoob.com', 'password123');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty form submission', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('handles whitespace in email', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, '  user@dabdoob.com  ');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        // Zod should trim the email
        expect(mockSignIn).toHaveBeenCalledWith('user@dabdoob.com', 'password123');
      });
    });

    it('handles very long password', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      const longPassword = 'a'.repeat(129);
      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, longPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be less than 128 characters/i)).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('handles special characters in password', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      renderComponent();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@dabdoob.com');
      await user.type(passwordInput, 'P@ssw0rd!#$%');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@dabdoob.com', 'P@ssw0rd!#$%');
      });
    });
  });
});
