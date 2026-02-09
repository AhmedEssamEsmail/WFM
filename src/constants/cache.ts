/**
 * Cache configuration constants for React Query
 * Defines stale times for different data types based on update frequency
 */

/**
 * Stale time constants (in milliseconds)
 * Data is considered "stale" after this duration and will be refetched in the background
 */
export const STALE_TIMES = {
  /** Settings data - rarely changes (10 minutes) */
  SETTINGS: 10 * 60 * 1000,
  
  /** User profile data - changes infrequently (5 minutes) */
  USER_PROFILE: 5 * 60 * 1000,
  
  /** Leave balances - moderate update frequency (5 minutes) */
  LEAVE_BALANCES: 5 * 60 * 1000,
  
  /** Employee/headcount data - changes infrequently (5 minutes) */
  EMPLOYEES: 5 * 60 * 1000,
  
  /** Shift data - moderate update frequency (2 minutes) */
  SHIFTS: 2 * 60 * 1000,
  
  /** Leave requests - frequent updates (1 minute) */
  LEAVE_REQUESTS: 1 * 60 * 1000,
  
  /** Swap requests - frequent updates (1 minute) */
  SWAP_REQUESTS: 1 * 60 * 1000,
  
  /** Comments - frequent updates (1 minute) */
  COMMENTS: 1 * 60 * 1000,
} as const

/**
 * Cache time constants (in milliseconds)
 * Data is kept in cache for this duration even when not in use
 */
export const CACHE_TIMES = {
  /** Default cache time for most queries (5 minutes) */
  DEFAULT: 5 * 60 * 1000,
  
  /** Extended cache time for rarely changing data (30 minutes) */
  EXTENDED: 30 * 60 * 1000,
  
  /** Short cache time for frequently changing data (2 minutes) */
  SHORT: 2 * 60 * 1000,
} as const

/**
 * Query key prefixes for consistent cache management
 */
export const QUERY_KEYS = {
  SETTINGS: 'settings',
  USER_PROFILE: 'userProfile',
  LEAVE_BALANCES: 'leaveBalances',
  LEAVE_TYPES: 'leaveTypes',
  EMPLOYEES: 'employees',
  SHIFTS: 'shifts',
  LEAVE_REQUESTS: 'leaveRequests',
  SWAP_REQUESTS: 'swapRequests',
  COMMENTS: 'comments',
} as const
