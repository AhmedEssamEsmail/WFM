/**
 * User and authentication validation schemas
 * Zod schemas for user data and auth validation
 */

import { z } from 'zod'
import { uuidSchema, emailSchema, domainEmailSchema } from './common'
import { VALIDATION, getAllowedEmailDomain, REGEX } from '../../constants'

// ============================================
// Auth Schemas
// ============================================

/**
 * Login schema
 * Uses lazy evaluation to get the allowed email domain at runtime
 */
export const loginSchema = z.object({
  email: z.lazy(() => 
    domainEmailSchema(getAllowedEmailDomain()).max(
      VALIDATION.EMAIL_MAX_LENGTH,
      `Email must be less than ${VALIDATION.EMAIL_MAX_LENGTH} characters`
    )
  ),
  password: z
    .string()
    .min(
      VALIDATION.PASSWORD_MIN_LENGTH,
      `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
    )
    .max(
      VALIDATION.PASSWORD_MAX_LENGTH,
      `Password must be less than ${VALIDATION.PASSWORD_MAX_LENGTH} characters`
    ),
})

/**
 * Signup schema
 */
export const signupSchema = loginSchema
  .extend({
    name: z
      .string()
      .min(
        VALIDATION.NAME_MIN_LENGTH,
        `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.NAME_MAX_LENGTH,
        `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`
      )
      .regex(REGEX.ALPHA_SPACES, 'Name can only contain letters and spaces'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// ============================================
// User/Employee Schemas
// ============================================

/**
 * User role schema
 */
export const userRoleSchema = z.enum(['agent', 'tl', 'wfm'])

/**
 * User status schema
 */
export const userStatusSchema = z.enum([
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'suspended',
])

/**
 * Job level schema
 */
export const jobLevelSchema = z.enum([
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'manager',
  'director',
])

/**
 * Employment type schema
 */
export const employmentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contractor',
  'intern',
])

/**
 * Employee/user schema
 */
export const employeeSchema = z.object({
  name: z
    .string()
    .min(
      VALIDATION.NAME_MIN_LENGTH,
      `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`
    )
    .max(
      VALIDATION.NAME_MAX_LENGTH,
      `Name must be less than ${VALIDATION.NAME_MAX_LENGTH} characters`
    ),
  email: emailSchema.max(VALIDATION.EMAIL_MAX_LENGTH),
  employee_id: z
    .string()
    .regex(
      VALIDATION.EMPLOYEE_ID_PATTERN,
      'Employee ID must be 4-10 alphanumeric characters'
    )
    .optional()
    .nullable(),
  role: userRoleSchema,
  status: userStatusSchema,
  department: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  manager_id: uuidSchema.optional().nullable(),
  job_title: z.string().optional().nullable(),
  job_level: jobLevelSchema.optional().nullable(),
  employment_type: employmentTypeSchema.optional().nullable(),
  location: z.string().optional().nullable(),
  time_zone: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(VALIDATION.PHONE_PATTERN, 'Invalid phone number format')
    .optional()
    .nullable(),
})

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
export type JobLevel = z.infer<typeof jobLevelSchema>
export type EmploymentType = z.infer<typeof employmentTypeSchema>
export type EmployeeInput = z.infer<typeof employeeSchema>
