import { expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as fc from 'fast-check';
import { cleanup, configure } from '@testing-library/react';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Configure React Testing Library with faster timeouts
configure({
  asyncUtilTimeout: 1000, // Reduced from default 1000ms (keeping it but being explicit)
  // For most tests, we'll use even shorter timeouts via waitFor options
});

// Clean up after each test to prevent memory leaks
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('VITE_ALLOWED_EMAIL_DOMAIN', 'dabdoob.com');

// Configure fast-check for property-based testing
const propertyTestConfig = {
  numRuns: 50, // Reduced from 100 for faster tests
  maxSize: 30, // Reduced from 50
  seed: 42,
  timeout: 3000, // Reduced from 5000
};

// Export configured fast-check instance
export { fc, propertyTestConfig };
