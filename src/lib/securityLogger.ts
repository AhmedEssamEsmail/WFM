/**
 * Security logging utility for tracking unauthorized access attempts
 * and security-related events in the application.
 */

import type { UserRole } from '../types'
import { Sentry } from './sentry'

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
  if (import.meta.env.PROD) {
    try {
      Sentry.captureMessage(`Security Event: ${action}`, {
        level: 'warning',
        extra: logEntry as unknown as Record<string, unknown>,
        tags: {
          securityEvent: action,
          userRole,
        },
      });
    } catch {
      // Sentry not initialized — silently skip
    }
  }

  // Store in local storage for debugging (limited to last 50 entries)
  storeSecurityLog(logEntry)
}

/**
 * Store security log entry in local storage for debugging
 * Maintains a rolling buffer of the last 50 security events with TTL and size limits
 */
function storeSecurityLog(entry: SecurityLogEntry): void {
  try {
    const key = 'wfm_security_logs'
    const maxLogs = 50
    const maxSize = 1024 * 50 // 50KB max
    const ttl = 1000 * 60 * 60 * 24 // 24 hours
    
    const stored = localStorage.getItem(key)
    const logs: SecurityLogEntry[] = stored ? JSON.parse(stored) : []

    // Filter out expired logs
    const now = Date.now()
    const validLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime()
      return now - logTime < ttl
    })

    // Add new entry
    validLogs.push(entry)

    // Keep only last maxLogs entries
    const trimmedLogs = validLogs.slice(-maxLogs)
    
    // Check size and trim further if needed
    let serialized = JSON.stringify(trimmedLogs)
    let finalLogs = trimmedLogs
    
    while (serialized.length > maxSize && finalLogs.length > 10) {
      finalLogs = finalLogs.slice(-Math.floor(finalLogs.length * 0.8))
      serialized = JSON.stringify(finalLogs)
    }

    localStorage.setItem(key, serialized)
  } catch (error) {
    // Silently fail if localStorage is not available or quota exceeded
    if (import.meta.env.DEV) {
      console.error('Failed to store security log:', error)
    }
  }
}

/**
 * Retrieve recent security logs for debugging
 * Returns the last N security log entries (automatically filters expired logs)
 */
export function getSecurityLogs(limit: number = 50): SecurityLogEntry[] {
  try {
    const key = 'wfm_security_logs'
    const ttl = 1000 * 60 * 60 * 24 // 24 hours
    const stored = localStorage.getItem(key)
    const logs: SecurityLogEntry[] = stored ? JSON.parse(stored) : []

    // Filter out expired logs
    const now = Date.now()
    const validLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime()
      return now - logTime < ttl
    })

    return validLogs.slice(-limit)
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
    localStorage.removeItem('wfm_security_logs')
  } catch (error) {
    console.error('Failed to clear security logs:', error)
  }
}
