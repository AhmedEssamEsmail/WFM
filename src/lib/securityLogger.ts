/**
 * Security logging utility for tracking unauthorized access attempts
 * and security-related events in the application.
 */

import type { UserRole } from '../types'

interface SecurityLogEntry {
  userId: string
  userRole: UserRole
  requestedRoute: string
  timestamp: string
  reason: string
  action: 'unauthorized_access' | 'domain_violation' | 'role_violation'
}

/**
 * Log an unauthorized access attempt
 * In development: logs to console with warning level
 * In production: should be sent to a proper logging service (e.g., Sentry, DataDog)
 */
export function logUnauthorizedAccess(
  userId: string,
  userRole: UserRole,
  requestedRoute: string,
  reason: string,
  action: 'unauthorized_access' | 'domain_violation' | 'role_violation' = 'unauthorized_access'
): void {
  const logEntry: SecurityLogEntry = {
    userId,
    userRole,
    requestedRoute,
    timestamp: new Date().toISOString(),
    reason,
    action,
  }

  // In development, log to console
  if (import.meta.env.DEV) {
    console.warn('🔒 Security Event:', logEntry)
  }

  // In production, send to logging service
  if (import.meta.env.PROD && typeof window !== 'undefined' && (window as any).Sentry) {
    const Sentry = (window as any).Sentry;
    Sentry.captureMessage(`Security Event: ${action}`, {
      level: 'warning',
      extra: logEntry,
      tags: {
        securityEvent: action,
        userRole,
      },
    });
  }

  // Store in local storage for debugging (limited to last 50 entries)
  storeSecurityLog(logEntry)
}

/**
 * Store security log entry in local storage for debugging
 * Maintains a rolling buffer of the last 50 security events
 */
function storeSecurityLog(entry: SecurityLogEntry): void {
  try {
    const key = 'security_logs'
    const stored = localStorage.getItem(key)
    const logs: SecurityLogEntry[] = stored ? JSON.parse(stored) : []
    
    // Add new entry
    logs.push(entry)
    
    // Keep only last 50 entries
    if (logs.length > 50) {
      logs.shift()
    }
    
    localStorage.setItem(key, JSON.stringify(logs))
  } catch (error) {
    // Silently fail if localStorage is not available
    console.error('Failed to store security log:', error)
  }
}

/**
 * Retrieve recent security logs for debugging
 * Returns the last N security log entries
 */
export function getSecurityLogs(limit: number = 50): SecurityLogEntry[] {
  try {
    const key = 'security_logs'
    const stored = localStorage.getItem(key)
    const logs: SecurityLogEntry[] = stored ? JSON.parse(stored) : []
    
    return logs.slice(-limit)
  } catch (error) {
    console.error('Failed to retrieve security logs:', error)
    return []
  }
}

/**
 * Clear all security logs from local storage
 */
export function clearSecurityLogs(): void {
  try {
    localStorage.removeItem('security_logs')
  } catch (error) {
    console.error('Failed to clear security logs:', error)
  }
}
