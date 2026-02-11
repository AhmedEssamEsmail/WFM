import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from '../../services/authService'
import { supabase } from '../../lib/supabase'
import type { User } from '../../types'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

// Test data
const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000'
const TEST_EMAIL = 'test@dabdoob.com'
const TEST_PASSWORD = 'SecurePassword123!'
const TEST_NAME = 'Test User'

const mockUser: User = {
  id: TEST_UUID,
  email: TEST_EMAIL,
  name: TEST_NAME,
  role: 'agent',
  created_at: '2024-01-01T00:00:00Z',
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should sign up a new user successfully', async () => {
      const mockData = {
        user: { id: TEST_UUID, email: TEST_EMAIL },
        session: { access_token: 'token' },
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockData,
        error: null,
      } as any)

      const result = await authService.signUp(TEST_EMAIL, TEST_PASSWORD, TEST_NAME)

      expect(result).toEqual(mockData)
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: { name: TEST_NAME },
        },
      })
    })

    it('should throw error when sign up fails', async () => {
      const mockError = new Error('Email already registered')

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any)

      await expect(
        authService.signUp(TEST_EMAIL, TEST_PASSWORD, TEST_NAME)
      ).rejects.toThrow('Email already registered')
    })

    it('should throw error for invalid email format', async () => {
      const mockError = new Error('Invalid email format')

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any)

      await expect(
        authService.signUp('invalid-email', TEST_PASSWORD, TEST_NAME)
      ).rejects.toThrow('Invalid email format')
    })

    it('should throw error for weak password', async () => {
      const mockError = new Error('Password should be at least 6 characters')

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any)

      await expect(
        authService.signUp(TEST_EMAIL, '123', TEST_NAME)
      ).rejects.toThrow('Password should be at least 6 characters')
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockData = {
        user: { id: TEST_UUID, email: TEST_EMAIL },
        session: { access_token: 'token' },
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: mockData,
        error: null,
      } as any)

      const result = await authService.signIn(TEST_EMAIL, TEST_PASSWORD)

      expect(result).toEqual(mockData)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
    })

    it('should throw error for invalid credentials', async () => {
      const mockError = new Error('Invalid login credentials')

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any)

      await expect(
        authService.signIn(TEST_EMAIL, 'wrong-password')
      ).rejects.toThrow('Invalid login credentials')
    })

    it('should throw error for non-existent user', async () => {
      const mockError = new Error('Invalid login credentials')

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any)

      await expect(
        authService.signIn('nonexistent@dabdoob.com', TEST_PASSWORD)
      ).rejects.toThrow('Invalid login credentials')
    })
  })

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any)

      await expect(authService.signOut()).resolves.toBeUndefined()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed')

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError,
      } as any)

      await expect(authService.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('getSession', () => {
    it('should get current session successfully', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: TEST_UUID, email: TEST_EMAIL },
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any)

      const result = await authService.getSession()

      expect(result).toEqual(mockSession)
      expect(supabase.auth.getSession).toHaveBeenCalled()
    })

    it('should return null when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)

      const result = await authService.getSession()

      expect(result).toBeNull()
    })

    it('should throw error when session fetch fails', async () => {
      const mockError = new Error('Session fetch failed')

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: mockError,
      } as any)

      await expect(authService.getSession()).rejects.toThrow('Session fetch failed')
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await authService.getUserProfile(TEST_UUID)

      expect(result).toEqual(mockUser)
      expect(supabase.from).toHaveBeenCalledWith('users')
    })

    it('should throw error when user not found', async () => {
      const mockError = new Error('User not found')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any)

      await expect(authService.getUserProfile(TEST_UUID)).rejects.toThrow('User not found')
    })

    it('should throw error for invalid user ID', async () => {
      const mockError = new Error('Invalid UUID')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any)

      await expect(authService.getUserProfile('invalid-id')).rejects.toThrow('Invalid UUID')
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = { name: 'Updated Name' }
      const updatedUser = { ...mockUser, ...updates }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await authService.updateUserProfile(TEST_UUID, updates)

      expect(result).toEqual(updatedUser)
      expect(supabase.from).toHaveBeenCalledWith('users')
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any)

      await expect(
        authService.updateUserProfile(TEST_UUID, { name: 'New Name' })
      ).rejects.toThrow('Update failed')
    })

    it('should handle partial updates', async () => {
      const updates = { name: 'New Name' }
      const updatedUser = { ...mockUser, ...updates }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await authService.updateUserProfile(TEST_UUID, updates)

      expect(result.name).toBe('New Name')
      expect(result.email).toBe(TEST_EMAIL)
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any)

      await expect(authService.resetPassword(TEST_EMAIL)).resolves.toBeUndefined()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(TEST_EMAIL)
    })

    it('should throw error when reset fails', async () => {
      const mockError = new Error('Email not found')

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: mockError,
      } as any)

      await expect(authService.resetPassword(TEST_EMAIL)).rejects.toThrow('Email not found')
    })

    it('should throw error for invalid email', async () => {
      const mockError = new Error('Invalid email format')

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: mockError,
      } as any)

      await expect(authService.resetPassword('invalid-email')).rejects.toThrow(
        'Invalid email format'
      )
    })
  })

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: TEST_UUID } },
        error: null,
      } as any)

      await expect(authService.updatePassword('NewPassword123!')).resolves.toBeUndefined()
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123!',
      })
    })

    it('should throw error when password update fails', async () => {
      const mockError = new Error('Password update failed')

      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      } as any)

      await expect(authService.updatePassword('NewPassword123!')).rejects.toThrow(
        'Password update failed'
      )
    })

    it('should throw error for weak password', async () => {
      const mockError = new Error('Password should be at least 6 characters')

      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      } as any)

      await expect(authService.updatePassword('123')).rejects.toThrow(
        'Password should be at least 6 characters'
      )
    })
  })
})
