/**
 * Leave balance validation module
 * Provides validation functions for leave requests including balance checks and overlap detection
 */

import { InsufficientLeaveBalanceError, ValidationError } from '../../types/errors'
import { leaveBalancesService } from '../leaveBalancesService'
import { leaveRequestsService } from '../leaveRequestsService'
import { getBusinessDaysBetween } from '../../utils/dateHelpers'
import type { LeaveType, LeaveRequest } from '../../types'

/**
 * Validates that a user has sufficient leave balance for a request
 * @throws InsufficientLeaveBalanceError if balance is insufficient
 */
export async function validateLeaveBalance(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string
): Promise<void> {
  // Calculate requested days (business days only)
  const requestedDays = getBusinessDaysBetween(startDate, endDate)

  if (requestedDays <= 0) {
    throw new ValidationError(
      'date_range',
      { startDate, endDate },
      'Date range must include at least one business day'
    )
  }

  // Get current leave balance
  const balance = await leaveBalancesService.getLeaveBalance(userId, leaveType)

  if (!balance) {
    throw new ValidationError(
      'leave_type',
      leaveType,
      `No leave balance found for leave type: ${leaveType}`
    )
  }

  // Check if sufficient balance exists
  if (balance.balance < requestedDays) {
    throw new InsufficientLeaveBalanceError(
      userId,
      leaveType,
      requestedDays,
      balance.balance
    )
  }
}

/**
 * Checks for overlapping leave requests for a user
 * @returns Array of overlapping leave requests
 */
export async function checkOverlappingLeave(
  userId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<LeaveRequest[]> {
  // Get all leave requests for the user
  const userLeaveRequests = await leaveRequestsService.getUserLeaveRequests(userId)

  // Filter for approved or pending requests that overlap with the requested dates
  const overlappingRequests = userLeaveRequests.filter(request => {
    // Exclude the current request if updating
    if (excludeRequestId && request.id === excludeRequestId) {
      return false
    }

    // Only check approved and pending requests
    const relevantStatuses = ['approved', 'pending_tl', 'pending_wfm']
    if (!relevantStatuses.includes(request.status)) {
      return false
    }

    // Check for date overlap
    // Overlap occurs if:
    // - Request start is before or on our end date AND
    // - Request end is after or on our start date
    const requestStart = new Date(request.start_date)
    const requestEnd = new Date(request.end_date)
    const rangeStart = new Date(startDate)
    const rangeEnd = new Date(endDate)

    return requestStart <= rangeEnd && requestEnd >= rangeStart
  })

  return overlappingRequests
}

/**
 * Validates that there are no overlapping leave requests
 * @throws ValidationError if overlapping requests exist
 */
export async function validateNoOverlappingLeave(
  userId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<void> {
  const overlappingRequests = await checkOverlappingLeave(
    userId,
    startDate,
    endDate,
    excludeRequestId
  )

  if (overlappingRequests.length > 0) {
    const firstOverlap = overlappingRequests[0]
    throw new ValidationError(
      'date_range',
      { startDate, endDate },
      `Leave request overlaps with existing ${firstOverlap.status} request from ${firstOverlap.start_date} to ${firstOverlap.end_date}`
    )
  }
}

/**
 * Comprehensive leave request validation
 * Validates both balance and overlap constraints
 */
export async function validateLeaveRequest(
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<{
  requestedDays: number
  availableBalance: number
}> {
  // Validate balance
  await validateLeaveBalance(userId, leaveType, startDate, endDate)

  // Validate no overlapping requests
  await validateNoOverlappingLeave(userId, startDate, endDate, excludeRequestId)

  // Return validation details
  const requestedDays = getBusinessDaysBetween(startDate, endDate)
  const balance = await leaveBalancesService.getLeaveBalance(userId, leaveType)

  return {
    requestedDays,
    availableBalance: balance?.balance || 0,
  }
}
