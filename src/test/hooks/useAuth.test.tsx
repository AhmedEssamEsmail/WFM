import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../types';

// Mock user data
const mockAgent: User = {
  id: '1',
  email: 'agent@dabdoob.com',
  name: 'Test Agent',
  role: 'agent',
  created_at: '2024-01-01',
};

const mockTL: User = {
  id: '2',
  email: 'tl@dabdoob.com',
  name: 'Test TL',
  role: 'tl',
  created_at: '2024-01-01',
};

const mockWFM: User = {
  id: '3',
  email: 'wfm@dabdoob.com',
  name: 'Test WFM',
  role: 'wfm',
  created_at: '2024-01-01',
};

const createQueryWrapper = (user: User | null) => {
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
        signOut: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

describe('useAuth Hook', () => {
  describe('Role checking', () => {
    it('should identify agent role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockAgent),
      });

      expect(result.current.isAgent()).toBe(true);
      expect(result.current.isTL()).toBe(false);
      expect(result.current.isWFM()).toBe(false);
    });

    it('should identify TL role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockTL),
      });

      expect(result.current.isAgent()).toBe(false);
      expect(result.current.isTL()).toBe(true);
      expect(result.current.isWFM()).toBe(false);
    });

    it('should identify WFM role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockWFM),
      });

      expect(result.current.isAgent()).toBe(false);
      expect(result.current.isTL()).toBe(false);
      expect(result.current.isWFM()).toBe(true);
    });

    it('should check hasRole with multiple roles', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockTL),
      });

      expect(result.current.hasRole(['tl', 'wfm'])).toBe(true);
      expect(result.current.hasRole(['agent'])).toBe(false);
    });
  });

  describe('Headcount permissions', () => {
    it('should allow TL to view headcount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockTL),
      });

      expect(result.current.canViewHeadcount()).toBe(true);
      expect(result.current.canEditHeadcount()).toBe(false);
    });

    it('should allow WFM to view and edit headcount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockWFM),
      });

      expect(result.current.canViewHeadcount()).toBe(true);
      expect(result.current.canEditHeadcount()).toBe(true);
    });

    it('should not allow agent to view headcount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockAgent),
      });

      expect(result.current.canViewHeadcount()).toBe(false);
      expect(result.current.canEditHeadcount()).toBe(false);
    });

    it('should only allow WFM to edit employees', () => {
      const wfmHook = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockWFM),
      });
      const tlHook = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(mockTL),
      });

      expect(wfmHook.result.current.canEditEmployee('any-id')).toBe(true);
      expect(tlHook.result.current.canEditEmployee('any-id')).toBe(false);
    });
  });

  describe('No user', () => {
    it('should return false for all role checks when no user', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createQueryWrapper(null),
      });

      expect(result.current.isAgent()).toBe(false);
      expect(result.current.isTL()).toBe(false);
      expect(result.current.isWFM()).toBe(false);
      expect(result.current.canViewHeadcount()).toBe(false);
      expect(result.current.canEditHeadcount()).toBe(false);
    });
  });

  describe('Authentication state management', () => {
    it('should expose authentication state from context', () => {
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: mockWFM.id,
          email: mockWFM.email,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: mockWFM.created_at,
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: mockWFM,
            supabaseUser: mockSession.user as any,
            session: mockSession as any,
            loading: false,
            isAuthenticated: true,
            signUp: async () => ({ error: null }),
            signIn: async () => ({ error: null, session: mockSession as any }),
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual(mockWFM);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it('should expose signIn function from context', () => {
      const mockSignIn = vi.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: null,
            supabaseUser: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            signUp: async () => ({ error: null }),
            signIn: mockSignIn,
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.signIn).toBe(mockSignIn);
    });

    it('should expose signOut function from context', () => {
      const mockSignOut = vi.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: mockWFM,
            supabaseUser: null,
            session: null,
            loading: false,
            isAuthenticated: true,
            signUp: async () => ({ error: null }),
            signIn: async () => ({ error: null, session: null }),
            signOut: mockSignOut,
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.signOut).toBe(mockSignOut);
    });

    it('should expose signUp function from context', () => {
      const mockSignUp = vi.fn();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: null,
            supabaseUser: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            signUp: mockSignUp,
            signIn: async () => ({ error: null, session: null }),
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.signUp).toBe(mockSignUp);
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = consoleError;
    });

    it('should handle authentication errors from context', () => {
      const mockError = new Error('Invalid credentials');
      const mockSignIn = vi.fn().mockResolvedValue({ error: mockError, session: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: null,
            supabaseUser: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            signUp: async () => ({ error: null }),
            signIn: mockSignIn,
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.signIn).toBeDefined();
      // The hook exposes the signIn function which can return errors
      result.current.signIn('test@example.com', 'wrong-password').then((response) => {
        expect(response.error).toEqual(mockError);
      });
    });
  });

  describe('Session and token handling', () => {
    it('should reflect loading state during authentication', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: null,
            supabaseUser: null,
            session: null,
            loading: true,
            isAuthenticated: false,
            signUp: async () => ({ error: null }),
            signIn: async () => ({ error: null, session: null }),
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle session expiration (no session, no user)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: null,
            supabaseUser: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            signUp: async () => ({ error: null }),
            signIn: async () => ({ error: null, session: null }),
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should maintain session data when authenticated', () => {
      const mockSession = {
        access_token: 'valid-token',
        refresh_token: 'valid-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: mockAgent.id,
          email: mockAgent.email,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: mockAgent.created_at,
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
          value={{
            user: mockAgent,
            supabaseUser: mockSession.user as any,
            session: mockSession as any,
            loading: false,
            isAuthenticated: true,
            signUp: async () => ({ error: null }),
            signIn: async () => ({ error: null, session: mockSession as any }),
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.supabaseUser).toEqual(mockSession.user);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
