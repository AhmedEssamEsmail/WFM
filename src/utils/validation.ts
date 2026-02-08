/**
 * Validation utilities for the WFM application
 * Provides reusable validation functions with consistent error handling
 */

import { ValidationError } from '../types/errors'
import type { LeaveType, ShiftType } from '../types'

/**
 * Validates that a date string is in ISO 8601 format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string, fieldName: string = 'date'): void {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!isoDateRegex.test(date)) {
    throw new ValidationError(
      fieldName,
      date,
      'Must be in ISO 8601 format (YYYY-MM-DD)'
    )
  }

  // Validate that it's a valid date
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError(
      fieldName,
      date,
      'Must be a valid date'
    )
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
  validateDateFormat(startDate, startFieldName)
  validateDateFormat(endDate, endFieldName)

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    throw new ValidationError(
      endFieldName,
      endDate,
      `${endFieldName} must be on or after ${startFieldName}`
    )
  }
}

/**
 * Validates that a UUID is in valid format
 */
export function validateUUID(id: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new ValidationError(
      fieldName,
      id,
      'Must be a valid UUID'
    )
  }
}

/**
 * Validates that a number is positive
 */
export function validatePositiveNumber(
  value: number,
  fieldName: string = 'value'
): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(
      fieldName,
      value,
      'Must be a valid number'
    )
  }

  if (value <= 0) {
    throw new ValidationError(
      fieldName,
      value,
      'Must be a positive number'
    )
  }
}

/**
 * Validates that a number is non-negative
 */
export function validateNonNegativeNumber(
  value: number,
  fieldName: string = 'value'
): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(
      fieldName,
      value,
      'Must be a valid number'
    )
  }

  if (value < 0) {
    throw new ValidationError(
      fieldName,
      value,
      'Must be a non-negative number'
    )
  }
}

/**
 * Validates that a string is not empty
 */
export function validateNonEmptyString(
  value: string,
  fieldName: string = 'value'
): void {
  if (typeof value !== 'string') {
    throw new ValidationError(
      fieldName,
      value,
      'Must be a string'
    )
  }

  if (value.trim().length === 0) {
    throw new ValidationError(
      fieldName,
      value,
      'Must not be empty'
    )
  }
}

/**
 * Validates that a leave type is valid
 */
export function validateLeaveType(leaveType: string): asserts leaveType is LeaveType {
  const validLeaveTypes: LeaveType[] = ['sick', 'annual', 'casual', 'public_holiday', 'bereavement']
  if (!validLeaveTypes.includes(leaveType as LeaveType)) {
    throw new ValidationError(
      'leave_type',
      leaveType,
      `Must be one of: ${validLeaveTypes.join(', ')}`
    )
  }
}

/**
 * Validates that a shift type is valid
 */
export function validateShiftType(shiftType: string): asserts shiftType is ShiftType {
  const validShiftTypes: ShiftType[] = ['AM', 'PM', 'BET', 'OFF']
  if (!validShiftTypes.includes(shiftType as ShiftType)) {
    throw new ValidationError(
      'shift_type',
      shiftType,
      `Must be one of: ${validShiftTypes.join(', ')}`
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

export function validateLeaveRequestData(data: LeaveRequestValidationData): void {
  validateUUID(data.userId, 'user_id')
  validateLeaveType(data.leaveType)
  validateDateRange(data.startDate, data.endDate, 'start_date', 'end_date')
  validatePositiveNumber(data.requestedDays, 'requested_days')
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
  validateUUID(data.requesterId, 'requester_id')
  validateUUID(data.targetUserId, 'target_user_id')
  validateUUID(data.requesterShiftId, 'requester_shift_id')
  validateUUID(data.targetShiftId, 'target_shift_id')

  // Validate that requester and target are different users
  if (data.requesterId === data.targetUserId) {
    throw new ValidationError(
      'target_user_id',
      data.targetUserId,
      'Cannot swap shifts with yourself'
    )
  }

  // Validate that shifts are different
  if (data.requesterShiftId === data.targetShiftId) {
    throw new ValidationError(
      'target_shift_id',
      data.targetShiftId,
      'Cannot swap the same shift'
    )
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
  validateDateFormat(date, fieldName)

  const dateObj = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (allowToday) {
    if (dateObj < today) {
      throw new ValidationError(
        fieldName,
        date,
        'Must be today or in the future'
      )
    }
  } else {
    if (dateObj <= today) {
      throw new ValidationError(
        fieldName,
        date,
        'Must be in the future'
      )
    }
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string, fieldName: string = 'email'): void {
  validateNonEmptyString(email, fieldName)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError(
      fieldName,
      email,
      'Must be a valid email address'
    )
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
