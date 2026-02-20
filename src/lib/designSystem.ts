// WFM Design System - Unified Colors and Styles
// Use these constants throughout the app for consistency

import type {
  ShiftType,
  LeaveType,
  SwapRequestStatus,
  LeaveRequestStatus,
  UserRole,
} from '../types';

// ============================================
// PRIMARY COLORS (Blue theme from Tailwind config)
// ============================================
export const PRIMARY_COLORS = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb', // Main brand color
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
} as const;

// ============================================
// SEMANTIC COLORS
// ============================================
export const SEMANTIC_COLORS = {
  // Success states
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    icon: 'text-green-600',
  },
  // Error/Danger states
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: 'text-red-600',
  },
  // Warning states
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    icon: 'text-yellow-600',
  },
  // Info states
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'text-blue-600',
  },
  // Neutral states
  neutral: {
    bg: 'bg-gray-50',
    text: 'text-gray-800',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
    button: 'bg-gray-600 hover:bg-gray-700 text-white',
    icon: 'text-gray-600',
  },
} as const;

// ============================================
// SHIFT TYPE COLORS
// ============================================
export const SHIFT_COLORS: Record<ShiftType, string> = {
  AM: 'bg-blue-100 text-blue-900',
  PM: 'bg-purple-100 text-purple-900',
  BET: 'bg-orange-100 text-orange-900',
  OFF: 'bg-gray-200 text-gray-900',
} as const;

export const SHIFT_LABELS: Record<ShiftType, string> = {
  AM: 'AM',
  PM: 'PM',
  BET: 'BET',
  OFF: 'OFF',
} as const;

// ============================================
// LEAVE TYPE COLORS
// ============================================
export const LEAVE_COLORS: Record<LeaveType, string> = {
  sick: 'bg-red-100 text-red-900 border-red-300',
  annual: 'bg-green-100 text-green-900 border-green-300',
  casual: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  public_holiday: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  bereavement: 'bg-gray-300 text-gray-900 border-gray-400',
} as const;

export const LEAVE_LABELS: Record<LeaveType, string> = {
  sick: 'Sick',
  annual: 'Annual',
  casual: 'Casual',
  public_holiday: 'Holiday',
  bereavement: 'Bereav.',
} as const;

export const LEAVE_DESCRIPTIONS: Record<LeaveType, string> = {
  sick: 'Sick Leave',
  annual: 'Annual Leave',
  casual: 'Casual Leave',
  public_holiday: 'Public Holiday',
  bereavement: 'Bereavement Leave',
} as const;

// ============================================
// REQUEST STATUS COLORS (WFM v2 Design)
// ============================================
export const SWAP_STATUS_COLORS: Record<SwapRequestStatus, string> = {
  pending_acceptance: 'bg-blue-100 text-blue-800 border-blue-200',
  pending_tl: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_wfm: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
} as const;

export const LEAVE_STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  pending_tl: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_wfm: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  denied: 'bg-red-100 text-red-800 border-red-200',
} as const;

export const STATUS_LABELS: Record<SwapRequestStatus | LeaveRequestStatus, string> = {
  pending_acceptance: 'Pending Recipient',
  pending_tl: 'Pending TL',
  pending_wfm: 'Pending WFM',
  approved: 'Approved',
  rejected: 'Rejected',
  denied: 'Denied',
} as const;

// ============================================
// USER ROLE COLORS
// ============================================
export const ROLE_COLORS: Record<UserRole, string> = {
  agent: 'bg-blue-100 text-blue-900',
  tl: 'bg-green-100 text-green-900',
  wfm: 'bg-purple-100 text-purple-900',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  agent: 'Agent',
  tl: 'Team Lead',
  wfm: 'WFM',
} as const;

// ============================================
// REQUEST TYPE COLORS (WFM v2 Design)
// ============================================
export const REQUEST_TYPE_COLORS = {
  swap: 'bg-blue-100 text-blue-800 border-blue-200',
  leave: 'bg-orange-100 text-orange-800 border-orange-200',
} as const;

export const REQUEST_TYPE_LABELS = {
  swap: 'Swap',
  leave: 'Leave',
} as const;

// ============================================
// STAT CARD COLORS (WFM v2 Design)
// ============================================
export const STAT_CARD_COLORS = {
  totalStaff: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
  },
  activeShifts: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
  },
  pendingRequests: {
    bg: 'bg-yellow-100',
    icon: 'text-yellow-600',
  },
  openSwaps: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
  },
} as const;

// ============================================
// COVERAGE LEVEL COLORS (WFM v2 Design)
// ============================================
export const COVERAGE_LEVEL_COLORS = {
  adequate: 'bg-green-500',
  low: 'bg-yellow-500',
  critical: 'bg-red-500',
} as const;

export const COVERAGE_LEVEL_LABELS = {
  adequate: 'Adequate',
  low: 'Low',
  critical: 'Critical',
} as const;

// ============================================
// SHIFT TYPE COLORS (WFM v2 Design - Enhanced)
// ============================================
// NOTE: These are fallback colors only. Actual shift display should use
// shift configurations from the database via shiftConfigurationsService
export const SHIFT_TYPE_COLORS = {
  Morning: 'bg-sky-100 text-sky-900 border-sky-200',
  Day: 'bg-blue-500 text-white border-blue-600',
  Evening: 'bg-purple-500 text-white border-purple-600',
  Night: 'bg-slate-700 text-white border-slate-800',
} as const;

// ============================================
// BUTTON STYLES
// ============================================
export const BUTTON_STYLES = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  success:
    'bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  warning:
    'bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'hover:bg-gray-100 text-gray-700 font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  link: 'text-primary-600 hover:text-primary-700 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// ============================================
// BADGE STYLES
// ============================================
export const BADGE_STYLES = {
  default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  large: 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
  small: 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
} as const;

// ============================================
// CARD STYLES
// ============================================
export const CARD_STYLES = {
  default: 'bg-white rounded-lg shadow p-6',
  hover: 'bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer',
  bordered: 'bg-white rounded-lg border border-gray-200 p-6',
  flat: 'bg-white rounded-lg p-6',
} as const;

// ============================================
// INPUT STYLES
// ============================================
export const INPUT_STYLES = {
  default:
    'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base sm:text-sm',
  error:
    'block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-base sm:text-sm',
  disabled:
    'block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed text-base sm:text-sm',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status color class for any request status
 */
export function getStatusColor(status: SwapRequestStatus | LeaveRequestStatus): string {
  if (status in SWAP_STATUS_COLORS) {
    return SWAP_STATUS_COLORS[status as SwapRequestStatus];
  }
  return LEAVE_STATUS_COLORS[status as LeaveRequestStatus];
}

/**
 * Get status label for any request status
 */
export function getStatusLabel(status: SwapRequestStatus | LeaveRequestStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Get shift color class
 */
export function getShiftColor(shiftType: ShiftType): string {
  return SHIFT_COLORS[shiftType];
}

/**
 * Get leave color class
 */
export function getLeaveColor(leaveType: LeaveType): string {
  return LEAVE_COLORS[leaveType];
}

/**
 * Get role color class
 */
export function getRoleColor(role: UserRole): string {
  return ROLE_COLORS[role];
}

/**
 * Combine class names (simple utility)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
