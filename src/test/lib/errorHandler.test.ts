/**
 * Tests for centralized error handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  errorHandler,
  handleError,
  handleNetworkError,
  handleAuthError,
  handleValidationError,
  handleDatabaseError,
  handlePermissionError,
  initializeErrorHandler,
  getRecentErrors,
  clearErrorLogs,
} from '../../lib/errorHandler';

describe('ErrorHandler', () => {
  let mockToastFn: (message: string, type: 'error' | 'success' | 'warning' | 'info') => void;

  beforeEach(() => {
    mockToastFn = vi.fn();
    initializeErrorHandler(mockToastFn);
    clearErrorLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = handleError(error, { userMessage: 'Custom message' });

      expect(result).toBe('Custom message');
      expect(mockToastFn).toHaveBeenCalledWith('Custom message', 'error');
    });

    it('should handle string errors', () => {
      const error = 'String error';
      const result = handleError(error, { userMessage: 'Custom message' });

      expect(result).toBe('Custom message');
      expect(mockToastFn).toHaveBeenCalledWith('Custom message', 'error');
    });

    it('should handle unknown errors', () => {
      const error = { code: 'UNKNOWN' };
      const result = handleError(error);

      expect(result).toBe('An unexpected error occurred');
      expect(mockToastFn).toHaveBeenCalledWith('An unexpected error occurred', 'error');
    });

    it('should not show toast when showToast is false', () => {
      const error = new Error('Test error');
      handleError(error, { showToast: false });

      expect(mockToastFn).not.toHaveBeenCalled();
    });

    it('should store error logs', () => {
      const error = new Error('Test error');
      handleError(error, { userMessage: 'Test message' });

      const recentErrors = getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].userMessage).toBe('Test message');
      expect(recentErrors[0].error).toBe(error);
    });

    it('should include context in error logs', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      handleError(error, { context });

      const recentErrors = getRecentErrors(1);
      expect(recentErrors[0].context).toEqual(context);
    });

    it('should limit error logs to 100 entries', () => {
      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        handleError(new Error(`Error ${i}`), { showToast: false });
      }

      const allErrors = getRecentErrors(150);
      expect(allErrors.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Specific error handlers', () => {
    it('should handle network errors', () => {
      const error = new Error('Network failed');
      const result = handleNetworkError(error);

      expect(result).toBe('Network error. Please check your connection and try again.');
      expect(mockToastFn).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
        'error'
      );
    });

    it('should handle auth errors', () => {
      const error = new Error('Auth failed');
      const result = handleAuthError(error);

      expect(result).toBe('Authentication error. Please log in again.');
      expect(mockToastFn).toHaveBeenCalledWith(
        'Authentication error. Please log in again.',
        'error'
      );
    });

    it('should handle validation errors without field', () => {
      const error = new Error('Validation failed');
      const result = handleValidationError(error);

      expect(result).toBe('Please check your input and try again.');
    });

    it('should handle validation errors with field', () => {
      const error = new Error('Validation failed');
      const result = handleValidationError(error, 'email');

      expect(result).toBe('Validation error in email. Please check your input.');
    });

    it('should handle database errors without operation', () => {
      const error = new Error('DB failed');
      const result = handleDatabaseError(error);

      expect(result).toBe('Database error. Please try again.');
    });

    it('should handle database errors with operation', () => {
      const error = new Error('DB failed');
      const result = handleDatabaseError(error, 'save data');

      expect(result).toBe('Failed to save data. Please try again.');
    });

    it('should handle permission errors', () => {
      const error = new Error('Permission denied');
      const result = handlePermissionError(error);

      expect(result).toBe('You do not have permission to perform this action.');
    });
  });

  describe('Error log management', () => {
    it('should retrieve recent errors', () => {
      handleError(new Error('Error 1'), { showToast: false });
      handleError(new Error('Error 2'), { showToast: false });
      handleError(new Error('Error 3'), { showToast: false });

      const recent = getRecentErrors(2);
      expect(recent).toHaveLength(2);
      // Should return most recent errors
      expect((recent[1].error as Error).message).toBe('Error 3');
    });

    it('should clear error logs', () => {
      handleError(new Error('Error 1'), { showToast: false });
      handleError(new Error('Error 2'), { showToast: false });

      clearErrorLogs();

      const recent = getRecentErrors();
      expect(recent).toHaveLength(0);
    });
  });

  describe('Toast integration', () => {
    it('should work without toast function initialized', () => {
      // Create a new instance without toast
      const newHandler = errorHandler;
      newHandler.setToastFunction(null);

      // Should not throw
      expect(() => {
        handleError(new Error('Test'), { showToast: true });
      }).not.toThrow();
    });

    it('should call toast function with correct parameters', () => {
      handleError(new Error('Test'), { userMessage: 'User friendly message' });

      expect(mockToastFn).toHaveBeenCalledTimes(1);
      expect(mockToastFn).toHaveBeenCalledWith('User friendly message', 'error');
    });
  });

  describe('Development vs Production behavior', () => {
    it('should log to console in development when logToConsole is true', () => {
      const consoleSpy = vi.spyOn(console, 'group');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      handleError(new Error('Test error'), { logToConsole: true });

      // In development mode (import.meta.env.DEV), console should be called
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should not log to console when logToConsole is false', () => {
      const consoleSpy = vi.spyOn(console, 'group');

      handleError(new Error('Test error'), { logToConsole: false });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
