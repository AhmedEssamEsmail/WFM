// Form validation schemas using Zod

import { z } from 'zod'
import { VALIDATION, ALLOWED_EMAIL_DOMAIN, REGEX } from '../constants'

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(VALIDATION.EMAIL_MAX_LENGTH, `Email must be less than ${VALIDATION.EMAIL_MAX_LENGTH} characters`)
    .refine(
      (email) => email.endsWith(ALLOWED_EMAIL_DOMAIN),
      `Email must be from ${ALLOWED_EMAIL_DOMAIN} domain`
    ),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD_MAX_LENGTH, `Password must be less than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`),
})

export const signupSchema = loginSchema.extend({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .regex(REGEX.ALPHA_SPACES, 'Name can only contain letters and spaces'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// ============================================
// LEAVE REQUEST SCHEMAS
// ============================================

export const leaveRequestSchema = z.object({
  leave_type: z.enum(['sick', 'annual', 'casual', 'public_holiday', 'bereavement']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  notes: z
    .string()
    .max(VALIDATION.NOTES_MAX_LENGTH, `Notes must be less than ${VALIDATION.NOTES_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
}).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return start <= end
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
)

// ============================================
// SWAP REQUEST SCHEMAS
// ============================================

export const swapRequestSchema = z.object({
  target_user_id: z.string().uuid('Invalid user ID'),
  requester_shift_id: z.string().uuid('Invalid shift ID'),
  target_shift_id: z.string().uuid('Invalid shift ID'),
})

// ============================================
// COMMENT SCHEMAS
// ============================================

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(VALIDATION.COMMENT_MAX_LENGTH, `Comment must be less than ${VALIDATION.COMMENT_MAX_LENGTH} characters`),
})

// ============================================
// EMPLOYEE/HEADCOUNT SCHEMAS
// ============================================

export const employeeSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`),
  email: z
    .string()
    .email('Invalid email address')
    .max(VALIDATION.EMAIL_MAX_LENGTH),
  employee_id: z
    .string()
    .regex(VALIDATION.EMPLOYEE_ID_PATTERN, 'Employee ID must be 4-10 alphanumeric characters')
    .optional()
    .nullable(),
  role: z.enum(['agent', 'tl', 'wfm']),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated', 'suspended']),
  department: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  job_title: z.string().optional().nullable(),
  job_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'director']).optional().nullable(),
  employment_type: z.enum(['full_time', 'part_time', 'contractor', 'intern']).optional().nullable(),
  location: z.string().optional().nullable(),
  time_zone: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(VALIDATION.PHONE_PATTERN, 'Invalid phone number format')
    .optional()
    .nullable(),
})

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const settingsSchema = z.object({
  wfm_auto_approve: z.boolean(),
  allow_leave_exceptions: z.boolean(),
})

// ============================================
// CSV UPLOAD SCHEMAS
// ============================================

export const csvShiftSchema = z.object({
  user_email: z.string().email(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  shift_type: z.enum(['AM', 'PM', 'BET', 'OFF']),
})

export const csvLeaveBalanceSchema = z.object({
  user_email: z.string().email(),
  leave_type: z.enum(['sick', 'annual', 'casual', 'public_holiday', 'bereavement']),
  balance: z.number().min(0),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>
export type SwapRequestInput = z.infer<typeof swapRequestSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type EmployeeInput = z.infer<typeof employeeSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
export type CSVShiftInput = z.infer<typeof csvShiftSchema>
export type CSVLeaveBalanceInput = z.infer<typeof csvLeaveBalanceSchema>
