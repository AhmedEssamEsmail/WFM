/**
 * Input sanitization utilities
 * Protects against XSS attacks by sanitizing user-generated content
 * Note: For production, consider using DOMPurify in browser context
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  // Strip all HTML tags except safe ones
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
}

/**
 * Sanitize plain text by removing all HTML tags
 * @param dirty - The potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string): string {
  return dirty.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize user input for comments and notes
 * Allows basic formatting but removes dangerous content
 * @param dirty - The user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(dirty: string): string {
  // Remove dangerous tags and attributes
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

/**
 * Escape HTML special characters
 * @param text - The text to escape
 * @returns Escaped text safe for HTML context
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
