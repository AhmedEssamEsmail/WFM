import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useNavigation } from '../../hooks/useNavigation';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper =
    (initialPath = '/') =>
    ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[initialPath]}>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    );

  it('should return empty nav items when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useNavigation(), { wrapper: wrapper() });

    expect(result.current.navItems).toEqual([]);
  });

  it('should filter nav items for agent role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'agent', name: 'Test Agent' },
    } as any);

    const { result } = renderHook(() => useNavigation(), { wrapper: wrapper() });

    const navNames = result.current.navItems.map((item) => item.name);
    expect(navNames).toContain('Dashboard');
    expect(navNames).toContain('Schedule');
    expect(navNames).toContain('Swap Requests');
    expect(navNames).not.toContain('Settings');
    expect(navNames).not.toContain('Requests');
  });

  it('should filter nav items for tl role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'tl', name: 'Test TL' },
    } as any);

    const { result } = renderHook(() => useNavigation(), { wrapper: wrapper() });

    const navNames = result.current.navItems.map((item) => item.name);
    expect(navNames).toContain('Dashboard');
    expect(navNames).toContain('Reports');
    expect(navNames).toContain('Headcount');
    expect(navNames).not.toContain('Settings');
    expect(navNames).not.toContain('Requests');
  });

  it('should show all nav items for wfm role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'wfm', name: 'Test WFM' },
    } as any);

    const { result } = renderHook(() => useNavigation(), { wrapper: wrapper() });

    const navNames = result.current.navItems.map((item) => item.name);
    expect(navNames).toContain('Dashboard');
    expect(navNames).toContain('Settings');
    expect(navNames).toContain('Requests');
    expect(navNames).toContain('Schedule Upload');
  });

  it('should detect active route correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'wfm', name: 'Test WFM' },
    } as any);

    const { result } = renderHook(() => useNavigation(), { wrapper: wrapper('/dashboard') });

    expect(result.current.isRouteActive('/dashboard')).toBe(true);
    expect(result.current.isRouteActive('/schedule')).toBe(false);
  });

  it('should detect active route with sub-paths', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'wfm', name: 'Test WFM' },
    } as any);

    const { result } = renderHook(() => useNavigation(), {
      wrapper: wrapper('/schedule/upload'),
    });

    expect(result.current.isRouteActive('/schedule')).toBe(true);
    expect(result.current.isRouteActive('/schedule/upload')).toBe(true);
    expect(result.current.isRouteActive('/dashboard')).toBe(false);
  });

  it('should return current path', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'agent', name: 'Test Agent' },
    } as any);

    const { result } = renderHook(() => useNavigation(), { wrapper: wrapper('/dashboard') });

    expect(result.current.currentPath).toBe('/dashboard');
  });

  it('should update nav items when user role changes', () => {
    const { rerender, result } = renderHook(() => useNavigation(), { wrapper: wrapper() });

    // Initially agent
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'agent', name: 'Test Agent' },
    } as any);
    rerender();

    const agentNavCount = result.current.navItems.length;

    // Change to wfm
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', role: 'wfm', name: 'Test WFM' },
    } as any);
    rerender();

    const wfmNavCount = result.current.navItems.length;

    expect(wfmNavCount).toBeGreaterThan(agentNavCount);
  });
});
