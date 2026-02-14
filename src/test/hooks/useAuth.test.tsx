import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import { AuthContext } from '../../lib/AuthContext'
import type { User } from '../../types'

// Mock user data
const mockAgent: User = {
  id: '1',
  email: 'agent@dabdoob.com',
  name: 'Test Agent',
  role: 'agent',
  created_at: '2024-01-01'
}

const mockTL: User = {
  id: '2',
  email: 'tl@dabdoob.com',
  name: 'Test TL',
  role: 'tl',
  created_at: '2024-01-01'
}

const mockWFM: User = {
  id: '3',
  email: 'wfm@dabdoob.com',
  name: 'Test WFM',
  role: 'wfm',
  created_at: '2024-01-01'
}

const createWrapper = (user: User | null) => {
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
  )
}

describe('useAuth Hook', () => {
  describe('Role checking', () => {
    it('should identify agent role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAgent),
      })

      expect(result.current.isAgent()).toBe(true)
      expect(result.current.isTL()).toBe(false)
      expect(result.current.isWFM()).toBe(false)
    })

    it('should identify TL role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockTL),
      })

      expect(result.current.isAgent()).toBe(false)
      expect(result.current.isTL()).toBe(true)
      expect(result.current.isWFM()).toBe(false)
    })

    it('should identify WFM role', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockWFM),
      })

      expect(result.current.isAgent()).toBe(false)
      expect(result.current.isTL()).toBe(false)
      expect(result.current.isWFM()).toBe(true)
    })

    it('should check hasRole with multiple roles', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockTL),
      })

      expect(result.current.hasRole(['tl', 'wfm'])).toBe(true)
      expect(result.current.hasRole(['agent'])).toBe(false)
    })
  })

  describe('Headcount permissions', () => {
    it('should allow TL to view headcount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockTL),
      })

      expect(result.current.canViewHeadcount()).toBe(true)
      expect(result.current.canEditHeadcount()).toBe(false)
    })

    it('should allow WFM to view and edit headcount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockWFM),
      })

      expect(result.current.canViewHeadcount()).toBe(true)
      expect(result.current.canEditHeadcount()).toBe(true)
    })

    it('should not allow agent to view headcount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAgent),
      })

      expect(result.current.canViewHeadcount()).toBe(false)
      expect(result.current.canEditHeadcount()).toBe(false)
    })

    it('should only allow WFM to edit employees', () => {
      const wfmHook = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockWFM),
      })
      const tlHook = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockTL),
      })

      expect(wfmHook.result.current.canEditEmployee('any-id')).toBe(true)
      expect(tlHook.result.current.canEditEmployee('any-id')).toBe(false)
    })
  })

  describe('No user', () => {
    it('should return false for all role checks when no user', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      })

      expect(result.current.isAgent()).toBe(false)
      expect(result.current.isTL()).toBe(false)
      expect(result.current.isWFM()).toBe(false)
      expect(result.current.canViewHeadcount()).toBe(false)
      expect(result.current.canEditHeadcount()).toBe(false)
    })
  })
})



