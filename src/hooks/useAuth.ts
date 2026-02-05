import { useContext, useCallback } from 'react'
import { AuthContext } from '../lib/AuthContext'
import type { UserRole } from '../types'

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const { user } = context

  // Role checking helpers
  const isWFM = useCallback(() => user?.role === 'wfm', [user])
  const isTL = useCallback(() => user?.role === 'tl', [user])
  const isAgent = useCallback(() => user?.role === 'agent', [user])
  const hasRole = useCallback((roles: UserRole[]) => user ? roles.includes(user.role) : false, [user])

  // Headcount permissions
  const canViewHeadcount = useCallback(() => user ? ['tl', 'wfm'].includes(user.role) : false, [user])
  const canEditHeadcount = useCallback(() => user?.role === 'wfm', [user])
  const canEditEmployee = useCallback((employeeUserId: string) => {
    // WFM can edit anyone, TL can only view (not edit)
    return user?.role === 'wfm'
  }, [user])

  return {
    ...context,
    // Role helpers
    isWFM,
    isTL,
    isAgent,
    hasRole,
    // Headcount permissions
    canViewHeadcount,
    canEditHeadcount,
    canEditEmployee,
  }
}
