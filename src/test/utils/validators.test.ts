import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  leaveRequestSchema,
  swapRequestSchema,
  commentSchema,
  employeeSchema,
} from '../../utils/validators'

describe('validators', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@dabdoob.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email domain', () => {
      const result = loginSchema.safeParse({
        email: 'test@gmail.com',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@dabdoob.com',
        password: 'short',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('signupSchema', () => {
    it('should validate valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'test@dabdoob.com',
        password: 'password123',
        name: 'John Doe',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const result = signupSchema.safeParse({
        email: 'test@dabdoob.com',
        password: 'password123',
        name: 'John Doe',
        confirmPassword: 'different',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const result = signupSchema.safeParse({
        email: 'test@dabdoob.com',
        password: 'password123',
        name: 'J',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('leaveRequestSchema', () => {
    it('should validate valid leave request', () => {
      const result = leaveRequestSchema.safeParse({
        leave_type: 'annual',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        notes: 'Vacation',
      })
      expect(result.success).toBe(true)
    })

    it('should reject end date before start date', () => {
      const result = leaveRequestSchema.safeParse({
        leave_type: 'annual',
        start_date: '2024-01-05',
        end_date: '2024-01-01',
        notes: 'Vacation',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('swapRequestSchema', () => {
    it('should validate valid swap request', () => {
      const result = swapRequestSchema.safeParse({
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        requester_shift_id: '123e4567-e89b-12d3-a456-426614174001',
        target_shift_id: '123e4567-e89b-12d3-a456-426614174002',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = swapRequestSchema.safeParse({
        target_user_id: 'invalid-uuid',
        requester_shift_id: '123e4567-e89b-12d3-a456-426614174001',
        target_shift_id: '123e4567-e89b-12d3-a456-426614174002',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('commentSchema', () => {
    it('should validate valid comment', () => {
      const result = commentSchema.safeParse({
        content: 'This is a comment',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty comment', () => {
      const result = commentSchema.safeParse({
        content: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('employeeSchema', () => {
    it('should validate valid employee data', () => {
      const result = employeeSchema.safeParse({
        name: 'John Doe',
        email: 'john@dabdoob.com',
        role: 'agent',
        status: 'active',
      })
      expect(result.success).toBe(true)
    })
  })
})
