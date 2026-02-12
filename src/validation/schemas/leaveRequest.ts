/**
 * Leave request validation schemas
 * Zod schemas for leave request data validation
 */

import { z } from 'zod'
import { uuidSchema, isoDateSchema, nonNegativeNumberSchema } from './common'
import { VALIDATION } from '../../constants'

// ============================================
// Leave Type Schema
// ============================================

/**
 * Leave type schema - accepts any non-empty string
 * Database is the source of truth for valid leave types
 */
export const leaveTypeSchema = z
  .string()
  .min(1, 'Leave type is required')

// ============================================
// Leave Request Schemas
// ============================================

/**
 * Leave request creation schema
 */
export const leaveRequestCreateSchema = z
  .object({
    leave_type: leaveTypeSchema,
    start_date: isoDateSchema,
    end_date: isoDateSchema,
    notes: z
      .string()
      .max(
        VALIDATION.NOTES_MAX_LENGTH,
        `Notes must be less than ${VALIDATION.NOTES_MAX_LENGTH} characters`
      )
      .optional()
      .nullable(),
  })
  .refine(
    (data) => new Date(data.start_date) <= new Date(data.end_date),
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )

/**
 * Leave request validation data schema
 * Used for internal validation logic
 */
export const leaveRequestValidationSchema = z.object({
  userId: uuidSchema,
  leaveType: leaveTypeSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  requestedDays: nonNegativeNumberSchema,
})

/**
 * Leave balance schema
 */
export const leaveBalanceSchema = z.object({
  user_id: uuidSchema,
  leave_type: leaveTypeSchema,
  balance: nonNegativeNumberSchema,
  year: z.number().int().min(2000).max(2100),
})

/**
 * CSV leave balance schema
 */
export const csvLeaveBalanceSchema = z.object({
  user_email: z.string().email(),
  leave_type: leaveTypeSchema,
  balance: z.number().min(0),
})

// ============================================
// Type Exports
// ============================================

export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>
export type LeaveRequestValidationData = z.infer<typeof leaveRequestValidationSchema>
export type LeaveBalance = z.infer<typeof leaveBalanceSchema>
export type CSVLeaveBalanceInput = z.infer<typeof csvLeaveBalanceSchema>
