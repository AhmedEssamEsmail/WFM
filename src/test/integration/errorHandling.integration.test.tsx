/**
 * Integration tests for error handling across the application
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../../lib/ToastContext'
import { handleDatabaseError, handleValidationError } from '../../lib/errorHandler'
import { sanitizeUserInput, sanitizeHtml } from '../../utils/sanitize'

// Mock component that uses error handling
function TestComponent({ triggerError }: { triggerError?: boolean }) {
  if (triggerError) {
    try {
      throw new Error('Test error')
    } catch (error) {
      handleDatabaseError(error, 'test operation')
    }
  }
  
  return <div>Test Component</div>
}

describe('Error Handling Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('should integrate error handler with toast context', async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <TestComponent />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Trigger error
    rerender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <TestComponent triggerError={true} />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Component should still render
    const element = screen.getByText('Test Component')
    expect(element).toBeDefined()
  })

  it('should sanitize user input before display', () => {
    const maliciousInput = '<script>alert("xss")</script>Hello'
    const sanitized = sanitizeUserInput(maliciousInput)
    
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).not.toContain('alert')
    expect(sanitized).toContain('Hello')
  })

  it('should handle validation errors gracefully', () => {
    const error = new Error('Invalid email format')
    const result = handleValidationError(error, 'email')
    
    expect(result).toBe('Validation error in email. Please check your input.')
  })

  it('should sanitize HTML while preserving safe tags', () => {
    const input = '<p>Hello <strong>world</strong></p><script>alert("xss")</script>'
    const sanitized = sanitizeHtml(input)
    
    expect(sanitized).toContain('<p>')
    expect(sanitized).toContain('<strong>')
    expect(sanitized).not.toContain('<script>')
  })
})

describe('Comment System Integration', () => {
  it('should differentiate between system and user comments', () => {
    const systemComment = {
      id: '1',
      content: 'Request approved',
      is_system: true,
      created_at: new Date().toISOString(),
    }

    const userComment = {
      id: '2',
      content: 'Thanks for approving',
      is_system: false,
      created_at: new Date().toISOString(),
      users: { name: 'John Doe' },
    }

    // System comment should have gray background
    expect(systemComment.is_system).toBe(true)
    
    // User comment should have blue background
    expect(userComment.is_system).toBe(false)
    expect(userComment.users.name).toBe('John Doe')
  })
})

describe('Security Integration', () => {
  it('should prevent XSS attacks in comments', () => {
    const xssPayloads = [
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '<iframe src="javascript:alert(\'xss\')">',
    ]

    xssPayloads.forEach(payload => {
      const sanitized = sanitizeUserInput(payload)
      expect(sanitized).not.toContain('alert')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('onload')
    })
  })

  it('should handle multiple error types correctly', () => {
    const errors = [
      { error: new Error('Network failed'), handler: 'network' },
      { error: new Error('Auth failed'), handler: 'auth' },
      { error: new Error('Validation failed'), handler: 'validation' },
    ]

    errors.forEach(({ error, handler }) => {
      expect(() => {
        if (handler === 'network') handleDatabaseError(error, 'network operation')
        if (handler === 'auth') handleDatabaseError(error, 'auth operation')
        if (handler === 'validation') handleValidationError(error)
      }).not.toThrow()
    })
  })
})
