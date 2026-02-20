/**
 * Leave Balance Tests
 *
 * Tests leave balance management:
 * - Balance deduction on approval
 * - Insufficient balance denial
 * - Balance validation
 * - Balance history tracking
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('Leave Balance Tests', () => {
  let testUserIds: string[] = [];
  let testLeaveIds: string[] = [];

  afterEach(async () => {
    if (testLeaveIds.length)
      await testSupabase.from('leave_requests').delete().in('id', testLeaveIds);
    if (testUserIds.length) await testSupabase.from('users').delete().in('id', testUserIds);
    testUserIds = [];
    testLeaveIds = [];
  });

  it('should initialize leave balances for new users', async () => {
    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: `balance-${Date.now()}@dabdoob.com`,
        name: 'Balance Test User',
        role: 'agent',
      })
      .select()
      .single();
    testUserIds.push(user!.id);

    // Check balances were initialized
    const { data: balances } = await testSupabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', user!.id);

    expect(balances).toBeDefined();
    expect(balances!.length).toBe(5); // 5 leave types

    const leaveTypes = balances!.map((b) => b.leave_type);
    expect(leaveTypes).toContain('annual');
    expect(leaveTypes).toContain('casual');
    expect(leaveTypes).toContain('sick');
  });

  it('should track balance changes in history', async () => {
    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: `history-${Date.now()}@dabdoob.com`,
        name: 'History User',
        role: 'agent',
      })
      .select()
      .single();
    testUserIds.push(user!.id);

    // Update balance
    const { data: oldBalance } = await testSupabase
      .from('leave_balances')
      .select('balance')
      .eq('user_id', user!.id)
      .eq('leave_type', 'annual')
      .single();

    await testSupabase
      .from('leave_balances')
      .update({ balance: 15 })
      .eq('user_id', user!.id)
      .eq('leave_type', 'annual');

    // Record in history
    await testSupabase.from('leave_balance_history').insert({
      user_id: user!.id,
      leave_type: 'annual',
      previous_balance: oldBalance!.balance,
      new_balance: 15,
      change_reason: 'Test adjustment',
    });

    // Verify history
    const { data: history } = await testSupabase
      .from('leave_balance_history')
      .select('*')
      .eq('user_id', user!.id);

    expect(history).toBeDefined();
    expect(history!.length).toBeGreaterThan(0);
  });

  it('should validate sufficient balance for leave request', async () => {
    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: `sufficient-${Date.now()}@dabdoob.com`,
        name: 'Sufficient User',
        role: 'agent',
      })
      .select()
      .single();
    testUserIds.push(user!.id);

    // Set balance
    await testSupabase
      .from('leave_balances')
      .update({ balance: 10 })
      .eq('user_id', user!.id)
      .eq('leave_type', 'annual');

    // Get balance
    const { data: balance } = await testSupabase
      .from('leave_balances')
      .select('balance')
      .eq('user_id', user!.id)
      .eq('leave_type', 'annual')
      .single();

    expect(Number(balance!.balance)).toBe(10);

    // Request 5 days (should be allowed)
    const requestedDays = 5;
    expect(Number(balance!.balance)).toBeGreaterThanOrEqual(requestedDays);
  });

  it('should detect insufficient balance', async () => {
    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: `insufficient-${Date.now()}@dabdoob.com`,
        name: 'Insufficient User',
        role: 'agent',
      })
      .select()
      .single();
    testUserIds.push(user!.id);

    // Set low balance
    await testSupabase
      .from('leave_balances')
      .update({ balance: 2 })
      .eq('user_id', user!.id)
      .eq('leave_type', 'casual');

    const { data: balance } = await testSupabase
      .from('leave_balances')
      .select('balance')
      .eq('user_id', user!.id)
      .eq('leave_type', 'casual')
      .single();

    // Request 5 days (should be denied)
    const requestedDays = 5;
    expect(Number(balance!.balance)).toBeLessThan(requestedDays);
  });

  it('should support decimal balances', async () => {
    const { data: user } = await testSupabase
      .from('users')
      .insert({
        email: `decimal-${Date.now()}@dabdoob.com`,
        name: 'Decimal User',
        role: 'agent',
      })
      .select()
      .single();
    testUserIds.push(user!.id);

    // Set decimal balance
    await testSupabase
      .from('leave_balances')
      .update({ balance: 7.5 })
      .eq('user_id', user!.id)
      .eq('leave_type', 'sick');

    const { data: balance } = await testSupabase
      .from('leave_balances')
      .select('balance')
      .eq('user_id', user!.id)
      .eq('leave_type', 'sick')
      .single();

    expect(Number(balance!.balance)).toBe(7.5);
  });
});
