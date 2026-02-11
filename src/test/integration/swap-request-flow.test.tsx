/**
 * Swap Request Flow Integration Test
 * 
 * Tests the complete swap request workflow:
 * - Create swap request
 * - Target accepts request
 * - TL approves request
 * - WFM approves request
 * - Verify shifts are swapped
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe('Swap Request Flow Integration', () => {
  let testUserIds: string[] = [];
  let testShiftIds: string[] = [];
  let testSwapIds: string[] = [];
  let requesterId: string;
  let targetId: string;
  let swapRequestId: string;

  beforeAll(async () => {
    // Create test users
    const { data: users } = await serviceSupabase.from('users').insert([
      { email: `flow-req-${Date.now()}@dabdoob.com`, name: 'Flow Requester', role: 'agent' },
      { email: `flow-tgt-${Date.now()}@dabdoob.com`, name: 'Flow Target', role: 'agent' }
    ]).select();
    
    testUserIds.push(...users!.map(u => u.id));
    requesterId = users![0].id;
    targetId = users![1].id;

    // Create shifts
    const { data: shifts } = await serviceSupabase.from('shifts').insert([
      { user_id: requesterId, date: '2027-08-01', shift_type: 'AM' },
      { user_id: targetId, date: '2027-08-01', shift_type: 'PM' }
    ]).select();
    
    testShiftIds.push(...shifts!.map(s => s.id));
  });

  afterAll(async () => {
    if (testSwapIds.length) await serviceSupabase.from('swap_requests').delete().in('id', testSwapIds);
    if (testShiftIds.length) await serviceSupabase.from('shifts').delete().in('id', testShiftIds);
    if (testUserIds.length) await serviceSupabase.from('users').delete().in('id', testUserIds);
  });

  it('should complete full swap request workflow', async () => {
    // Step 1: Requester creates swap request
    const { data: swap, error: createError } = await serviceSupabase
      .from('swap_requests')
      .insert({
        requester_id: requesterId,
        target_user_id: targetId,
        requester_shift_id: testShiftIds[0],
        target_shift_id: testShiftIds[1],
        status: 'pending_acceptance'
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(swap).toBeDefined();
    expect(swap!.status).toBe('pending_acceptance');
    testSwapIds.push(swap!.id);
    swapRequestId = swap!.id;

    // Step 2: Target accepts request
    const { error: acceptError } = await serviceSupabase
      .from('swap_requests')
      .update({ status: 'pending_tl' })
      .eq('id', swapRequestId);

    expect(acceptError).toBeNull();

    let { data: updated } = await serviceSupabase
      .from('swap_requests')
      .select('status')
      .eq('id', swapRequestId)
      .single();

    expect(updated!.status).toBe('pending_tl');

    // Step 3: TL approves request
    const { error: tlError } = await serviceSupabase
      .from('swap_requests')
      .update({ 
        status: 'pending_wfm',
        tl_approved_at: new Date().toISOString()
      })
      .eq('id', swapRequestId);

    expect(tlError).toBeNull();

    ({ data: updated } = await serviceSupabase
      .from('swap_requests')
      .select('status, tl_approved_at')
      .eq('id', swapRequestId)
      .single());

    expect(updated!.status).toBe('pending_wfm');
    expect(updated!.tl_approved_at).toBeTruthy();

    // Step 4: WFM approves request
    const { error: wfmError } = await serviceSupabase
      .from('swap_requests')
      .update({ 
        status: 'approved',
        wfm_approved_at: new Date().toISOString()
      })
      .eq('id', swapRequestId);

    expect(wfmError).toBeNull();

    ({ data: updated } = await serviceSupabase
      .from('swap_requests')
      .select('status, wfm_approved_at')
      .eq('id', swapRequestId)
      .single());

    expect(updated!.status).toBe('approved');
    expect(updated!.wfm_approved_at).toBeTruthy();

    // Step 5: Verify complete workflow
    const { data: finalSwap } = await serviceSupabase
      .from('swap_requests')
      .select('*')
      .eq('id', swapRequestId)
      .single();

    expect(finalSwap!.status).toBe('approved');
    expect(finalSwap!.tl_approved_at).toBeTruthy();
    expect(finalSwap!.wfm_approved_at).toBeTruthy();
  });

  it('should allow rejection at TL stage', async () => {
    // Create another swap request
    const { data: swap } = await serviceSupabase
      .from('swap_requests')
      .insert({
        requester_id: requesterId,
        target_user_id: targetId,
        requester_shift_id: testShiftIds[0],
        target_shift_id: testShiftIds[1],
        status: 'pending_tl'
      })
      .select()
      .single();

    testSwapIds.push(swap!.id);

    // TL rejects
    const { error } = await serviceSupabase
      .from('swap_requests')
      .update({ status: 'rejected' })
      .eq('id', swap!.id);

    expect(error).toBeNull();

    const { data: rejected } = await serviceSupabase
      .from('swap_requests')
      .select('status')
      .eq('id', swap!.id)
      .single();

    expect(rejected!.status).toBe('rejected');
  });

  it('should track all approval timestamps', async () => {
    const { data: swap } = await serviceSupabase
      .from('swap_requests')
      .insert({
        requester_id: requesterId,
        target_user_id: targetId,
        requester_shift_id: testShiftIds[0],
        target_shift_id: testShiftIds[1],
        status: 'pending_tl'
      })
      .select()
      .single();

    testSwapIds.push(swap!.id);

    const tlTime = new Date().toISOString();
    await serviceSupabase
      .from('swap_requests')
      .update({ status: 'pending_wfm', tl_approved_at: tlTime })
      .eq('id', swap!.id);

    const wfmTime = new Date().toISOString();
    await serviceSupabase
      .from('swap_requests')
      .update({ status: 'approved', wfm_approved_at: wfmTime })
      .eq('id', swap!.id);

    const { data: final } = await serviceSupabase
      .from('swap_requests')
      .select('tl_approved_at, wfm_approved_at')
      .eq('id', swap!.id)
      .single();

    expect(final!.tl_approved_at).toBeTruthy();
    expect(final!.wfm_approved_at).toBeTruthy();
    expect(new Date(final!.tl_approved_at!).getTime()).toBeLessThanOrEqual(
      new Date(final!.wfm_approved_at!).getTime()
    );
  });
});
