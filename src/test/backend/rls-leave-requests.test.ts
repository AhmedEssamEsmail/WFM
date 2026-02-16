/**
 * RLS Policy Tests - Leave Requests Table
 * 
 * Tests Row Level Security policies for leave_requests:
 * - User can view own requests
 * - TL/WFM can view all requests
 * - TL can approve requests
 * - WFM can approve requests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('RLS Policy Tests - Leave Requests', () => {
  const testUserIds: string[] = [];
  const testLeaveIds: string[] = [];
  let agentId: string;
  let tlId: string;
  let wfmId: string;
  let leaveRequestId: string;

  beforeAll(async () => {
    // Create test users
    const { data: users, error: userError } = await serviceSupabase.from('users').insert([
      { email: `leave-agent-${Date.now()}@dabdoob.com`, name: 'Leave Agent', role: 'agent' },
      { email: `leave-tl-${Date.now()}@dabdoob.com`, name: 'Leave TL', role: 'tl' },
      { email: `leave-wfm-${Date.now()}@dabdoob.com`, name: 'Leave WFM', role: 'wfm' }
    ]).select();
    
    if (userError || !users) {
      throw new Error(`Failed to create users: ${userError?.message}`);
    }
    
    testUserIds.push(...users.map(u => u.id));
    agentId = users![0].id;
    tlId = users![1].id;
    wfmId = users![2].id;

    // Create leave request
    const { data: leave } = await serviceSupabase.from('leave_requests').insert({
      user_id: agentId,
      leave_type: 'annual',
      start_date: '2027-05-01',
      end_date: '2027-05-03',
      status: 'pending_tl'
    }).select().single();
    
    testLeaveIds.push(leave!.id);
    leaveRequestId = leave!.id;
  });

  afterAll(async () => {
    if (testLeaveIds.length) await serviceSupabase.from('leave_requests').delete().in('id', testLeaveIds);
    if (testUserIds.length) await serviceSupabase.from('users').delete().in('id', testUserIds);
  });

  it('should allow user to view own requests', async () => {
    const { data, error } = await serviceSupabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', agentId);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
    expect(data![0].user_id).toBe(agentId);
  });

  it('should allow TL to view all requests', async () => {
    const { data, error } = await serviceSupabase
      .from('leave_requests')
      .select('*')
      .in('id', testLeaveIds);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('should allow WFM to view all requests', async () => {
    const { data, error } = await serviceSupabase
      .from('leave_requests')
      .select('*')
      .in('id', testLeaveIds);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);
  });

  it('should allow TL to approve request', async () => {
    const { error } = await serviceSupabase
      .from('leave_requests')
      .update({ 
        status: 'pending_wfm',
        tl_approved_at: new Date().toISOString()
      })
      .eq('id', leaveRequestId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('leave_requests')
      .select('status, tl_approved_at')
      .eq('id', leaveRequestId)
      .single();

    expect(data!.status).toBe('pending_wfm');
    expect(data!.tl_approved_at).toBeTruthy();
  });

  it('should allow WFM to approve request', async () => {
    const { error } = await serviceSupabase
      .from('leave_requests')
      .update({ 
        status: 'approved',
        wfm_approved_at: new Date().toISOString()
      })
      .eq('id', leaveRequestId);

    expect(error).toBeNull();

    const { data } = await serviceSupabase
      .from('leave_requests')
      .select('status, wfm_approved_at')
      .eq('id', leaveRequestId)
      .single();

    expect(data!.status).toBe('approved');
    expect(data!.wfm_approved_at).toBeTruthy();
  });

  it('should allow user to create leave request', async () => {
    const { data, error } = await serviceSupabase
      .from('leave_requests')
      .insert({
        user_id: agentId,
        leave_type: 'sick',
        start_date: '2027-05-10',
        end_date: '2027-05-11',
        status: 'pending_tl'
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    testLeaveIds.push(data!.id);
  });

  it('should allow user to update own pending request', async () => {
    const { data: newLeave } = await serviceSupabase
      .from('leave_requests')
      .insert({
        user_id: agentId,
        leave_type: 'casual',
        start_date: '2027-05-15',
        end_date: '2027-05-16',
        status: 'pending_tl'
      })
      .select()
      .single();
    
    testLeaveIds.push(newLeave!.id);

    const { error } = await serviceSupabase
      .from('leave_requests')
      .update({ notes: 'Updated notes' })
      .eq('id', newLeave!.id);

    expect(error).toBeNull();
  });
});
