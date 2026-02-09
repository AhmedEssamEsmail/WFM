// Date utility functions using date-fns

import { 
  format, 
  parseISO, 
  isValid, 
  differenceInDays,
  differenceInCalendarDays,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWeekend,
  isSameDay,
  isBefore,
  isFuture,
  isPast,
  isToday,
} from 'date-fns'
import { DATE_FORMATS } from '../constants'

/**
 * Format a date string or Date object to display format
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = DATE_FORMATS.DISPLAY): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, formatStr)
  } catch {
    return ''
  }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMATS.ISO)
}

/**
 * Format date to short display (MM/DD/YYYY)
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMATS.DISPLAY_SHORT)
}

/**
 * Format date to long display (January 01, 2024)
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMATS.DISPLAY_LONG)
}

/**
 * Format datetime with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, DATE_FORMATS.DATETIME)
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  
  try {
    const date = parseISO(dateString)
    return isValid(date) ? date : null
  } catch {
    return null
  }
}

/**
 * Calculate number of days between two dates
 */
export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    
    if (!isValid(start) || !isValid(end)) return 0
    
    return differenceInCalendarDays(end, start) + 1 // +1 to include both start and end dates
  } catch {
    return 0
  }
}

/**
 * Calculate business days between two dates (excluding weekends)
 */
export function getBusinessDaysBetween(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    
    if (!isValid(start) || !isValid(end)) return 0
    
    let count = 0
    let currentDate = start
    
    while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
      if (!isWeekend(currentDate)) {
        count++
      }
      currentDate = addDays(currentDate, 1)
    }
    
    return count
  } catch {
    return 0
  }
}

/**
 * Check if a date is in the past
 */
export function isDatePast(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && isPast(dateObj) && !isToday(dateObj)
  } catch {
    return false
  }
}

/**
 * Check if a date is in the future
 */
export function isDateFuture(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && isFuture(dateObj)
  } catch {
    return false
  }
}

/**
 * Check if a date is today
 */
export function isDateToday(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && isToday(dateObj)
  } catch {
    return false
  }
}

/**
 * Get start of current week
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday
}

/**
 * Get end of current week
 */
export function getEndOfWeek(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 }) // Monday
}

/**
 * Get start of current month
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return startOfMonth(date)
}

/**
 * Get end of current month
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return endOfMonth(date)
}

/**
 * Get date range for "last month"
 */
export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const lastMonth = subDays(startOfMonth(now), 1)
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  }
}

/**
 * Get date range for "current month"
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  return {
    start: getStartOfMonth(),
    end: getEndOfMonth(),
  }
}

/**
 * Validate date range (start must be before or equal to end)
 */
export function isValidDateRange(startDate: string | Date, endDate: string | Date): boolean {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    
    if (!isValid(start) || !isValid(end)) return false
    
    return isBefore(start, end) || isSameDay(start, end)
  } catch (_error) {
    return false
  }
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 days")
 */
export function getRelativeTimeString(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    const now = new Date()
    const days = differenceInDays(now, dateObj)
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days === -1) return 'Tomorrow'
    if (days > 0) return `${days} days ago`
    return `in ${Math.abs(days)} days`
  } catch (_error) {
    return ''
  }
}

/**
 * Get array of dates between start and end
 */
export function getDateRange(startDate: string | Date, endDate: string | Date): Date[] {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    
    if (!isValid(start) || !isValid(end)) return []
    
    const dates: Date[] = []
    let currentDate = start
    
    while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
      dates.push(currentDate)
      currentDate = addDays(currentDate, 1)
    }
    
    return dates
  } catch (_error) {
    return []
  }
}

/**
 * Get today's date in ISO format
 */
export function getTodayISO(): string {
  return formatDateISO(new Date())
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return addDays(dateObj, days)
}

/**
 * Subtract days from a date
 */
export function subtractDaysFromDate(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return subDays(dateObj, days)
}
