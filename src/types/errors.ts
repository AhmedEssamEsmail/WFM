/**
 * Custom error types for the WFM application
 * These errors provide structured error handling with specific error codes
 */
import type { JsonObject } from './json'

/**
 * Base class for all WFM application errors
 */
export class WFMError extends Error {
  public readonly code: string
  public readonly statusCode: number

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error thrown when leave balance validation fails
 */
export class InsufficientLeaveBalanceError extends WFMError {
  constructor(
    public readonly userId: string,
    public readonly leaveType: string,
    public readonly requested: number,
    public readonly available: number
  ) {
    super(
      `Insufficient ${leaveType} leave balance. Requested: ${requested} days, Available: ${available} days`,
      'INSUFFICIENT_LEAVE_BALANCE',
      400
    )
  }
}

/**
 * Error thrown when a swap request involves invalid shifts
 */
export class InvalidSwapShiftsError extends WFMError {
  constructor(
    public readonly reason: string,
    public readonly details?: JsonObject
  ) {
    super(
      `Invalid swap request: ${reason}`,
      'INVALID_SWAP_SHIFTS',
      400
    )
    if (details) {
      Object.assign(this, { details })
    }
  }
}

/**
 * Error thrown when a database transaction fails
 */
export class TransactionError extends WFMError {
  constructor(
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(
      `Transaction failed during ${operation}: ${originalError?.message || 'Unknown error'}`,
      'TRANSACTION_FAILED',
      500
    )
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

/**
 * Error thrown when a concurrency conflict occurs (optimistic locking)
 */
export class ConcurrencyError extends WFMError {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string,
    public readonly expectedState: string,
    public readonly actualState: string
  ) {
    super(
      `Concurrency conflict for ${resourceType} ${resourceId}: expected state '${expectedState}' but found '${actualState}'`,
      'CONCURRENCY_ERROR',
      409
    )
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends WFMError {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    public readonly constraint: string
  ) {
    super(
      `Validation failed for field '${field}': ${constraint}`,
      'VALIDATION_ERROR',
      400
    )
  }
}

/**
 * Error thrown when a resource is not found
 */
export class ResourceNotFoundError extends WFMError {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(
      `${resourceType} with ID '${resourceId}' not found`,
      'RESOURCE_NOT_FOUND',
      404
    )
  }
}

/**
 * Error thrown when attempting to modify a system-generated comment
 */
export class SystemCommentProtectedError extends WFMError {
  constructor(
    public readonly operation: 'update' | 'delete'
  ) {
    super(
      `Cannot ${operation} system-generated comments. System comments are protected to maintain audit trail integrity.`,
      'SYSTEM_COMMENT_PROTECTED',
      403
    )
  }
}

/**
 * Error thrown when a user attempts unauthorized access
 */
export class UnauthorizedAccessError extends WFMError {
  constructor(
    public readonly userId: string,
    public readonly requestedRoute: string,
    public readonly userRole: string,
    public readonly requiredRoles: string[]
  ) {
    super(
      `User ${userId} with role '${userRole}' attempted to access route '${requestedRoute}' which requires roles: ${requiredRoles.join(', ')}`,
      'UNAUTHORIZED_ACCESS',
      403
    )
  }
}

/**
 * Error thrown when swap execution fails
 */
export class SwapExecutionError extends WFMError {
  constructor(
    public readonly swapRequestId: string,
    public readonly reason: string,
    public readonly details?: JsonObject
  ) {
    super(
      `Swap execution failed for request ${swapRequestId}: ${reason}`,
      'SWAP_EXECUTION_FAILED',
      500
    )
    if (details) {
      Object.assign(this, { details })
    }
  }
}

/**
 * Type guard to check if an error is a WFMError
 */
export function isWFMError(error: unknown): error is WFMError {
  return error instanceof WFMError
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

/**
 * Extract error code from unknown error type
 */
export function getErrorCode(error: unknown): string {
  if (isWFMError(error)) {
    return error.code
  }
  if (error instanceof Error) {
    return 'UNKNOWN_ERROR'
  }
  return 'UNKNOWN_ERROR'
}
