import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../types';
import * as securityLogger from '../../lib/securityLogger';

// Mock security logger
vi.mock('../../lib/securityLogger', () => ({
  logUnauthorizedAccess: vi.fn(),
}));

// Mock Layout component
vi.mock('../../components/shared/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock constants
vi.mock('../../constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../constants')>();
  return {
    ...actual,
    getAllowedEmailDomain: () => 'dabdoob.com',
    isEmailInAllowedDomain: (email: string, domain: string) => email.endsWith(`@${domain}`),
  };
});

const mockWFM: User = {
  id: 'wfm-1',
  email: 'wfm@dabdoob.com',
  name: 'WFM User',
  role: 'wfm',
  created_at: '2024-01-01',
};

const mockTL: User = {
  id: 'tl-1',
  email: 'tl@dabdoob.com',
  name: 'TL User',
  role: 'tl',
  created_at: '2024-01-01',
};

const mockAgent: User = {
  id: 'agent-1',
  email: 'agent@dabdoob.com',
  name: 'Agent User',
  role: 'agent',
  created_at: '2024-01-01',
};

const createWrapper = (user: User | null, initialPath: string = '/requests') => {
  const signOut = vi.fn();

  return ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser: null,
        session: null,
        loading: false,
        isAuthenticated: !!user,
        signUp: async () => ({ error: null }),
        signIn: async () => ({ error: null, session: null }),
        signOut,
      }}
    >
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/requests" element={children} />
          <Route path="/swap-requests" element={children} />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
          <Route path="/login" element={<div data-testid="login">Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute - Role-Based Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/requests route protection', () => {
    it('should allow wfm role to access /requests', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['wfm']}>
          <div data-testid="requests-page">Request Management</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockWFM, '/requests'),
      });

      expect(screen.getByTestId('requests-page')).toBeInTheDocument();
      expect(screen.getByText('Request Management')).toBeInTheDocument();
      expect(securityLogger.logUnauthorizedAccess).not.toHaveBeenCalled();
    });

    it('should redirect agent role from /requests to dashboard', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['wfm']}>
          <div data-testid="requests-page">Request Management</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockAgent, '/requests'),
      });

      expect(screen.queryByTestId('requests-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should redirect tl role from /requests to dashboard', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['wfm']}>
          <div data-testid="requests-page">Request Management</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockTL, '/requests'),
      });

      expect(screen.queryByTestId('requests-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should log unauthorized access when agent tries to access /requests', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['wfm']}>
          <div data-testid="requests-page">Request Management</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockAgent, '/requests'),
      });

      expect(securityLogger.logUnauthorizedAccess).toHaveBeenCalledWith(
        mockAgent.id,
        mockAgent.role,
        '/requests',
        expect.stringContaining('Insufficient role permissions'),
        'role_violation'
      );
    });

    it('should log unauthorized access when tl tries to access /requests', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['wfm']}>
          <div data-testid="requests-page">Request Management</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockTL, '/requests'),
      });

      expect(securityLogger.logUnauthorizedAccess).toHaveBeenCalledWith(
        mockTL.id,
        mockTL.role,
        '/requests',
        expect.stringContaining('Insufficient role permissions'),
        'role_violation'
      );
    });
  });

  describe('/swap-requests route protection', () => {
    it('should allow agent role to access /swap-requests', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['agent', 'tl']}>
          <div data-testid="swap-requests-page">Swap Requests</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockAgent, '/swap-requests'),
      });

      expect(screen.getByTestId('swap-requests-page')).toBeInTheDocument();
      expect(screen.getByText('Swap Requests')).toBeInTheDocument();
      expect(securityLogger.logUnauthorizedAccess).not.toHaveBeenCalled();
    });

    it('should allow tl role to access /swap-requests', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['agent', 'tl']}>
          <div data-testid="swap-requests-page">Swap Requests</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockTL, '/swap-requests'),
      });

      expect(screen.getByTestId('swap-requests-page')).toBeInTheDocument();
      expect(screen.getByText('Swap Requests')).toBeInTheDocument();
      expect(securityLogger.logUnauthorizedAccess).not.toHaveBeenCalled();
    });

    it('should redirect wfm role from /swap-requests to dashboard', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['agent', 'tl']}>
          <div data-testid="swap-requests-page">Swap Requests</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockWFM, '/swap-requests'),
      });

      expect(screen.queryByTestId('swap-requests-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should log unauthorized access when wfm tries to access /swap-requests', () => {
      const TestComponent = () => (
        <ProtectedRoute requiredRoles={['agent', 'tl']}>
          <div data-testid="swap-requests-page">Swap Requests</div>
        </ProtectedRoute>
      );

      render(<TestComponent />, {
        wrapper: createWrapper(mockWFM, '/swap-requests'),
      });

      expect(securityLogger.logUnauthorizedAccess).toHaveBeenCalledWith(
        mockWFM.id,
        mockWFM.role,
        '/swap-requests',
        expect.stringContaining('Insufficient role permissions'),
        'role_violation'
      );
    });
  });
});
