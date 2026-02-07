// Formatting utility functions

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format FTE percentage (0.8 -> "80%")
 */
export function formatFTE(fte: number): string {
  return `${Math.round(fte * 100)}%`
}

/**
 * Format decimal to percentage (0.75 -> "75%")
 */
export function formatPercentage(decimal: number, decimals: number = 0): string {
  return `${(decimal * 100).toFixed(decimals)}%`
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Format with country code +X (XXX) XXX-XXXX
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  // Return as-is if format doesn't match
  return phone
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitleCase(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitleCase(text: string): string {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Format array as comma-separated list with "and" before last item
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  
  const allButLast = items.slice(0, -1).join(', ')
  const last = items[items.length - 1]
  return `${allButLast}, and ${last}`
}

/**
 * Format initials from name (John Doe -> JD)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

/**
 * Format email to display name (john.doe@example.com -> John Doe)
 */
export function emailToDisplayName(email: string): string {
  const username = email.split('@')[0]
  return capitalizeWords(username.replace(/[._-]/g, ' '))
}

/**
 * Pluralize word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural || `${singular}s`
}

/**
 * Format count with pluralized word (5 items, 1 item)
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`
}

/**
 * Mask sensitive data (show only last 4 characters)
 */
export function maskData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return data
  const masked = '*'.repeat(data.length - visibleChars)
  return masked + data.slice(-visibleChars)
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format boolean to Yes/No
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No'
}

/**
 * Format array of strings as badges/tags
 */
export function formatTags(tags: string[]): string {
  return tags.join(', ')
}

/**
 * Remove extra whitespace and trim
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Format employee ID with padding (123 -> EMP-0123)
 */
export function formatEmployeeId(id: string | number, prefix: string = 'EMP'): string {
  const numStr = String(id).padStart(4, '0')
  return `${prefix}-${numStr}`
}
