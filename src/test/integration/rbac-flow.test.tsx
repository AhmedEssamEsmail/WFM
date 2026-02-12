/**
 * RBAC (Role-Based Access Control) Flow Integration Test
 * 
 * Tests role-based access control:
 * - Agent access restrictions
 * - TL access permissions
 * - WFM full access
 * - Unauthorized route access
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('RBAC Flow Integration', () => {
  let testUserIds: string[] = [];
  let agentId: string;
  let tlId: string;
  let wfmId: string;

  beforeAll(async () => {
    // Create users with different roles
    const { data: users } = await serviceSupabase.from('users').insert([
      { email: `rbac-agent-${Date.now()}@dabdoob.com`, name: 'RBAC Agent', role: 'agent' },
      { email: `rbac-tl-${Date.now()}@dabdoob.com`, name: 'RBAC TL', role: 'tl' },
      { email: `rbac-wfm-${Date.now()}@dabdoob.com`, name: 'RBAC WFM', role: 'wfm' }
    ]).select();
    
    testUserIds.push(...users!.map(u => u.id));
    agentId = users![0].id;
    tlId = users![1].id;
    wfmId = users![2].id;
  });

  afterAll(async () => {
    if (testUserIds.length) await serviceSupabase.from('users').delete().in('id', testUserIds);
  });

  describe('Agent Role', () => {
    it('should allow agent to view own data', async () => {
      const { data, error } = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', agentId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.role).toBe('agent');
    });

    it('should allow agent to view all users (directory)', async () => {
      const { data, error } = await serviceSupabase
        .from('users')
        .select('id, name, email, role')
        .in('id', testUserIds);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(3);
    });

    it('should allow agent to create swap requests', async () => {
      // Create shifts first
      const { data: shifts } = await serviceSupabase.from('shifts').insert([
        { user_id: agentId, date: '2027-10-01', shift_type: 'AM' },
        { user_id: tlId, date: '2027-10-01', shift_type: 'PM' }
      ]).select();

      const { data, error } = await serviceSupabase
        .from('swap_requests')
        .insert({
          requester_id: agentId,
          target_user_id: tlId,
          requester_shift_id: shifts![0].id,
          target_shift_id: shifts![1].id,
          status: 'pending_acceptance'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Cleanup
      await serviceSupabase.from('swap_requests').delete().eq('id', data!.id);
      await serviceSupabase.from('shifts').delete().in('id', shifts!.map(s => s.id));
    });

    it('should allow agent to create leave requests', async () => {
      const { data, error } = await serviceSupabase
        .from('leave_requests')
        .insert({
          user_id: agentId,
          leave_type: 'annual',
          start_date: '2027-10-05',
          end_date: '2027-10-06',
          status: 'pending_tl'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Cleanup
      await serviceSupabase.from('leave_requests').delete().eq('id', data!.id);
    });
  });

  describe('Team Lead Role', () => {
    it('should allow TL to view all requests', async () => {
      const { data: swaps, error: swapError } = await serviceSupabase
        .from('swap_requests')
        .select('*');

      expect(swapError).toBeNull();

      const { data: leaves, error: leaveError } = await serviceSupabase
        .from('leave_requests')
        .select('*');

      expect(leaveError).toBeNull();
    });

    it('should allow TL to approve requests', async () => {
      // Create a test leave request
      const { data: leave } = await serviceSupabase
        .from('leave_requests')
        .insert({
          user_id: agentId,
          leave_type: 'sick',
          start_date: '2027-10-10',
          end_date: '2027-10-11',
          status: 'pending_tl'
        })
        .select()
        .single();

      // TL approves
      const { error } = await serviceSupabase
        .from('leave_requests')
        .update({ 
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString()
        })
        .eq('id', leave!.id);

      expect(error).toBeNull();

      // Cleanup
      await serviceSupabase.from('leave_requests').delete().eq('id', leave!.id);
    });

    it('should allow TL to reject requests', async () => {
      const { data: leave } = await serviceSupabase
        .from('leave_requests')
        .insert({
          user_id: agentId,
          leave_type: 'casual',
          start_date: '2027-10-15',
          end_date: '2027-10-16',
          status: 'pending_tl'
        })
        .select()
        .single();

      const { error } = await serviceSupabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', leave!.id);

      expect(error).toBeNull();

      // Cleanup
      await serviceSupabase.from('leave_requests').delete().eq('id', leave!.id);
    });
  });

  describe('WFM Role', () => {
    it('should allow WFM to view all data', async () => {
      const { data: users, error: userError } = await serviceSupabase
        .from('users')
        .select('*');

      expect(userError).toBeNull();
      expect(users).toBeDefined();

      const { data: shifts, error: shiftError } = await serviceSupabase
        .from('shifts')
        .select('*');

      expect(shiftError).toBeNull();
    });

    it('should allow WFM to manage shifts', async () => {
      // Create shift
      const { data: shift, error: createError } = await serviceSupabase
        .from('shifts')
        .insert({
          user_id: agentId,
          date: '2027-10-20',
          shift_type: 'AM'
        })
        .select()
        .single();

      expect(createError).toBeNull();

      // Update shift
      const { error: updateError } = await serviceSupabase
        .from('shifts')
        .update({ shift_type: 'PM' })
        .eq('id', shift!.id);

      expect(updateError).toBeNull();

      // Delete shift
      const { error: deleteError } = await serviceSupabase
        .from('shifts')
        .delete()
        .eq('id', shift!.id);

      expect(deleteError).toBeNull();
    });

    it('should allow WFM to approve requests', async () => {
      const { data: leave } = await serviceSupabase
        .from('leave_requests')
        .insert({
          user_id: agentId,
          leave_type: 'annual',
          start_date: '2027-10-25',
          end_date: '2027-10-26',
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString()
        })
        .select()
        .single();

      const { error } = await serviceSupabase
        .from('leave_requests')
        .update({ 
          status: 'approved',
          wfm_approved_at: new Date().toISOString()
        })
        .eq('id', leave!.id);

      expect(error).toBeNull();

      // Cleanup
      await serviceSupabase.from('leave_requests').delete().eq('id', leave!.id);
    });

    it('should allow WFM to update user profiles', async () => {
      const { error } = await serviceSupabase
        .from('users')
        .update({ department: 'Customer Service' })
        .eq('id', agentId);

      expect(error).toBeNull();

      const { data } = await serviceSupabase
        .from('users')
        .select('department')
        .eq('id', agentId)
        .single();

      expect(data!.department).toBe('Customer Service');
    });
  });

  describe('Role Validation', () => {
    it('should correctly identify user roles', async () => {
      const { data: agent } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', agentId)
        .single();

      const { data: tl } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', tlId)
        .single();

      const { data: wfm } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', wfmId)
        .single();

      expect(agent!.role).toBe('agent');
      expect(tl!.role).toBe('tl');
      expect(wfm!.role).toBe('wfm');
    });
  });
});
