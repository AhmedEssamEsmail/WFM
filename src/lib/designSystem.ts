// WFM Design System - Unified Colors and Styles
// Use these constants throughout the app for consistency

import type { ShiftType, LeaveType, SwapRequestStatus, LeaveRequestStatus, UserRole } from '../types'

// ============================================
// PRIMARY COLORS (Indigo theme - modernized)
// ============================================
export const PRIMARY_COLORS = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',  // Main brand color
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
} as const

// ============================================
// SEMANTIC COLORS
// ============================================
export const SEMANTIC_COLORS = {
  // Success states
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    icon: 'text-green-600 dark:text-green-400',
  },
  // Error/Danger states
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: 'text-red-600 dark:text-red-400',
  },
  // Warning states
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  // Info states
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  // Neutral states
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    button: 'bg-slate-600 hover:bg-slate-700 text-white',
    icon: 'text-slate-600 dark:text-slate-400',
  },
} as const

// ============================================
// SHIFT TYPE COLORS
// ============================================
export const SHIFT_COLORS: Record<ShiftType, string> = {
  AM: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
  PM: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300',
  BET: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
  OFF: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-300',
} as const

export const SHIFT_LABELS: Record<ShiftType, string> = {
  AM: 'AM',
  PM: 'PM',
  BET: 'BET',
  OFF: 'OFF',
} as const

export const SHIFT_DESCRIPTIONS: Record<ShiftType, string> = {
  AM: 'Morning Shift',
  PM: 'Afternoon Shift',
  BET: 'Between Shift',
  OFF: 'Day Off',
} as const

// ============================================
// LEAVE TYPE COLORS
// ============================================
export const LEAVE_COLORS: Record<LeaveType, string> = {
  sick: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  annual: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  casual: 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  public_holiday: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  bereavement: 'bg-slate-300 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
} as const

export const LEAVE_LABELS: Record<LeaveType, string> = {
  sick: 'Sick',
  annual: 'Annual',
  casual: 'Casual',
  public_holiday: 'Holiday',
  bereavement: 'Bereav.',
} as const

export const LEAVE_DESCRIPTIONS: Record<LeaveType, string> = {
  sick: 'Sick Leave',
  annual: 'Annual Leave',
  casual: 'Casual Leave',
  public_holiday: 'Public Holiday',
  bereavement: 'Bereavement Leave',
} as const

// ============================================
// REQUEST STATUS COLORS
// ============================================
export const SWAP_STATUS_COLORS: Record<SwapRequestStatus, string> = {
  pending_acceptance: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_tl: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-400',
  pending_wfm: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-400',
  approved: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-400',
} as const

export const LEAVE_STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  pending_tl: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-400',
  pending_wfm: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-400',
  approved: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-400',
  denied: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-400',
} as const

export const STATUS_LABELS: Record<SwapRequestStatus | LeaveRequestStatus, string> = {
  pending_acceptance: 'Pending Acceptance',
  pending_tl: 'Pending TL',
  pending_wfm: 'Pending WFM',
  approved: 'Approved',
  rejected: 'Rejected',
  denied: 'Denied',
} as const

// ============================================
// USER ROLE COLORS
// ============================================
export const ROLE_COLORS: Record<UserRole, string> = {
  agent: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300',
  tl: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300',
  wfm: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  agent: 'Agent',
  tl: 'Team Lead',
  wfm: 'WFM',
} as const

// ============================================
// BUTTON STYLES
// ============================================
export const BUTTON_STYLES = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  success: 'bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  link: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed',
} as const

// ============================================
// BADGE STYLES
// ============================================
export const BADGE_STYLES = {
  default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  large: 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
  small: 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
} as const

// ============================================
// CARD STYLES
// ============================================
export const CARD_STYLES = {
  default: 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6',
  hover: 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer',
  bordered: 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6',
  flat: 'bg-white dark:bg-slate-900 rounded-xl p-6',
} as const

// ============================================
// INPUT STYLES
// ============================================
export const INPUT_STYLES = {
  default: 'block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 text-base sm:text-sm',
  error: 'block w-full rounded-lg border-red-300 dark:border-red-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 focus:ring-2 text-base sm:text-sm',
  disabled: 'block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed text-base sm:text-sm',
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status color class for any request status
 */
export function getStatusColor(status: SwapRequestStatus | LeaveRequestStatus): string {
  if (status in SWAP_STATUS_COLORS) {
    return SWAP_STATUS_COLORS[status as SwapRequestStatus]
  }
  return LEAVE_STATUS_COLORS[status as LeaveRequestStatus]
}

/**
 * Get status label for any request status
 */
export function getStatusLabel(status: SwapRequestStatus | LeaveRequestStatus): string {
  return STATUS_LABELS[status]
}

/**
 * Get shift color class
 */
export function getShiftColor(shiftType: ShiftType): string {
  return SHIFT_COLORS[shiftType]
}

/**
 * Get leave color class
 */
export function getLeaveColor(leaveType: LeaveType): string {
  return LEAVE_COLORS[leaveType]
}

/**
 * Get role color class
 */
export function getRoleColor(role: UserRole): string {
  return ROLE_COLORS[role]
}

/**
 * Combine class names (simple utility)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}