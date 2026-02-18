import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRoleCheck } from '../../hooks/useRoleCheck'
import { AuthContext } from '../../contexts/AuthContext'
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

describe('useRoleCheck Hook', () => {
  describe('Convenience boolean properties', () => {
    it('should identify agent role correctly', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockAgent),
      })

      expect(result.current.isAgent).toBe(true)
      expect(result.current.isTL).toBe(false)
      expect(result.current.isWFM).toBe(false)
      expect(result.current.isManager).toBe(false)
    })

    it('should identify TL role correctly', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockTL),
      })

      expect(result.current.isAgent).toBe(false)
      expect(result.current.isTL).toBe(true)
      expect(result.current.isWFM).toBe(false)
      expect(result.current.isManager).toBe(true)
    })

    it('should identify WFM role correctly', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockWFM),
      })

      expect(result.current.isAgent).toBe(false)
      expect(result.current.isTL).toBe(false)
      expect(result.current.isWFM).toBe(true)
      expect(result.current.isManager).toBe(true)
    })
  })

  describe('hasRole function', () => {
    it('should return true when user has the single specified role', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockAgent),
      })

      expect(result.current.hasRole('agent')).toBe(true)
      expect(result.current.hasRole('tl')).toBe(false)
      expect(result.current.hasRole('wfm')).toBe(false)
    })

    it('should return true when user role is in the array', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockTL),
      })

      expect(result.current.hasRole(['tl', 'wfm'])).toBe(true)
      expect(result.current.hasRole(['agent', 'tl'])).toBe(true)
      expect(result.current.hasRole(['agent'])).toBe(false)
    })

    it('should work with all role combinations', () => {
      const agentHook = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockAgent),
      })
      const tlHook = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockTL),
      })
      const wfmHook = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockWFM),
      })

      // Test agent
      expect(agentHook.result.current.hasRole(['agent', 'tl', 'wfm'])).toBe(true)
      expect(agentHook.result.current.hasRole(['tl', 'wfm'])).toBe(false)

      // Test TL
      expect(tlHook.result.current.hasRole(['agent', 'tl', 'wfm'])).toBe(true)
      expect(tlHook.result.current.hasRole(['agent', 'wfm'])).toBe(false)

      // Test WFM
      expect(wfmHook.result.current.hasRole(['agent', 'tl', 'wfm'])).toBe(true)
      expect(wfmHook.result.current.hasRole(['agent', 'tl'])).toBe(false)
    })
  })

  describe('hasAnyRole function', () => {
    it('should return true when user has at least one of the specified roles', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockTL),
      })

      expect(result.current.hasAnyRole(['tl', 'wfm'])).toBe(true)
      expect(result.current.hasAnyRole(['agent', 'tl'])).toBe(true)
      expect(result.current.hasAnyRole(['agent'])).toBe(false)
    })

    it('should return false when user has none of the specified roles', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockAgent),
      })

      expect(result.current.hasAnyRole(['tl', 'wfm'])).toBe(false)
    })
  })

  describe('hasAllRoles function', () => {
    it('should return true only when array has single role matching user role', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockAgent),
      })

      expect(result.current.hasAllRoles(['agent'])).toBe(true)
      expect(result.current.hasAllRoles(['tl'])).toBe(false)
    })

    it('should return false when array has multiple roles', () => {
      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(mockTL),
      })

      // Even though user is TL, hasAllRoles returns false for multiple roles
      // because a user can only have one role
      expect(result.current.hasAllRoles(['tl', 'wfm'])).toBe(false)
      expect(result.current.hasAllRoles(['tl'])).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should throw error in development when used outside AuthContext', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      expect(() => {
        renderHook(() => useRoleCheck(), {
          wrapper: createWrapper(null),
        })
      }).toThrow('useRoleCheck must be used within AuthContext with an authenticated user')

      process.env.NODE_ENV = originalEnv
    })

    it('should return safe defaults in production when no user', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const { result } = renderHook(() => useRoleCheck(), {
        wrapper: createWrapper(null),
      })

      expect(result.current.isAgent).toBe(false)
      expect(result.current.isTL).toBe(false)
      expect(result.current.isWFM).toBe(false)
      expect(result.current.isManager).toBe(false)
      expect(result.current.hasRole('agent')).toBe(false)
      expect(result.current.hasRole(['agent', 'tl'])).toBe(false)
      expect(result.current.hasAnyRole(['agent', 'tl'])).toBe(false)
      expect(result.current.hasAllRoles(['agent'])).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })
})
