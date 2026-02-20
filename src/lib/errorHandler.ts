/**
 * Centralized error handling utility
 * Integrates with ToastContext for user notifications and provides structured error logging
 */

import { SystemCommentProtectedError } from '../types/errors';
import { Sentry } from './sentry';

// PII patterns for filtering sensitive data from error logs
const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'ssn' },
];

// Fields that may contain PII and should be redacted
const PII_FIELDS = [
  'email',
  'name',
  'phone',
  'phoneNumber',
  'mobile',
  'address',
  'ssn',
  'socialSecurity',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
];

type ErrorContextValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: ErrorContextValue }
  | ErrorContextValue[];

type ErrorContext = { [key: string]: ErrorContextValue };

interface ErrorOptions {
  userMessage?: string;
  logToConsole?: boolean;
  showToast?: boolean;
  context?: ErrorContext;
}

interface ErrorLog {
  timestamp: string;
  error: unknown;
  userMessage: string;
  context: ErrorContext;
  stack?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private toastFunction:
    | ((message: string, type: 'error' | 'success' | 'warning' | 'info') => void)
    | null = null;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 50;
  private logTTL = 1000 * 60 * 30; // 30 minutes TTL
  private readonly STORAGE_KEY = 'wfm_error_logs';
  private readonly MAX_STORAGE_SIZE = 1024 * 100; // 100KB max for error logs

  private constructor() {
    // Load existing logs from localStorage on initialization
    this.loadLogsFromStorage();

    // Clean up old logs every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupOldLogs(), 1000 * 60 * 5);
    }
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Load error logs from localStorage
   */
  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const logs = JSON.parse(stored) as ErrorLog[];
        // Filter out expired logs
        const now = Date.now();
        this.errorLogs = logs.filter((log) => {
          const logTime = new Date(log.timestamp).getTime();
          return now - logTime < this.logTTL;
        });
      }
    } catch (error) {
      // Silent fail - localStorage might be unavailable
      console.warn('Failed to load error logs from storage:', error);
    }
  }

  /**
   * Save error logs to localStorage with size limit
   */
  private saveLogsToStorage(): void {
    try {
      const serialized = JSON.stringify(this.errorLogs);

      // Check size limit
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        // Remove oldest logs until under size limit
        while (
          this.errorLogs.length > 0 &&
          JSON.stringify(this.errorLogs).length > this.MAX_STORAGE_SIZE
        ) {
          this.errorLogs.shift();
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorLogs));
    } catch (error) {
      // Handle QuotaExceededError or other storage errors
      console.warn('Failed to save error logs to storage:', error);
      // Clear old logs and retry
      this.errorLogs = this.errorLogs.slice(-10); // Keep only last 10
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorLogs));
      } catch {
        // Give up silently
      }
    }
  }

  /**
   * Sanitize a value to remove PII
   */
  private sanitizeValue(value: ErrorContextValue): ErrorContextValue {
    if (typeof value === 'string') {
      let sanitized = value;
      for (const { pattern } of PII_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
      return sanitized;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }
    if (this.isContextObject(value)) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private isContextObject(value: ErrorContextValue): value is ErrorContext {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Sanitize an object to remove PII from values
   */
  private sanitizeObject(obj: ErrorContext): ErrorContext {
    const sanitized: ErrorContext = {};

    for (const [key, value] of Object.entries(obj)) {
      // Redact entire value if field name suggests PII
      if (PII_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeValue(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error log to remove PII
   */
  private sanitizeErrorLog(log: ErrorLog): ErrorLog {
    return {
      ...log,
      context: this.sanitizeObject(log.context),
    };
  }

  /**
   * Set the toast notification function from ToastContext
   */
  setToastFunction(
    fn: ((message: string, type: 'error' | 'success' | 'warning' | 'info') => void) | null
  ): void {
    this.toastFunction = fn;
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
      context = {},
    } = options;

    // Extract error message and stack
    let errorMessage = userMessage;
    let stack: string | undefined;

    // Handle SystemCommentProtectedError specifically
    if (error instanceof SystemCommentProtectedError) {
      errorMessage = userMessage || error.message;
      stack = error.stack;
    } else if (error instanceof Error) {
      errorMessage = userMessage || error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = userMessage || error;
    }

    // Create error log entry and sanitize PII
    const errorLog = this.sanitizeErrorLog({
      timestamp: new Date().toISOString(),
      error,
      userMessage,
      context,
      stack,
    });

    // Store error log (keep last maxLogs errors)
    this.errorLogs.push(errorLog);
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }

    // Persist to localStorage with size limits
    this.saveLogsToStorage();

    // Log to console in development
    if (logToConsole && import.meta.env.DEV) {
      console.group('🔴 Error Handler');
      console.error('Error:', error);
      if (Object.keys(context).length > 0) {
        console.error('Context:', context);
      }
      if (stack) {
        console.error('Stack:', stack);
      }
      console.groupEnd();
    }

    // Show toast notification
    if (showToast && this.toastFunction) {
      this.toastFunction(errorMessage, 'error');
    }

    // In production, send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      this.sendToErrorTracking(errorLog);
    }

    return errorMessage;
  }

  /**
   * Send error to external error tracking service
   * @param errorLog - The error log to send
   */
  private sendToErrorTracking(errorLog: ErrorLog): void {
    if (import.meta.env.PROD) {
      try {
        const errorType =
          typeof errorLog.context.type === 'string' ? errorLog.context.type : 'unknown';
        Sentry.captureException(errorLog.error, {
          extra: errorLog.context,
          tags: {
            errorType,
          },
        });
      } catch {
        // Sentry not initialized — silently skip
      }
    }
  }

  /**
   * Get recent error logs (useful for debugging)
   * @param count - Number of recent errors to retrieve
   * @returns Array of recent error logs
   */
  getRecentErrors(count = 10): ErrorLog[] {
    return this.errorLogs.slice(-count);
  }

  /**
   * Clear all stored error logs
   */
  clearLogs(): void {
    this.errorLogs = [];
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear error logs from storage:', error);
    }
  }

  /**
   * Clean up error logs older than TTL
   */
  private cleanupOldLogs(): void {
    const now = Date.now();
    this.errorLogs = this.errorLogs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      return now - logTime < this.logTTL;
    });
  }

  // Specific error handlers with predefined messages

  /**
   * Handle network errors
   */
  handleNetworkError(error: unknown): string {
    return this.handle(error, {
      userMessage: 'Network error. Please check your connection and try again.',
      context: { type: 'network' },
    });
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: unknown): string {
    return this.handle(error, {
      userMessage: 'Authentication error. Please log in again.',
      context: { type: 'auth' },
    });
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: unknown, field?: string): string {
    return this.handle(error, {
      userMessage: field
        ? `Validation error in ${field}. Please check your input.`
        : 'Please check your input and try again.',
      context: { type: 'validation', field },
    });
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: unknown, operation?: string): string {
    return this.handle(error, {
      userMessage: operation
        ? `Failed to ${operation}. Please try again.`
        : 'Database error. Please try again.',
      context: { type: 'database', operation },
    });
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(error: unknown): string {
    return this.handle(error, {
      userMessage: 'You do not have permission to perform this action.',
      context: { type: 'permission' },
    });
  }

  /**
   * Handle system comment protection errors
   */
  handleSystemCommentProtectedError(error: unknown): string {
    if (error instanceof SystemCommentProtectedError) {
      return this.handle(error, {
        userMessage: error.message,
        context: { type: 'system_comment_protected', operation: error.operation },
      });
    }
    return this.handle(error, {
      userMessage: 'System-generated comments cannot be modified.',
      context: { type: 'system_comment_protected' },
    });
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Convenience functions for easy import and use

/**
 * Handle a generic error
 */
export function handleError(error: unknown, options?: ErrorOptions): string {
  return errorHandler.handle(error, options);
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: unknown): string {
  return errorHandler.handleNetworkError(error);
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): string {
  return errorHandler.handleAuthError(error);
}

/**
 * Handle validation errors
 */
export function handleValidationError(error: unknown, field?: string): string {
  return errorHandler.handleValidationError(error, field);
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown, operation?: string): string {
  return errorHandler.handleDatabaseError(error, operation);
}

/**
 * Handle permission errors
 */
export function handlePermissionError(error: unknown): string {
  return errorHandler.handlePermissionError(error);
}

/**
 * Handle system comment protection errors
 */
export function handleSystemCommentProtectedError(error: unknown): string {
  return errorHandler.handleSystemCommentProtectedError(error);
}

/**
 * Initialize error handler with toast function
 * Call this from your app's root component after ToastProvider is mounted
 */
export function initializeErrorHandler(
  toastFn: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void
): void {
  errorHandler.setToastFunction(toastFn);
}

/**
 * Get recent error logs for debugging
 */
export function getRecentErrors(count?: number): ErrorLog[] {
  return errorHandler.getRecentErrors(count);
}

/**
 * Clear error logs
 */
export function clearErrorLogs(): void {
  errorHandler.clearLogs();
}
