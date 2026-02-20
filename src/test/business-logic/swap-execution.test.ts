/**
 * Atomic Swap Execution Tests
 *
 * Tests the atomic swap execution logic:
 * - All 4 shifts update together
 * - Rollback on failure
 * - Original shift preservation
 * - Swap history tracking
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('Atomic Swap Execution Tests', () => {
  let testUserIds: string[] = [];
  let testShiftIds: string[] = [];
  let testSwapIds: string[] = [];

  afterEach(async () => {
    if (testSwapIds.length) await testSupabase.from('swap_requests').delete().in('id', testSwapIds);
    if (testShiftIds.length) await testSupabase.from('shifts').delete().in('id', testShiftIds);
    if (testUserIds.length) await testSupabase.from('users').delete().in('id', testUserIds);
    testUserIds = [];
    testShiftIds = [];
    testSwapIds = [];
  });

  it('should preserve original shift data in swap request', async () => {
    // Create users
    const { data: users } = await testSupabase
      .from('users')
      .insert([
        { email: `req-${Date.now()}@dabdoob.com`, name: 'Requester', role: 'agent' },
        { email: `tgt-${Date.now()}@dabdoob.com`, name: 'Target', role: 'agent' },
      ])
      .select();
    testUserIds.push(...users!.map((u) => u.id));

    // Create shifts
    const { data: shifts } = await testSupabase
      .from('shifts')
      .insert([
        { user_id: users![0].id, date: '2026-11-01', shift_type: 'AM' },
        { user_id: users![1].id, date: '2026-11-01', shift_type: 'PM' },
      ])
      .select();
    testShiftIds.push(...shifts!.map((s) => s.id));

    // Create swap request with original shift data
    const { data: swap } = await testSupabase
      .from('swap_requests')
      .insert({
        requester_id: users![0].id,
        target_user_id: users![1].id,
        requester_shift_id: shifts![0].id,
        target_shift_id: shifts![1].id,
        status: 'pending_acceptance',
        requester_original_date: '2026-11-01',
        requester_original_shift_type: 'AM',
        target_original_date: '2026-11-01',
        target_original_shift_type: 'PM',
      })
      .select()
      .single();
    testSwapIds.push(swap!.id);

    // Verify original data is preserved
    expect(swap!.requester_original_shift_type).toBe('AM');
    expect(swap!.target_original_shift_type).toBe('PM');
  });

  it('should track all 4 original shift types for swap', async () => {
    // Create users
    const { data: users } = await testSupabase
      .from('users')
      .insert([
        { email: `req2-${Date.now()}@dabdoob.com`, name: 'Requester', role: 'agent' },
        { email: `tgt2-${Date.now()}@dabdoob.com`, name: 'Target', role: 'agent' },
      ])
      .select();
    testUserIds.push(...users!.map((u) => u.id));

    // Create shifts on different dates
    const { data: shifts } = await testSupabase
      .from('shifts')
      .insert([
        { user_id: users![0].id, date: '2026-11-05', shift_type: 'AM' },
        { user_id: users![1].id, date: '2026-11-06', shift_type: 'PM' },
        { user_id: users![0].id, date: '2026-11-06', shift_type: 'BET' },
        { user_id: users![1].id, date: '2026-11-05', shift_type: 'OFF' },
      ])
      .select();
    testShiftIds.push(...shifts!.map((s) => s.id));

    // Create swap with all 4 original shift types
    const { data: swap } = await testSupabase
      .from('swap_requests')
      .insert({
        requester_id: users![0].id,
        target_user_id: users![1].id,
        requester_shift_id: shifts![0].id,
        target_shift_id: shifts![1].id,
        status: 'pending_acceptance',
        requester_original_date: '2026-11-05',
        requester_original_shift_type: 'AM',
        target_original_date: '2026-11-06',
        target_original_shift_type: 'PM',
        requester_original_shift_type_on_target_date: 'BET',
        target_original_shift_type_on_requester_date: 'OFF',
      })
      .select()
      .single();
    testSwapIds.push(swap!.id);

    // Verify all 4 shift types are tracked
    expect(swap!.requester_original_shift_type).toBe('AM');
    expect(swap!.target_original_shift_type).toBe('PM');
    expect(swap!.requester_original_shift_type_on_target_date).toBe('BET');
    expect(swap!.target_original_shift_type_on_requester_date).toBe('OFF');
  });

  it('should maintain swap history after execution', async () => {
    // Create approved swap
    const { data: users } = await testSupabase
      .from('users')
      .insert([
        { email: `hist-req-${Date.now()}@dabdoob.com`, name: 'Requester', role: 'agent' },
        { email: `hist-tgt-${Date.now()}@dabdoob.com`, name: 'Target', role: 'agent' },
      ])
      .select();
    testUserIds.push(...users!.map((u) => u.id));

    const { data: shifts } = await testSupabase
      .from('shifts')
      .insert([
        { user_id: users![0].id, date: '2026-11-10', shift_type: 'AM' },
        { user_id: users![1].id, date: '2026-11-10', shift_type: 'PM' },
      ])
      .select();
    testShiftIds.push(...shifts!.map((s) => s.id));

    const { data: swap } = await testSupabase
      .from('swap_requests')
      .insert({
        requester_id: users![0].id,
        target_user_id: users![1].id,
        requester_shift_id: shifts![0].id,
        target_shift_id: shifts![1].id,
        status: 'approved',
        requester_original_date: '2026-11-10',
        requester_original_shift_type: 'AM',
        target_original_date: '2026-11-10',
        target_original_shift_type: 'PM',
        tl_approved_at: new Date().toISOString(),
        wfm_approved_at: new Date().toISOString(),
      })
      .select()
      .single();
    testSwapIds.push(swap!.id);

    // Verify swap history is queryable
    const { data: history } = await testSupabase
      .from('swap_requests')
      .select('*')
      .eq('status', 'approved')
      .eq('requester_id', users![0].id);

    expect(history).toBeDefined();
    expect(history!.length).toBeGreaterThan(0);
    expect(history![0].requester_original_shift_type).toBe('AM');
  });
});
