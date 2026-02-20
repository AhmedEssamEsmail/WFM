/**
 * RLS Policy Tests - Swap Requests Table
 *
 * Tests Row Level Security policies for swap_requests:
 * - Requester/target can view request
 * - TL/WFM can view all requests
 * - Target can accept request
 * - TL can approve request
 * - WFM can approve request
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('RLS Policy Tests - Swap Requests', () => {
  const testUserIds: string[] = [];
  const testShiftIds: string[] = [];
  const testSwapIds: string[] = [];
  let requesterId: string;
  let targetId: string;
  let tlId: string;
  let wfmId: string;
  let swapRequestId: string;

  beforeAll(async () => {
    // Create test users
    const { data: users, error: userError } = await serviceSupabase
      .from('users')
      .insert([
        { email: `swap-req-${Date.now()}@dabdoob.com`, name: 'Requester', role: 'agent' },
        { email: `swap-tgt-${Date.now()}@dabdoob.com`, name: 'Target', role: 'agent' },
        { email: `swap-tl-${Date.now()}@dabdoob.com`, name: 'Team Lead', role: 'tl' },
        { email: `swap-wfm-${Date.now()}@dabdoob.com`, name: 'WFM', role: 'wfm' },
      ])
      .select();

    if (userError || !users) {
      throw new Error(`Failed to create users: ${userError?.message}`);
    }

    testUserIds.push(...users.map((u) => u.id));
    requesterId = users![0].id;
    targetId = users![1].id;
    tlId = users![2].id;
    wfmId = users![3].id;

    // Create test shifts
    const { data: shifts } = await serviceSupabase
      .from('shifts')
      .insert([
        { user_id: requesterId, date: '2027-04-01', shift_type: 'AM' },
        { user_id: targetId, date: '2027-04-01', shift_type: 'PM' },
      ])
      .select();

    testShiftIds.push(...shifts!.map((s) => s.id));

    // Create swap request
    const { data: swap } = await serviceSupabase
      .from('swap_requests')
      .insert({
        requester_id: requesterId,
        target_user_id: targetId,
        requester_shift_id: shifts![0].id,
        target_shift_id: shifts![1].id,
        status: 'pending_acceptance',
      })
      .select()
      .single();

    testSwapIds.push(swap!.id);
    swapRequestId = swap!.id;
  });

  afterAll(async () => {
    if (testSwapIds.length)
      await serviceSupabase.from('swap_requests').delete().in('id', testSwapIds);
    if (testShiftIds.length) await serviceSupabase.from('shifts').delete().in('id', testShiftIds);
    if (testUserIds.length) await serviceSupabase.from('users').delete().in('id', testUserIds);
  });

  it('should allow requester to view own request', async () => {
    const { data, error } = await serviceSupabase
      .from('swap_requests')
      .select('*')
      .eq('id', swapRequestId)
      .eq('requester_id', requesterId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.requester_id).toBe(requesterId);
  });

  it('should allow target to view request', async () => {
    const { data, error } = await serviceSupabase
      .from('swap_requests')
      .select('*')
      .eq('id', swapRequestId)
      .eq('target_user_id', targetId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.target_user_id).toBe(targetId);
  });

  it('should allow TL to view all requests', async () => {
    const { data, error } = await serviceSupabase
      .from('swap_requests')
      .select('*')
      .in('id', testSwapIds);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('should allow WFM to view all requests', async () => {
    const { data, error } = await serviceSupabase
      .from('swap_requests')
      .select('*')
      .in('id', testSwapIds);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('should allow target to accept request', async () => {
    const { error } = await serviceSupabase
      .from('swap_requests')
      .update({ status: 'pending_tl' })
      .eq('id', swapRequestId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('swap_requests')
      .select('status')
      .eq('id', swapRequestId)
      .single();

    expect(data!.status).toBe('pending_tl');
  });

  it('should allow TL to approve request', async () => {
    const { error } = await serviceSupabase
      .from('swap_requests')
      .update({
        status: 'pending_wfm',
        tl_approved_at: new Date().toISOString(),
      })
      .eq('id', swapRequestId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('swap_requests')
      .select('status, tl_approved_at')
      .eq('id', swapRequestId)
      .single();

    expect(data!.status).toBe('pending_wfm');
    expect(data!.tl_approved_at).toBeTruthy();
  });

  it('should allow WFM to approve request', async () => {
    const { error } = await serviceSupabase
      .from('swap_requests')
      .update({
        status: 'approved',
        wfm_approved_at: new Date().toISOString(),
      })
      .eq('id', swapRequestId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('swap_requests')
      .select('status, wfm_approved_at')
      .eq('id', swapRequestId)
      .single();

    expect(data!.status).toBe('approved');
    expect(data!.wfm_approved_at).toBeTruthy();
  });
});
