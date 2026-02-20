import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { UserRole } from '../types';

export interface UseRoleCheckReturn {
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  isManager: boolean;
  isAgent: boolean;
  isWFM: boolean;
  isTL: boolean;
}

/**
 * Custom hook for component-level role-based authorization
 * Provides utilities for checking user roles in components
 *
 * @throws {Error} In development mode if used outside AuthContext
 * @returns {UseRoleCheckReturn} Role checking utilities
 *
 * @example
 * ```tsx
 * const { isManager, hasRole } = useRoleCheck()
 *
 * if (isManager) {
 *   return <CoverageOverview />
 * }
 *
 * if (hasRole(['agent', 'tl'])) {
 *   return <SwapRequestButton />
 * }
 * ```
 */
export function useRoleCheck(): UseRoleCheckReturn {
  const { user, loading } = useAuth();

  // Memoize role checks to avoid unnecessary re-renders
  // Must be called unconditionally before any returns
  const roleChecks = useMemo(() => {
    // Error handling for usage outside AuthContext
    if (!user && !loading) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useRoleCheck must be used within AuthContext with an authenticated user');
      }
      // Safe defaults in production - deny all permissions
      return {
        hasRole: () => false,
        hasAnyRole: () => false,
        hasAllRoles: () => false,
        isManager: false,
        isAgent: false,
        isWFM: false,
        isTL: false,
      };
    }

    // Return safe defaults during loading
    if (loading || !user) {
      return {
        hasRole: () => false,
        hasAnyRole: () => false,
        hasAllRoles: () => false,
        isManager: false,
        isAgent: false,
        isWFM: false,
        isTL: false,
      };
    }

    const userRole = user.role;

    /**
     * Check if user has a specific role or any role from an array
     * @param roles - Single role or array of roles to check
     */
    const hasRole = (roles: UserRole | UserRole[]): boolean => {
      if (Array.isArray(roles)) {
        return roles.includes(userRole);
      }
      return userRole === roles;
    };

    /**
     * Check if user has at least one of the specified roles
     * @param roles - Array of roles to check
     */
    const hasAnyRole = (roles: UserRole[]): boolean => {
      return roles.includes(userRole);
    };

    /**
     * Check if user has all of the specified roles
     * Note: Since a user can only have one role, this only returns true
     * if the roles array contains exactly one role that matches the user's role
     * @param roles - Array of roles to check
     */
    const hasAllRoles = (roles: UserRole[]): boolean => {
      return roles.length === 1 && roles[0] === userRole;
    };

    return {
      hasRole,
      hasAnyRole,
      hasAllRoles,
      isManager: userRole === 'tl' || userRole === 'wfm',
      isAgent: userRole === 'agent',
      isWFM: userRole === 'wfm',
      isTL: userRole === 'tl',
    };
  }, [user, loading]);

  return roleChecks;
}
