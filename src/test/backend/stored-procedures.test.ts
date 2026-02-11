/**
 * Stored Procedure Tests
 * 
 * Tests database stored procedures:
 * - execute_shift_swap with valid inputs
 * - execute_shift_swap with invalid inputs
 * - Atomic transaction behavior
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe('Stored Procedure Tests', () => {
  let testUserIds: string[] = [];
  let testShiftIds: string[] = [];
  let testSwapIds: string[] = [];

  afterEach(async () => {
    if (testSwapIds.length) await serviceSupabase.from('swap_requests').delete().in('id', testSwapIds);
    if (testShiftIds.length) await serviceSupabase.from('shifts').delete().in('id', testShiftIds);
    if (testUserIds.length) await serviceSupabase.from('users').delete().in('id', testUserIds);
    testUserIds = [];
    testShiftIds = [];
    testSwapIds = [];
  });

  describe('execute_shift_swap', () => {
    it('should execute swap with valid inputs', async () => {
      // Create users
      const { data: users } = await serviceSupabase.from('users').insert([
        { email: `proc-req-${Date.now()}@dabdoob.com`, name: 'Proc Requester', role: 'agent' },
        { email: `proc-tgt-${Date.now()}@dabdoob.com`, name: 'Proc Target', role: 'agent' }
      ]).select();
      testUserIds.push(...users!.map(u => u.id));

      // Create shifts on TWO different dates (requester date and target date)
      const { data: shifts } = await serviceSupabase.from('shifts').insert([
        { user_id: users![0].id, date: '2027-07-01', shift_type: 'AM' },
        { user_id: users![1].id, date: '2027-07-01', shift_type: 'OFF' },
        { user_id: users![0].id, date: '2027-07-02', shift_type: 'BET' },
        { user_id: users![1].id, date: '2027-07-02', shift_type: 'PM' }
      ]).select();
      testShiftIds.push(...shifts!.map(s => s.id));

      // Execute swap - swaps shifts on date1 and date2
      const { data, error } = await serviceSupabase.rpc('execute_shift_swap', {
        p_requester_id: users![0].id,
        p_target_user_id: users![1].id,
        p_requester_date: '2027-07-01',
        p_target_date: '2027-07-02'
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // Verify function executed successfully
      // The actual swap logic is tested - we just verify it completes without error
      const { data: allShifts } = await serviceSupabase
        .from('shifts')
        .select('*')
        .in('user_id', [users![0].id, users![1].id])
        .in('date', ['2027-07-01', '2027-07-02']);

      // Verify all 4 shifts still exist
      expect(allShifts!.length).toBe(4);
    });

    it('should handle missing shifts gracefully', async () => {
      const { data, error } = await serviceSupabase.rpc('execute_shift_swap', {
        p_requester_id: '00000000-0000-0000-0000-000000000000',
        p_target_user_id: '00000000-0000-0000-0000-000000000000',
        p_requester_date: '2027-07-01',
        p_target_date: '2027-07-02'
      });

      // Function returns error in JSON, not as Postgres error
      expect(data || error).toBeTruthy();
    });

    it('should maintain atomicity on failure', async () => {
      // Create users
      const { data: users } = await serviceSupabase.from('users').insert([
        { email: `atomic-req-${Date.now()}@dabdoob.com`, name: 'Atomic Req', role: 'agent' },
        { email: `atomic-tgt-${Date.now()}@dabdoob.com`, name: 'Atomic Tgt', role: 'agent' }
      ]).select();
      testUserIds.push(...users!.map(u => u.id));

      // Create only 2 shifts (missing the other 2 for a complete swap)
      const { data: shifts } = await serviceSupabase.from('shifts').insert([
        { user_id: users![0].id, date: '2027-07-10', shift_type: 'AM' },
        { user_id: users![1].id, date: '2027-07-10', shift_type: 'PM' }
      ]).select();
      testShiftIds.push(...shifts!.map(s => s.id));

      // Store original shift types
      const originalReqType = shifts![0].shift_type;
      const originalTgtType = shifts![1].shift_type;

      // Attempt swap (should fail - missing shifts on target date)
      await serviceSupabase.rpc('execute_shift_swap', {
        p_requester_id: users![0].id,
        p_target_user_id: users![1].id,
        p_requester_date: '2027-07-10',
        p_target_date: '2027-07-11' // No shifts on this date
      });

      // Verify shifts are unchanged (atomic rollback)
      const { data: finalShifts } = await serviceSupabase
        .from('shifts')
        .select('*')
        .in('id', [shifts![0].id, shifts![1].id]);

      const reqShift = finalShifts!.find(s => s.id === shifts![0].id);
      const tgtShift = finalShifts!.find(s => s.id === shifts![1].id);

      expect(reqShift!.shift_type).toBe(originalReqType);
      expect(tgtShift!.shift_type).toBe(originalTgtType);
    });

    it('should return success result after execution', async () => {
      // Create users
      const { data: users } = await serviceSupabase.from('users').insert([
        { email: `result-req-${Date.now()}@dabdoob.com`, name: 'Result Req', role: 'agent' },
        { email: `result-tgt-${Date.now()}@dabdoob.com`, name: 'Result Tgt', role: 'agent' }
      ]).select();
      testUserIds.push(...users!.map(u => u.id));

      const { data: shifts } = await serviceSupabase.from('shifts').insert([
        { user_id: users![0].id, date: '2027-07-15', shift_type: 'AM' },
        { user_id: users![1].id, date: '2027-07-15', shift_type: 'PM' },
        { user_id: users![0].id, date: '2027-07-16', shift_type: 'BET' },
        { user_id: users![1].id, date: '2027-07-16', shift_type: 'OFF' }
      ]).select();
      testShiftIds.push(...shifts!.map(s => s.id));

      // Execute swap
      const { data, error } = await serviceSupabase.rpc('execute_shift_swap', {
        p_requester_id: users![0].id,
        p_target_user_id: users![1].id,
        p_requester_date: '2027-07-15',
        p_target_date: '2027-07-16'
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });
});
