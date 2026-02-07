/**
 * Input sanitization utilities using DOMPurify
 * Protects against XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

/**
 * Sanitize plain text by removing all HTML tags
 * @param dirty - The potentially unsafe string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize user input for comments and notes
 * Allows basic formatting but removes dangerous content
 * @param dirty - The user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Escape HTML special characters
 * @param text - The text to escape
 * @returns Escaped text safe for HTML context
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
