/**
 * Test optimization utilities
 * Provides faster alternatives to common testing patterns
 */

import { waitFor as originalWaitFor, type waitForOptions } from '@testing-library/react';

/**
 * Optimized waitFor with shorter default timeout
 * Use this instead of the default waitFor for faster tests
 *
 * @param callback - The callback to wait for
 * @param options - waitFor options (defaults to 100ms timeout instead of 1000ms)
 */
export async function waitFor<T>(
  callback: () => T | Promise<T>,
  options?: waitForOptions
): Promise<T> {
  return originalWaitFor(callback, {
    timeout: 100, // 10x faster than default 1000ms
    interval: 10, // Check every 10ms instead of 50ms
    ...options, // Allow override if needed
  });
}

/**
 * For tests that genuinely need more time (e.g., animations, debouncing)
 */
export async function waitForSlow<T>(
  callback: () => T | Promise<T>,
  options?: waitForOptions
): Promise<T> {
  return originalWaitFor(callback, {
    timeout: 500,
    ...options,
  });
}
