/**
 * Centralized error handling utility
 * Integrates with ToastContext for user notifications and provides structured error logging
 */

interface ErrorOptions {
  userMessage?: string
  logToConsole?: boolean
  showToast?: boolean
  context?: Record<string, unknown>
}

interface ErrorLog {
  timestamp: string
  error: unknown
  userMessage: string
  context: Record<string, unknown>
  stack?: string
}

class ErrorHandler {
  private static instance: ErrorHandler
  private toastFunction: ((message: string, type: 'error' | 'success' | 'warning' | 'info') => void) | null = null
  private errorLogs: ErrorLog[] = []
  private maxLogs = 100

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Set the toast notification function from ToastContext
   */
  setToastFunction(fn: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void): void {
    this.toastFunction = fn
  }

  /**
   * Main error handling method
   * @param error - The error to handle
   * @param options - Configuration options for error handling
   * @returns The error message string
   */
  handle(error: unknown, options: ErrorOptions = {}): string {
    const {
      userMessage = 'An unexpected error occurred',
      logToConsole = true,
      showToast = true,
      context = {}
    } = options

    // Extract error message and stack
    let errorMessage = userMessage
    let stack: string | undefined

    if (error instanceof Error) {
      errorMessage = error.message || userMessage
      stack = error.stack
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    // Create error log entry
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error,
      userMessage,
      context,
      stack
    }

    // Store error log (keep last 100 errors)
    this.errorLogs.push(errorLog)
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift()
    }

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Handler')
      console.error('Error:', error)
      if (Object.keys(context).length > 0) {
        console.error('Context:', context)
      }
      if (stack) {
        console.error('Stack:', stack)
      }
      console.groupEnd()
    }

    // Show toast notification
    if (showToast && this.toastFunction) {
      this.toastFunction(userMessage, 'error')
    }

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorLog)
    }

    return errorMessage
  }

  /**
   * Send error to external error tracking service
   * @param errorLog - The error log to send
   */
  private sendToErrorTracking(errorLog: ErrorLog): void {
    // TODO: Integrate with Sentry, LogRocket, or similar service
    // Example: Sentry.captureException(errorLog.error, { extra: errorLog.context })
    
    // For now, we'll just store it locally
    // In production, replace this with actual error tracking integration
    if (process.env.NODE_ENV === 'production') {
      // Placeholder for future error tracking service integration
      void errorLog // Acknowledge the parameter is intentionally unused for now
    }
  }

  /**
   * Get recent error logs (useful for debugging)
   * @param count - Number of recent errors to retrieve
   * @returns Array of recent error logs
   */
  getRecentErrors(count = 10): ErrorLog[] {
    return this.errorLogs.slice(-count)
  }

  /**
   * Clear all stored error logs
   */
  clearLogs(): void {
    this.errorLogs = []
  }

  // Specific error handlers with predefined messages

  /**
   * Handle network errors
   */
  handleNetworkError(error: unknown): string {
    return this.handle(error, {
      userMessage: 'Network error. Please check your connection and try again.',
      context: { type: 'network' }
    })
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: unknown): string {
    return this.handle(error, {
      userMessage: 'Authentication error. Please log in again.',
      context: { type: 'auth' }
    })
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: unknown, field?: string): string {
    return this.handle(error, {
      userMessage: field 
        ? `Validation error in ${field}. Please check your input.`
        : 'Please check your input and try again.',
      context: { type: 'validation', field }
    })
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: unknown, operation?: string): string {
    return this.handle(error, {
      userMessage: operation
        ? `Failed to ${operation}. Please try again.`
        : 'Database error. Please try again.',
      context: { type: 'database', operation }
    })
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(error: unknown): string {
    return this.handle(error, {
      userMessage: 'You do not have permission to perform this action.',
      context: { type: 'permission' }
    })
  }
}

export const errorHandler = ErrorHandler.getInstance()

// Convenience functions for easy import and use

/**
 * Handle a generic error
 */
export function handleError(error: unknown, options?: ErrorOptions): string {
  return errorHandler.handle(error, options)
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: unknown): string {
  return errorHandler.handleNetworkError(error)
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): string {
  return errorHandler.handleAuthError(error)
}

/**
 * Handle validation errors
 */
export function handleValidationError(error: unknown, field?: string): string {
  return errorHandler.handleValidationError(error, field)
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown, operation?: string): string {
  return errorHandler.handleDatabaseError(error, operation)
}

/**
 * Handle permission errors
 */
export function handlePermissionError(error: unknown): string {
  return errorHandler.handlePermissionError(error)
}

/**
 * Initialize error handler with toast function
 * Call this from your app's root component after ToastProvider is mounted
 */
export function initializeErrorHandler(toastFn: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void): void {
  errorHandler.setToastFunction(toastFn)
}

/**
 * Get recent error logs for debugging
 */
export function getRecentErrors(count?: number): ErrorLog[] {
  return errorHandler.getRecentErrors(count)
}

/**
 * Clear error logs
 */
export function clearErrorLogs(): void {
  errorHandler.clearLogs()
}

