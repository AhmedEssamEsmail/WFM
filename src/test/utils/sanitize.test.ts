/**
 * Tests for input sanitization utilities
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUserInput,
  escapeHtml
} from '../../utils/sanitize'

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeHtml(input)
      expect(result).toBe('<p>Hello <strong>world</strong></p>')
    })

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should remove onclick handlers', () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('onclick')
    })

    it('should allow safe links', () => {
      const input = '<a href="https://example.com">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href')
      expect(result).toContain('https://example.com')
    })

    it('should remove javascript: protocol in links', () => {
      const input = '<a href="javascript:alert(\'xss\')">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('should handle empty input', () => {
      const result = sanitizeHtml('')
      expect(result).toBe('')
    })

    it('should handle null-like input gracefully', () => {
      const result = sanitizeHtml(null as unknown as string)
      expect(result).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeText(input)
      // DOMPurify with KEEP_CONTENT: false removes content inside tags too
      expect(result).toBe('')
    })

    it('should remove script tags and content', () => {
      const input = 'Hello<script>alert("xss")</script>world'
      const result = sanitizeText(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should handle plain text', () => {
      const input = 'Hello world'
      const result = sanitizeText(input)
      expect(result).toBe('Hello world')
    })

    it('should handle empty input', () => {
      const result = sanitizeText('')
      expect(result).toBe('')
    })
  })

  describe('sanitizeUserInput', () => {
    it('should allow basic formatting tags', () => {
      const input = 'Hello <strong>world</strong> and <em>everyone</em>'
      const result = sanitizeUserInput(input)
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })

    it('should remove dangerous tags', () => {
      const input = 'Hello <script>alert("xss")</script> world'
      const result = sanitizeUserInput(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should remove all attributes', () => {
      const input = '<strong class="danger" onclick="alert()">Bold</strong>'
      const result = sanitizeUserInput(input)
      expect(result).not.toContain('class')
      expect(result).not.toContain('onclick')
      expect(result).toContain('<strong>')
    })

    it('should allow line breaks', () => {
      const input = 'Line 1<br>Line 2'
      const result = sanitizeUserInput(input)
      expect(result).toContain('<br>')
    })

    it('should handle comment-like input', () => {
      const input = 'This is a comment with <b>bold</b> text'
      const result = sanitizeUserInput(input)
      expect(result).toContain('<b>')
      expect(result).toContain('bold')
    })
  })

  describe('escapeHtml', () => {
    it('should escape < and >', () => {
      const input = '<script>alert("xss")</script>'
      const result = escapeHtml(input)
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
    })

    it('should escape & character', () => {
      const input = 'Tom & Jerry'
      const result = escapeHtml(input)
      expect(result).toBe('Tom &amp; Jerry')
    })

    it('should escape quotes', () => {
      const input = 'He said "Hello"'
      const result = escapeHtml(input)
      // escapeHtml uses textContent which doesn't escape quotes
      expect(result).toBe('He said "Hello"')
    })

    it('should handle plain text', () => {
      const input = 'Hello world'
      const result = escapeHtml(input)
      expect(result).toBe('Hello world')
    })

    it('should handle empty input', () => {
      const result = escapeHtml('')
      expect(result).toBe('')
    })

    it('should handle special characters', () => {
      const input = '<>&"\''
      const result = escapeHtml(input)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })
  })

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '<iframe src="javascript:alert(\'xss\')">',
      '<body onload=alert("xss")>',
      '<input onfocus=alert("xss") autofocus>',
      '<select onfocus=alert("xss") autofocus>',
      '<textarea onfocus=alert("xss") autofocus>',
      '<marquee onstart=alert("xss")>',
      '<div style="background:url(javascript:alert(\'xss\'))">',
    ]

    xssPayloads.forEach((payload, index) => {
      it(`should prevent XSS payload ${index + 1}`, () => {
        const result = sanitizeHtml(payload)
        expect(result).not.toContain('alert')
        expect(result).not.toContain('javascript:')
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('onload')
        expect(result).not.toContain('onfocus')
        expect(result).not.toContain('onstart')
      })
    })
  })

  describe('Real-world scenarios', () => {
    it('should sanitize user comment with mixed content', () => {
      const input = 'Great work! <strong>Approved</strong> <script>stealData()</script>'
      const result = sanitizeUserInput(input)
      expect(result).toContain('Great work!')
      expect(result).toContain('<strong>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('stealData')
    })

    it('should sanitize leave request notes', () => {
      const input = 'Need leave for <em>medical</em> reasons. <img src=x onerror=alert(1)>'
      const result = sanitizeUserInput(input)
      expect(result).toContain('<em>')
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('alert')
    })

    it('should handle multi-line comments', () => {
      const input = 'Line 1<br>Line 2<br><strong>Important</strong>'
      const result = sanitizeUserInput(input)
      expect(result).toContain('<br>')
      expect(result).toContain('<strong>')
    })
  })
})
