/**
 * Integration Test Helpers
 *
 * Provides utilities for integration testing with Supabase local instance:
 * - Test database client configuration
 * - Test data seeding and cleanup
 * - Database state verification
 *
 * OPTIMIZATION NOTES:
 * - Reuses single client instance per test suite
 * - Provides minimal data seeding (only what's needed)
 * - Efficient bulk cleanup operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test database configuration
const SUPABASE_TEST_URL = process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
const SUPABASE_TEST_ANON_KEY =
  process.env.VITE_SUPABASE_TEST_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Shared client instance - reuse across tests in same suite
let sharedClient: SupabaseClient | null = null;

/**
 * Create a test Supabase client (reuses instance for performance)
 */
export function createTestClient(): SupabaseClient {
  if (!sharedClient) {
    sharedClient = createClient(SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return sharedClient;
}

/**
 * Reset the shared client (call in afterAll if needed)
 */
export function resetTestClient(): void {
  sharedClient = null;
}

// Cached test users - reuse across tests to minimize DB operations
let cachedTestUsers: any[] | null = null;

/**
 * Seed test users (cached for performance)
 * Only creates users once per test suite, reuses on subsequent calls
 */
export async function seedTestUsers(client: SupabaseClient, forceRefresh = false) {
  if (cachedTestUsers && !forceRefresh) {
    return cachedTestUsers;
  }

  const testUsers = [
    { email: 'wfm@dabdoob.com', name: 'WFM User', role: 'wfm', department: 'Operations' },
    { email: 'tl@dabdoob.com', name: 'TL User', role: 'tl', department: 'Support' },
    { email: 'agent@dabdoob.com', name: 'Agent User', role: 'agent', department: 'Support' },
  ];

  const { data, error } = await client.from('users').insert(testUsers).select();

  if (error) throw error;
  cachedTestUsers = data;
  return data;
}

/**
 * Clear cached test users (call in afterAll)
 */
export function clearUserCache(): void {
  cachedTestUsers = null;
}

/**
 * Seed test shifts for a user
 */
export async function seedTestShifts(
  client: SupabaseClient,
  userId: string,
  startDate: Date,
  days: number
) {
  const shifts = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    shifts.push({
      user_id: userId,
      date: date.toISOString().split('T')[0],
      shift_type: 'AM',
    });
  }

  const { data, error } = await client.from('shifts').insert(shifts).select();

  if (error) throw error;
  return data;
}

/**
 * Seed test leave balances for a user
 */
export async function seedTestLeaveBalances(client: SupabaseClient, userId: string) {
  const balances = [
    { user_id: userId, leave_type: 'annual', balance: 15 },
    { user_id: userId, leave_type: 'casual', balance: 5 },
    { user_id: userId, leave_type: 'sick', balance: 10 },
  ];

  const { data, error } = await client.from('leave_balances').insert(balances).select();

  if (error) throw error;
  return data;
}

/**
 * Clean up all test data (optimized for bulk operations)
 * Deletes in reverse order of dependencies for efficiency
 */
export async function cleanupTestData(client: SupabaseClient) {
  // Use Promise.all for parallel cleanup where possible
  const cleanupOperations = [
    client.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    client.from('break_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ];

  await Promise.all(cleanupOperations);

  // Sequential cleanup for dependent tables
  await client.from('swap_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('leave_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('leave_balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Clear caches after cleanup
  clearUserCache();
}

/**
 * Verify database state for a table
 */
export async function verifyTableState(
  client: SupabaseClient,
  table: string,
  expectedCount: number
) {
  const { data, error } = await client.from(table).select('*');

  if (error) throw error;
  return data?.length === expectedCount;
}
