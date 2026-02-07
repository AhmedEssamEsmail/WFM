// Centralized error handling utility

interface ErrorOptions {
  userMessage?: string
  logToConsole?: boolean
  showToast?: boolean
  context?: Record<string, any>
}

class ErrorHandler {
  private static instance: ErrorHandler
  private toastFunction: ((message: string, type: 'error' | 'success' | 'warning' | 'info') => void) | null = null

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  setToastFunction(fn: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void) {
    this.toastFunction = fn
  }

  handle(error: unknown, options: ErrorOptions = {}) {
    const {
      userMessage = 'An unexpected error occurred',
      logToConsole = true,
      showToast = true,
      context = {}
    } = options

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.error('Error:', error)
      if (Object.keys(context).length > 0) {
        console.error('Context:', context)
      }
    }

    // Extract error message
    let errorMessage = userMessage
    if (error instanceof Error) {
      errorMessage = error.message || userMessage
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    // Show toast notification
    if (showToast && this.toastFunction) {
      this.toastFunction(userMessage, 'error')
    }

    // In production, you would send to error tracking service
    // Example: Sentry.captureException(error, { extra: context })

    return errorMessage
  }

  // Specific error handlers
  handleNetworkError(error: unknown) {
    return this.handle(error, {
      userMessage: 'Network error. Please check your connection and try again.',
      context: { type: 'network' }
    })
  }

  handleAuthError(error: unknown) {
    return this.handle(error, {
      userMessage: 'Authentication error. Please log in again.',
      context: { type: 'auth' }
    })
  }

  handleValidationError(error: unknown, field?: string) {
    return this.handle(error, {
      userMessage: field 
        ? `Validation error in ${field}. Please check your input.`
        : 'Please check your input and try again.',
      context: { type: 'validation', field }
    })
  }

  handleDatabaseError(error: unknown, operation?: string) {
    return this.handle(error, {
      userMessage: operation
        ? `Failed to ${operation}. Please try again.`
        : 'Database error. Please try again.',
      context: { type: 'database', operation }
    })
  }
}

export const errorHandler = ErrorHandler.getInstance()

// Convenience functions
export function handleError(error: unknown, options?: ErrorOptions) {
  return errorHandler.handle(error, options)
}

export function handleNetworkError(error: unknown) {
  return errorHandler.handleNetworkError(error)
}

export function handleAuthError(error: unknown) {
  return errorHandler.handleAuthError(error)
}

export function handleValidationError(error: unknown, field?: string) {
  return errorHandler.handleValidationError(error, field)
}

export function handleDatabaseError(error: unknown, operation?: string) {
  return errorHandler.handleDatabaseError(error, operation)
}

// Initialize toast function (call this from ToastContext)
export function initializeErrorHandler(toastFn: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void) {
  errorHandler.setToastFunction(toastFn)
}
