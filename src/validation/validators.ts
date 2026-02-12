/**
 * Imperative validators derived from Zod schemas
 * These validators throw ValidationError on failure for backward compatibility
 */

import { ValidationError } from '../types/errors'
import {
  uuidSchema,
  isoDateSchema,
  dateRangeSchema,
  futureDateSchema,
  emailSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
  nonEmptyStringSchema,
} from './schemas/common'
import {
  leaveTypeSchema,
  leaveRequestValidationSchema,
} from './schemas/leaveRequest'
import {
  shiftTypeSchema,
  swapRequestValidationSchema,
} from './schemas/swapRequest'

// ============================================
// Common Validators
// ============================================

/**
 * Validates that a UUID is in valid format
 */
export function validateUUID(id: string, fieldName: string = 'id'): void {
  const result = uuidSchema.safeParse(id)
  if (!result.success) {
    throw new ValidationError(fieldName, id, result.error.issues[0].message)
  }
}

/**
 * Validates that a date string is in ISO 8601 format (YYYY-MM-DD)
 */
export function validateDateFormat(
  date: string,
  fieldName: string = 'date'
): void {
  const result = isoDateSchema.safeParse(date)
  if (!result.success) {
    throw new ValidationError(fieldName, date, result.error.issues[0].message)
  }
}

/**
 * Validates that a date range is valid (start <= end)
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startFieldName: string = 'start_date',
  endFieldName: string = 'end_date'
): void {
  const result = dateRangeSchema.safeParse({
    start_date: startDate,
    end_date: endDate,
  })
  if (!result.success) {
    const error = result.error.issues[0]
    const fieldName = error.path[0] === 'start_date' ? startFieldName : endFieldName
    throw new ValidationError(fieldName, error.path[0] === 'start_date' ? startDate : endDate, error.message)
  }
}

/**
 * Validates that a date is not in the past
 */
export function validateFutureDate(
  date: string,
  fieldName: string = 'date',
  allowToday: boolean = true
): void {
  const schema = futureDateSchema(allowToday)
  const result = schema.safeParse(date)
  if (!result.success) {
    throw new ValidationError(fieldName, date, result.error.issues[0].message)
  }
}

/**
 * Validates email format
 */
export function validateEmail(
  email: string,
  fieldName: string = 'email'
): void {
  const result = emailSchema.safeParse(email)
  if (!result.success) {
    throw new ValidationError(fieldName, email, result.error.issues[0].message)
  }
}

/**
 * Validates that a number is positive
 */
export function validatePositiveNumber(
  value: number,
  fieldName: string = 'value'
): void {
  const result = positiveNumberSchema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(fieldName, value, result.error.issues[0].message)
  }
}

/**
 * Validates that a number is non-negative
 */
export function validateNonNegativeNumber(
  value: number,
  fieldName: string = 'value'
): void {
  const result = nonNegativeNumberSchema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(fieldName, value, result.error.issues[0].message)
  }
}

/**
 * Validates that a string is not empty
 */
export function validateNonEmptyString(
  value: string,
  fieldName: string = 'value'
): void {
  const result = nonEmptyStringSchema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(fieldName, value, result.error.issues[0].message)
  }
}

/**
 * Validates that a value is within a range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'value'
): void {
  validateNonNegativeNumber(value, fieldName)

  if (value < min || value > max) {
    throw new ValidationError(
      fieldName,
      value,
      `Must be between ${min} and ${max}`
    )
  }
}

// ============================================
// Leave Request Validators
// ============================================

/**
 * Validates that a leave type is valid
 * Note: This is a basic validation for backward compatibility.
 * For dynamic validation against the database, use leaveTypesService.getLeaveTypeByCode()
 */
export function validateLeaveType(leaveType: string): void {
  const result = leaveTypeSchema.safeParse(leaveType)
  if (!result.success) {
    throw new ValidationError(
      'leave_type',
      leaveType,
      result.error.issues[0].message
    )
  }
}

/**
 * Validates leave type against database configurations (async)
 */
export async function validateLeaveTypeAsync(
  leaveType: string
): Promise<boolean> {
  const { leaveTypesService } = await import('../services/leaveTypesService')
  try {
    const activeTypes = await leaveTypesService.getActiveLeaveTypes()
    const validLeaveCodes = activeTypes.map((t) => t.code)
    return validLeaveCodes.includes(leaveType)
  } catch {
    // If database fails, accept any non-empty string
    return !!(
      leaveType &&
      typeof leaveType === 'string' &&
      leaveType.trim().length > 0
    )
  }
}

/**
 * Validates leave request data
 */
export interface LeaveRequestValidationData {
  userId: string
  leaveType: string
  startDate: string
  endDate: string
  requestedDays: number
}

/**
 * Type-safe field accessor for validation errors
 * Safely retrieves a field value from an object using a path from Zod error
 */
function getFieldValue<T extends object, K extends keyof T>(
  data: T,
  field: string | number | symbol
): T[K] | undefined {
  if (typeof field === 'string' && field in data) {
    return data[field as K]
  }
  return undefined
}

export function validateLeaveRequestData(
  data: LeaveRequestValidationData
): void {
  const result = leaveRequestValidationSchema.safeParse(data)
  if (!result.success) {
    const error = result.error.issues[0]
    const fieldName = String(error.path[0])
    const fieldValue = getFieldValue(data, fieldName)
    throw new ValidationError(fieldName, fieldValue, error.message)
  }
}

// ============================================
// Swap Request Validators
// ============================================

/**
 * Validates that a shift type is valid
 * Note: This is a synchronous validation for backward compatibility.
 * For dynamic validation, use shiftConfigurationsService.getActiveShiftConfigurations()
 */
export function validateShiftType(shiftType: string): void {
  const result = shiftTypeSchema.safeParse(shiftType)
  if (!result.success) {
    throw new ValidationError(
      'shift_type',
      shiftType,
      result.error.issues[0].message
    )
  }
}

/**
 * Validates shift type against database configurations (async)
 */
export async function validateShiftTypeAsync(
  shiftType: string
): Promise<boolean> {
  const { shiftConfigurationsService } = await import(
    '../services/shiftConfigurationsService'
  )
  try {
    const shifts =
      await shiftConfigurationsService.getActiveShiftConfigurations()
    const validShiftTypes = shifts.map((s) => s.shift_code)
    return validShiftTypes.includes(shiftType)
  } catch {
    // Fallback to defaults if database fails
    const fallbackTypes = ['AM', 'PM', 'BET', 'OFF']
    return fallbackTypes.includes(shiftType)
  }
}

/**
 * Validates swap request data
 */
export interface SwapRequestValidationData {
  requesterId: string
  targetUserId: string
  requesterShiftId: string
  targetShiftId: string
}

export function validateSwapRequestData(data: SwapRequestValidationData): void {
  const result = swapRequestValidationSchema.safeParse(data)
  if (!result.success) {
    const error = result.error.issues[0]
    const fieldName = String(error.path[0])
    const fieldValue = getFieldValue(data, fieldName)
    throw new ValidationError(fieldName, fieldValue, error.message)
  }
}

// ============================================
// Break Schedule Validators & Helpers
// ============================================

/**
 * Validates that a time string is in HH:MM format
 */
export function isValidTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time)
}

/**
 * Validates that a time string is in HH:MM:SS format
 */
export function isValidTimeFormatWithSeconds(time: string): boolean {
  return /^\d{2}:\d{2}:\d{2}$/.test(time)
}

/**
 * Validates that a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

/**
 * Converts HH:MM:SS to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converts minutes since midnight to HH:MM:SS
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
}

/**
 * Validates that intervals are in 15-minute increments
 */
export function isValid15MinuteInterval(time: string): boolean {
  const minutes = timeToMinutes(time)
  return minutes % 15 === 0
}

/**
 * Generates all 15-minute intervals between start and end times
 */
export function generateIntervals(startTime: string, endTime: string): string[] {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const intervals: string[] = []

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
    intervals.push(minutesToTime(minutes))
  }

  return intervals
}

/**
 * Validates that a break schedule has valid ordering (HB1 -> B -> HB2)
 */
export function validateBreakOrdering(
  intervals: Record<string, string>
): { valid: boolean; error?: string } {
  const breakTimes: Record<string, number> = {}

  for (const [time, breakType] of Object.entries(intervals)) {
    if (breakType !== 'IN') {
      breakTimes[breakType] = timeToMinutes(time)
    }
  }

  if (breakTimes.HB1 && breakTimes.B && breakTimes.HB1 >= breakTimes.B) {
    return { valid: false, error: 'HB1 must come before B' }
  }

  if (breakTimes.B && breakTimes.HB2 && breakTimes.B >= breakTimes.HB2) {
    return { valid: false, error: 'B must come before HB2' }
  }

  if (breakTimes.HB1 && breakTimes.HB2 && breakTimes.HB1 >= breakTimes.HB2) {
    return { valid: false, error: 'HB1 must come before HB2' }
  }

  return { valid: true }
}

/**
 * Calculates the gap in minutes between two break times
 */
export function calculateBreakGap(time1: string, time2: string): number {
  return Math.abs(timeToMinutes(time2) - timeToMinutes(time1))
}

// ============================================
// Color Validation for Inline Styles
// ============================================

/**
 * Validates that a string is a valid hex color format
 * Accepts: #RGB, #RRGGBB, #RRGGBBAA (with or without hash)
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false
  }

  // Remove leading hash if present
  const normalizedColor = color.replace(/^#/, '')

  // Check for 3, 4, 6, or 8 digit hex colors
  const isValidLength = normalizedColor.length === 3 || 
                        normalizedColor.length === 4 || 
                        normalizedColor.length === 6 || 
                        normalizedColor.length === 8

  if (!isValidLength) {
    return false
  }

  // Check that all characters are valid hex digits
  return /^[0-9A-Fa-f]+$/.test(normalizedColor)
}

/**
 * Sanitizes a color value for use in inline styles
 * Returns a safe default if the color is invalid
 */
export function sanitizeColorForStyle(color: unknown): string {
  if (typeof color !== 'string') {
    return '#E5E7EB' // Default gray
  }

  if (isValidHexColor(color)) {
    // Ensure the color has a leading hash
    return color.startsWith('#') ? color : `#${color}`
  }

  // If the color is a named CSS color, allow it
  const namedColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'gray', 'grey', 'black', 'white', 'cyan', 'magenta', 'lime', 'navy',
    'teal', 'olive', 'maroon', 'silver', 'aqua', 'fuchsia',
  ]

  if (namedColors.includes(color.toLowerCase())) {
    return color
  }

  // Return default for invalid colors
  console.warn(`Invalid color value: ${color}, using default`)
  return '#E5E7EB'
}
