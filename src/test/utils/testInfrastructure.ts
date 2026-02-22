/**
 * Test Infrastructure Utilities
 *
 * Central export point for all test infrastructure utilities including:
 * - Mock helpers for Supabase and React Query
 * - Test data fixtures and generators
 * - Property-based testing generators
 * - Performance monitoring utilities
 *
 * ## Quick Start
 *
 * ### 1. Import what you need
 * ```typescript
 * import {
 *   createSelectMock,
 *   MOCK_USERS,
 *   agentBreakScheduleArb,
 *   withPerformanceTracking
 * } from './utils/testInfrastructure';
 * ```
 *
 * ### 2. Use mock helpers in tests
 * ```typescript
 * const mockSupabase = {
 *   from: vi.fn(() => createSelectMock(MOCK_USERS))
 * };
 * ```
 *
 * ### 3. Use generators for property tests
 * ```typescript
 * fc.assert(fc.property(agentBreakScheduleArb, (agent) => {
 *   // Test properties
 * }));
 * ```
 *
 * ## Naming Conventions
 *
 * - `*Mock` - Functions that create mock objects
 * - `MOCK_*` - Predefined test data constants
 * - `*Arb` - Fast-check arbitraries (generators)
 * - `*Helper` - Utility functions for test setup
 */

// Re-export mock helpers
export {
  createSelectMock,
  createSelectEqMock,
  createSelectOrderEqMock,
  createInsertMock,
  createUpdateMock,
  createDeleteMock,
  createUpsertMock,
  createSelectDateRangeMock,
  createSelectIlikeMock,
  createSelectIlikeNeqMock,
  createSelectMaybeSingleMock,
  createAuthMock,
  setupMockCleanup,
  createQueryMock,
  createMutationMock,
  createFormMock,
  createRouterMock,
} from '../fixtures/mockHelpers';

// Re-export test data
export {
  TEST_UUIDS,
  MOCK_USERS,
  MOCK_SKILLS,
  MOCK_BREAK_RULES,
  MOCK_DISTRIBUTION_SETTINGS,
  MOCK_SWAP_REQUESTS,
  MOCK_LEAVE_REQUESTS,
  cloneFixture,
  createMultiple,
} from '../fixtures/testData';

// Re-export generators
export {
  breakTypeArb,
  shiftTypeArb,
  nonOffShiftTypeArb,
  timeArb,
  timeWithSecondsArb,
  dateArb,
  uuidArb,
  departmentArb,
  userRoleArb,
  agentNameArb,
  orderedBreakTimesArb,
  minutesToTime,
  agentBreakScheduleArb,
  breakScheduleRuleArb,
  generateIntervals,
  coverageSummaryArb,
  breakScheduleCSVDataArb,
  breakScheduleCSVArrayArb,
  invalidCSVDataArb,
} from '../generators/breakScheduleGenerators';

// Re-export performance monitoring
export {
  startPerformanceTracking,
  stopPerformanceTracking,
  getPerformanceMetrics,
  getAllPerformanceMetrics,
  clearPerformanceMetrics,
  generatePerformanceReport,
  withPerformanceTracking,
} from './performanceMonitor';

// Re-export fast-check configuration
export { fc, propertyTestConfig } from '../setup';

/**
 * Common test patterns and utilities
 */

/**
 * Wait for async operations to complete
 * Useful for testing hooks with async state updates
 *
 * @param ms - Milliseconds to wait (default: 0 for next tick)
 * @returns Promise that resolves after the specified time
 *
 * @example
 * ```typescript
 * // Wait for next tick
 * await waitForAsync();
 *
 * // Wait for specific duration
 * await waitForAsync(100);
 *
 * // Use in hook tests
 * const { result } = renderHook(() => useMyHook());
 * act(() => {
 *   result.current.fetchData();
 * });
 * await waitForAsync(); // Wait for state update
 * expect(result.current.data).toBeDefined();
 * ```
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock Supabase client for testing
 * Provides a complete mock with all common methods
 *
 * @returns Mock Supabase client with from(), auth, rpc(), and storage methods
 *
 * @example
 * ```typescript
 * const mockSupabase = createMockSupabaseClient();
 *
 * // Configure specific method behavior
 * mockSupabase.from.mockReturnValue(createSelectMock(mockData));
 *
 * // Mock authentication
 * mockSupabase.auth.signInWithPassword.mockResolvedValue({
 *   data: { session: mockSession },
 *   error: null
 * });
 *
 * // Use in tests
 * vi.mock('../../lib/supabase', () => ({
 *   supabase: mockSupabase
 * }));
 * ```
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(),
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    rpc: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  };
}

/**
 * Create a mock React Query client for testing
 *
 * @returns Mock QueryClient with common methods
 *
 * @example
 * ```typescript
 * const mockQueryClient = createMockQueryClient();
 *
 * // Configure cache behavior
 * mockQueryClient.getQueryData.mockReturnValue(cachedData);
 *
 * // Use in component tests
 * render(
 *   <QueryClientProvider client={mockQueryClient}>
 *     <MyComponent />
 *   </QueryClientProvider>
 * );
 * ```
 */
export function createMockQueryClient() {
  return {
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    refetchQueries: vi.fn(),
    clear: vi.fn(),
    removeQueries: vi.fn(),
    cancelQueries: vi.fn(),
  };
}

/**
 * Property test configuration for CSV round-trip tests
 * Ensures consistent configuration across all property tests
 *
 * Configuration:
 * - numRuns: 100 - Run each property test 100 times
 * - verbose: true - Show detailed output on failure
 * - seed: 42 - Use fixed seed for reproducible tests
 *
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(breakScheduleCSVDataArb, (data) => {
 *     // Test CSV round-trip
 *     const csv = generateCSV(data);
 *     const parsed = parseCSV(csv);
 *     expect(isBreakScheduleEquivalent(data, parsed)).toBe(true);
 *   }),
 *   csvPropertyTestConfig
 * );
 * ```
 */
export const csvPropertyTestConfig = {
  numRuns: 100,
  verbose: true,
  seed: 42,
};

/**
 * Helper to normalize time format for comparison
 * Converts HH:MM to HH:MM:SS for consistent comparison
 *
 * @param time - Time string in HH:MM or HH:MM:SS format, or null
 * @returns Normalized time string in HH:MM:SS format, or null
 *
 * @example
 * ```typescript
 * normalizeTimeFormat('09:00')    // '09:00:00'
 * normalizeTimeFormat('09:00:00') // '09:00:00'
 * normalizeTimeFormat(null)       // null
 * ```
 */
export function normalizeTimeFormat(time: string | null): string | null {
  if (!time) return null;
  if (time.length === 5) return `${time}:00`;
  return time;
}

/**
 * Helper to check if two break schedule data objects are equivalent
 * Accounts for time format normalization (HH:MM vs HH:MM:SS)
 *
 * This is useful for CSV round-trip tests where time formats may differ
 * but the data is semantically equivalent.
 *
 * @param a - First break schedule data object
 * @param b - Second break schedule data object
 * @returns true if objects are equivalent, false otherwise
 *
 * @example
 * ```typescript
 * const data1 = { agent_name: 'John', date: '2024-01-15', shift: 'AM', hb1_start: '09:00' };
 * const data2 = { agent_name: 'John', date: '2024-01-15', shift: 'AM', hb1_start: '09:00:00' };
 * isBreakScheduleEquivalent(data1, data2) // true
 * ```
 */
export function isBreakScheduleEquivalent(a: any, b: any): boolean {
  if (!a || !b) return a === b;

  return (
    a.agent_name === b.agent_name &&
    a.date === b.date &&
    a.shift === b.shift &&
    normalizeTimeFormat(a.hb1_start) === normalizeTimeFormat(b.hb1_start) &&
    normalizeTimeFormat(a.b_start) === normalizeTimeFormat(b.b_start) &&
    normalizeTimeFormat(a.hb2_start) === normalizeTimeFormat(b.hb2_start)
  );
}

/**
 * Helper to check if two arrays of break schedule data are equivalent
 * Uses isBreakScheduleEquivalent for element-wise comparison
 *
 * @param a - First array of break schedule data
 * @param b - Second array of break schedule data
 * @returns true if arrays are equivalent, false otherwise
 *
 * @example
 * ```typescript
 * const arr1 = [{ agent_name: 'John', hb1_start: '09:00', ... }];
 * const arr2 = [{ agent_name: 'John', hb1_start: '09:00:00', ... }];
 * areBreakScheduleArraysEquivalent(arr1, arr2) // true
 * ```
 */
export function areBreakScheduleArraysEquivalent(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((itemA, index) => {
    const itemB = b[index];
    return isBreakScheduleEquivalent(itemA, itemB);
  });
}

// Import vi from vitest for mock creation
import { vi } from 'vitest';
