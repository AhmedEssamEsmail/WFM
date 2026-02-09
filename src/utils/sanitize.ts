/**
 * Input sanitization utilities
 * Uses DOMPurify for robust XSS protection
 */

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize plain text by removing all HTML tags
 * @param dirty - The potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: false, // Remove script content too
  })
}

/**
 * Sanitize user input for comments and notes
 * Allows basic formatting but removes dangerous content
 * @param dirty - The user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  }).trim()
}

/**
 * Escape HTML special characters
 * @param text - The text to escape
 * @returns Escaped text safe for HTML context
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(text))
  return div.innerHTML
}
