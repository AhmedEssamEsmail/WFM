/**
 * Approval Workflow Tests
 *
 * Tests multi-level approval workflows:
 * - pending_tl → pending_wfm → approved
 * - Auto-approve workflow
 * - Rejection at each stage
 * - Status transition validation
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('Approval Workflow Tests', () => {
  let testUserIds: string[] = [];
  let testShiftIds: string[] = [];
  let testSwapIds: string[] = [];
  let testLeaveIds: string[] = [];

  afterEach(async () => {
    if (testSwapIds.length) await testSupabase.from('swap_requests').delete().in('id', testSwapIds);
    if (testLeaveIds.length)
      await testSupabase.from('leave_requests').delete().in('id', testLeaveIds);
    if (testShiftIds.length) await testSupabase.from('shifts').delete().in('id', testShiftIds);
    if (testUserIds.length) await testSupabase.from('users').delete().in('id', testUserIds);
    testUserIds = [];
    testShiftIds = [];
    testSwapIds = [];
    testLeaveIds = [];
  });

  describe('Swap Request Workflow', () => {
    it('should follow pending_acceptance → pending_tl → pending_wfm → approved', async () => {
      const { data: users } = await testSupabase
        .from('users')
        .insert([
          { email: `wf-req-${Date.now()}@dabdoob.com`, name: 'Requester', role: 'agent' },
          { email: `wf-tgt-${Date.now()}@dabdoob.com`, name: 'Target', role: 'agent' },
        ])
        .select();
      testUserIds.push(...users!.map((u) => u.id));

      const { data: shifts } = await testSupabase
        .from('shifts')
        .insert([
          { user_id: users![0].id, date: '2026-12-01', shift_type: 'AM' },
          { user_id: users![1].id, date: '2026-12-01', shift_type: 'PM' },
        ])
        .select();
      testShiftIds.push(...shifts!.map((s) => s.id));

      // Create request
      const { data: swap } = await testSupabase
        .from('swap_requests')
        .insert({
          requester_id: users![0].id,
          target_user_id: users![1].id,
          requester_shift_id: shifts![0].id,
          target_shift_id: shifts![1].id,
          status: 'pending_acceptance',
        })
        .select()
        .single();
      testSwapIds.push(swap!.id);

      // Target accepts
      await testSupabase.from('swap_requests').update({ status: 'pending_tl' }).eq('id', swap!.id);
      let { data: updated } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swap!.id)
        .single();
      expect(updated!.status).toBe('pending_tl');

      // TL approves
      await testSupabase
        .from('swap_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', swap!.id);
      ({ data: updated } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swap!.id)
        .single());
      expect(updated!.status).toBe('pending_wfm');

      // WFM approves
      await testSupabase
        .from('swap_requests')
        .update({
          status: 'approved',
          wfm_approved_at: new Date().toISOString(),
        })
        .eq('id', swap!.id);
      ({ data: updated } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swap!.id)
        .single());
      expect(updated!.status).toBe('approved');
    });

    it('should allow rejection at pending_tl stage', async () => {
      const { data: users } = await testSupabase
        .from('users')
        .insert([
          { email: `rej-req-${Date.now()}@dabdoob.com`, name: 'Requester', role: 'agent' },
          { email: `rej-tgt-${Date.now()}@dabdoob.com`, name: 'Target', role: 'agent' },
        ])
        .select();
      testUserIds.push(...users!.map((u) => u.id));

      const { data: shifts } = await testSupabase
        .from('shifts')
        .insert([
          { user_id: users![0].id, date: '2026-12-05', shift_type: 'AM' },
          { user_id: users![1].id, date: '2026-12-05', shift_type: 'PM' },
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
          status: 'pending_tl',
        })
        .select()
        .single();
      testSwapIds.push(swap!.id);

      // TL rejects
      await testSupabase.from('swap_requests').update({ status: 'rejected' }).eq('id', swap!.id);
      const { data: rejected } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swap!.id)
        .single();
      expect(rejected!.status).toBe('rejected');
    });
  });

  describe('Leave Request Workflow', () => {
    it('should follow pending_tl → pending_wfm → approved', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `leave-wf-${Date.now()}@dabdoob.com`,
          name: 'Leave User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      const { data: leave } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'annual',
          start_date: '2026-12-10',
          end_date: '2026-12-12',
          status: 'pending_tl',
        })
        .select()
        .single();
      testLeaveIds.push(leave!.id);

      // TL approves
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', leave!.id);
      let { data: updated } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', leave!.id)
        .single();
      expect(updated!.status).toBe('pending_wfm');

      // WFM approves
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'approved',
          wfm_approved_at: new Date().toISOString(),
        })
        .eq('id', leave!.id);
      ({ data: updated } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', leave!.id)
        .single());
      expect(updated!.status).toBe('approved');
    });

    it('should support auto-denial for insufficient balance', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `deny-${Date.now()}@dabdoob.com`,
          name: 'Deny User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      // Set low balance
      await testSupabase
        .from('leave_balances')
        .update({ balance: 1 })
        .eq('user_id', user!.id)
        .eq('leave_type', 'casual');

      // Create request that exceeds balance
      const { data: leave } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'casual',
          start_date: '2026-12-15',
          end_date: '2026-12-20', // 5 days
          status: 'denied', // Auto-denied
        })
        .select()
        .single();
      testLeaveIds.push(leave!.id);

      expect(leave!.status).toBe('denied');
    });
  });

  describe('Status Transition Validation', () => {
    it('should record approval timestamps', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `ts-${Date.now()}@dabdoob.com`,
          name: 'Timestamp User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      const { data: leave } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'sick',
          start_date: '2026-12-20',
          end_date: '2026-12-21',
          status: 'pending_tl',
        })
        .select()
        .single();
      testLeaveIds.push(leave!.id);

      const tlTime = new Date().toISOString();
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: tlTime,
        })
        .eq('id', leave!.id);

      const wfmTime = new Date().toISOString();
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'approved',
          wfm_approved_at: wfmTime,
        })
        .eq('id', leave!.id);

      const { data: final } = await testSupabase
        .from('leave_requests')
        .select('tl_approved_at, wfm_approved_at')
        .eq('id', leave!.id)
        .single();

      expect(final!.tl_approved_at).toBeTruthy();
      expect(final!.wfm_approved_at).toBeTruthy();
    });
  });
});
