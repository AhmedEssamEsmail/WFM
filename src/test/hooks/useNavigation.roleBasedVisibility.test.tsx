import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigation } from '../../hooks/useNavigation';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../types';

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

const createWrapper = (user: User | null, initialPath: string = '/') => {
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
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('useNavigation - Role-Based Visibility', () => {
  describe('Agent role navigation', () => {
    it('should show "Swap Requests" but not "Requests" for agent', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockAgent),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).toContain('Swap Requests');
      expect(navItemNames).not.toContain('Requests');
    });

    it('should include common items for agent', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockAgent),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).toContain('Dashboard');
      expect(navItemNames).toContain('Schedule');
      expect(navItemNames).toContain('Leave Requests');
      expect(navItemNames).toContain('Overtime Requests');
    });

    it('should not include manager-only items for agent', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockAgent),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).not.toContain('Reports');
      expect(navItemNames).not.toContain('Headcount');
      expect(navItemNames).not.toContain('Settings');
      expect(navItemNames).not.toContain('Schedule Upload');
    });
  });

  describe('TL role navigation', () => {
    it('should show "Swap Requests" but not "Requests" for tl', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockTL),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).toContain('Swap Requests');
      expect(navItemNames).not.toContain('Requests');
    });

    it('should include manager items for tl', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockTL),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).toContain('Reports');
      expect(navItemNames).toContain('Headcount');
    });

    it('should not include wfm-only items for tl', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockTL),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).not.toContain('Settings');
      expect(navItemNames).not.toContain('Schedule Upload');
      expect(navItemNames).not.toContain('Requests');
    });
  });

  describe('WFM role navigation', () => {
    it('should show "Requests" but not "Swap Requests" for wfm', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockWFM),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).toContain('Requests');
      expect(navItemNames).not.toContain('Swap Requests');
    });

    it('should include all wfm-specific items', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockWFM),
      });

      const navItems = result.current.navItems;
      const navItemNames = navItems.map((item) => item.name);

      expect(navItemNames).toContain('Settings');
      expect(navItemNames).toContain('Schedule Upload');
      expect(navItemNames).toContain('Reports');
      expect(navItemNames).toContain('Headcount');
    });
  });

  describe('Navigation item counts', () => {
    it('should have correct number of items for each role', () => {
      const agentHook = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockAgent),
      });
      const tlHook = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockTL),
      });
      const wfmHook = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockWFM),
      });

      // Agent should have fewer items than managers
      expect(agentHook.result.current.navItems.length).toBeLessThan(
        tlHook.result.current.navItems.length
      );

      // WFM should have the most items
      expect(wfmHook.result.current.navItems.length).toBeGreaterThan(
        agentHook.result.current.navItems.length
      );
    });
  });

  describe('Route active detection', () => {
    it('should correctly identify active routes', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(mockAgent, '/swap-requests'),
      });

      expect(result.current.isRouteActive('/swap-requests')).toBe(true);
      expect(result.current.isRouteActive('/dashboard')).toBe(false);
      expect(result.current.currentPath).toBe('/swap-requests');
    });
  });
});
