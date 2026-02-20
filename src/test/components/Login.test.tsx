import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Auth/Login';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignIn = vi.fn();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  const renderLogin = (isAuthenticated = false, loading = false) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: isAuthenticated
              ? ({
                  id: 'user-1',
                  email: 'test@dabdoob.com',
                  name: 'Test User',
                  role: 'agent',
                  created_at: '2024-01-01',
                } as User)
              : null,
            loading,
            signOut: vi.fn(),
            signIn: mockSignIn,
            isAuthenticated,
          }}
        >
          <Login />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  describe('Form rendering', () => {
    it('should render login form with all elements', () => {
      renderLogin();

      expect(screen.getByText('WFM System')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render link to signup page', () => {
      renderLogin();

      const signupLink = screen.getByText('create a new account');
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Form validation', () => {
    it('should show validation error for non-dabdoob domain', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'user@gmail.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email must be from @dabdoob.com domain')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show validation error for short password', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'user@dabdoob.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('should call signIn with valid credentials', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'user@dabdoob.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@dabdoob.com', 'password123');
      });
    });

    it('should show error message on failed login', async () => {
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'user@dabdoob.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'user@dabdoob.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});
