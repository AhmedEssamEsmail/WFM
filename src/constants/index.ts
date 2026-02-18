// Application-wide constants

// ============================================
// REQUIRED ENVIRONMENT VARIABLES
// ============================================
export const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const

export type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number]

/**
 * Validates that all required environment variables are set
 * Throws an error if any required env var is missing
 * 
 * Note: This is called lazily to avoid issues in test environments
 */
export function validateEnvironment(): void {
  const missing: string[] = []
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please set these in your .env file.`
    )
  }
}

// ============================================
// DOMAIN & AUTH
// ============================================

// Lazy getters for environment variables to avoid module-load-time validation
let _allowedEmailDomain: string | undefined

export function normalizeEmailDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase()
  if (!normalized) return ''
  return normalized.startsWith('@') ? normalized : `@${normalized}`
}

export function isEmailInAllowedDomain(email: string, domain: string): boolean {
  const normalizedDomain = normalizeEmailDomain(domain)
  if (!normalizedDomain) return false
  return email.trim().toLowerCase().endsWith(normalizedDomain)
}

export function getAllowedEmailDomain(): string {
  if (!_allowedEmailDomain) {
    const envDomain = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string
    // Default to @dabdoob.com if not set
    _allowedEmailDomain = normalizeEmailDomain(envDomain || '@dabdoob.com')
  }
  return _allowedEmailDomain!
}

// For backward compatibility, export as constant
// Defaults to @dabdoob.com if not set in environment
export const ALLOWED_EMAIL_DOMAIN: string = normalizeEmailDomain(
  (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string) || '@dabdoob.com'
)
export const SESSION_STORAGE_KEY = 'wfm_session'

// ============================================
// DATE FORMATS
// ============================================
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',           // Jan 01, 2024
  DISPLAY_LONG: 'MMMM dd, yyyy',     // January 01, 2024
  DISPLAY_SHORT: 'MM/dd/yyyy',       // 01/01/2024
  ISO: 'yyyy-MM-dd',                 // 2024-01-01
  TIME: 'HH:mm',                     // 14:30
  DATETIME: 'MMM dd, yyyy HH:mm',    // Jan 01, 2024 14:30
  DATETIME_LONG: 'MMMM dd, yyyy HH:mm:ss', // January 01, 2024 14:30:00
} as const

// ============================================
// PAGINATION
// ============================================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// ============================================
// FILE UPLOAD
// ============================================
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_CSV_TYPES: ['text/csv', 'application/vnd.ms-excel'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const

// ============================================
// LEAVE BALANCES (Default annual allocations)
// ============================================
// NOTE: Leave types and balances are loaded dynamically from the leave_types
// table using leaveTypesService. The database trigger automatically initializes
// leave balances to 0 for all active leave types when a user is created.
// WFM can then update individual balances as needed.
//
// This constant is kept for backward compatibility but should not be used
// for new code. Use leaveTypesService.getActiveLeaveTypes() instead.
export const DEFAULT_LEAVE_BALANCE = 0 as const

// ============================================
// QUERY CACHE TIMES (in milliseconds)
// ============================================
export const CACHE_TIME = {
  SHORT: 1000 * 60,           // 1 minute
  MEDIUM: 1000 * 60 * 5,      // 5 minutes
  LONG: 1000 * 60 * 30,       // 30 minutes
  VERY_LONG: 1000 * 60 * 60,  // 1 hour
} as const

// ============================================
// DEBOUNCE/THROTTLE DELAYS (in milliseconds)
// ============================================
export const DELAYS = {
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 500,
  SCROLL_THROTTLE: 100,
  RESIZE_THROTTLE: 200,
} as const

// ============================================
// TOAST DURATIONS (in milliseconds)
// ============================================
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const

// ============================================
// API ENDPOINTS (relative to Supabase base URL)
// ============================================
export const API_ENDPOINTS = {
  USERS: 'users',
  SHIFTS: 'shifts',
  SWAP_REQUESTS: 'swap_requests',
  LEAVE_REQUESTS: 'leave_requests',
  LEAVE_BALANCES: 'leave_balances',
  LEAVE_BALANCE_HISTORY: 'leave_balance_history',
  COMMENTS: 'comments',
  SETTINGS: 'settings',
  DEPARTMENTS: 'departments',
  HEADCOUNT_PROFILES: 'headcount_profiles',
  HEADCOUNT_AUDIT_LOG: 'headcount_audit_log',
  OVERTIME_SETTINGS: 'overtime_settings',
  BREAK_SCHEDULES: 'break_schedules',
  BREAK_SCHEDULE_WARNINGS: 'break_schedule_warnings',
  BREAK_SCHEDULE_RULES: 'break_schedule_rules',
} as const

// ============================================
// BREAK SCHEDULE TIME RANGES
// ============================================
export const BREAK_SCHEDULE = {
  HOURS: {
    START: 9,  // 9 AM
    END: 21,   // 9 PM
  },
  INTERVAL_MINUTES: 15,
  TABLE_NAMES: {
    SCHEDULES: 'break_schedules',
    WARNINGS: 'break_schedule_warnings',
    RULES: 'break_schedule_rules',
  },
} as const

// ============================================
// VALIDATION RULES
// ============================================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  COMMENT_MAX_LENGTH: 1000,
  NOTES_MAX_LENGTH: 500,
  EMPLOYEE_ID_PATTERN: /^[A-Z0-9]{4,10}$/,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
} as const

// ============================================
// WORKING HOURS
// ============================================
export const WORKING_HOURS = {
  DEFAULT_WEEKLY: 40,
  MIN_WEEKLY: 1,
  MAX_WEEKLY: 60,
  DEFAULT_DAILY: 8,
} as const

// ============================================
// ERROR MESSAGES
// ============================================
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  AUTH: 'Authentication error. Please log in again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
  DOMAIN_INVALID: `Email must be from ${ALLOWED_EMAIL_DOMAIN} domain.`,
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const

// ============================================
// SUCCESS MESSAGES
// ============================================
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  SIGNUP: 'Account created successfully!',
  SAVE: 'Changes saved successfully!',
  DELETE: 'Deleted successfully!',
  SUBMIT: 'Submitted successfully!',
  APPROVE: 'Approved successfully!',
  REJECT: 'Rejected successfully!',
  UPLOAD: 'Upload completed successfully!',
} as const

// ============================================
// ROUTES
// ============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  UNAUTHORIZED: '/unauthorized',
  
  // Shifts
  SCHEDULE: '/schedule',
  SCHEDULE_UPLOAD: '/schedule/upload',
  
  // Swap Requests
  SWAP_REQUESTS: '/swap-requests',
  SWAP_REQUESTS_CREATE: '/swap-requests/create',
  SWAP_REQUESTS_DETAIL: (id: string) => `/swap-requests/${id}`,
  
  // Leave Requests
  LEAVE_REQUESTS: '/leave-requests',
  LEAVE_REQUESTS_CREATE: '/leave-requests/create',
  LEAVE_REQUESTS_DETAIL: (id: string) => `/leave-requests/${id}`,
  LEAVE_BALANCES: '/leave-balances',
  
  // Overtime Requests
  OVERTIME_REQUESTS: '/overtime-requests',
  OVERTIME_REQUESTS_CREATE: '/overtime-requests/create',
  OVERTIME_REQUESTS_DETAIL: (id: string) => `/overtime-requests/${id}`,
  
  // Headcount
  HEADCOUNT_EMPLOYEES: '/headcount/employees',
  HEADCOUNT_EMPLOYEE_DETAIL: (id: string) => `/headcount/employees/${id}`,
  
  // Reports & Settings
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

// ============================================
// LOCAL STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  THEME: 'wfm_theme',
  SIDEBAR_COLLAPSED: 'wfm_sidebar_collapsed',
  TABLE_PAGE_SIZE: 'wfm_table_page_size',
  LAST_VIEWED_DATE: 'wfm_last_viewed_date',
} as const

// ============================================
// CHART COLORS
// ============================================
export const CHART_COLORS = {
  PRIMARY: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  SUCCESS: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  WARNING: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  DANGER: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  NEUTRAL: ['#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
  MIXED: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
} as const

// ============================================
// REGEX PATTERNS
// ============================================
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMPLOYEE_ID: /^[A-Z0-9]{4,10}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHA_SPACES: /^[a-zA-Z\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
} as const
