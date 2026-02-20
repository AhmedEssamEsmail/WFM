/**
 * Comments and Exception Request Tests
 *
 * Tests comment system and exception request flows:
 * - User comment creation
 * - System comment creation
 * - System comment protection
 * - Exception request workflow
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('Comments and Exception Tests', () => {
  let testUserIds: string[] = [];
  let testLeaveIds: string[] = [];
  let testCommentIds: string[] = [];

  afterEach(async () => {
    if (testCommentIds.length)
      await testSupabase.from('comments').delete().in('id', testCommentIds);
    if (testLeaveIds.length)
      await testSupabase.from('leave_requests').delete().in('id', testLeaveIds);
    if (testUserIds.length) await testSupabase.from('users').delete().in('id', testUserIds);
    testUserIds = [];
    testLeaveIds = [];
    testCommentIds = [];
  });

  describe('Comment System', () => {
    it('should create user comments on leave requests', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `comment-${Date.now()}@dabdoob.com`,
          name: 'Comment User',
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
          start_date: '2027-01-01',
          end_date: '2027-01-02',
          status: 'pending_tl',
        })
        .select()
        .single();
      testLeaveIds.push(leave!.id);

      const { data: comment } = await testSupabase
        .from('comments')
        .insert({
          request_type: 'leave',
          request_id: leave!.id,
          user_id: user!.id,
          content: 'Please approve this request',
          is_system: false,
        })
        .select()
        .single();
      testCommentIds.push(comment!.id);

      expect(comment!.is_system).toBe(false);
      expect(comment!.content).toBe('Please approve this request');
    });

    it('should create system comments', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `sys-comment-${Date.now()}@dabdoob.com`,
          name: 'System User',
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
          start_date: '2027-01-05',
          end_date: '2027-01-06',
          status: 'approved',
        })
        .select()
        .single();
      testLeaveIds.push(leave!.id);

      const { data: sysComment } = await testSupabase
        .from('comments')
        .insert({
          request_type: 'leave',
          request_id: leave!.id,
          user_id: user!.id,
          content: 'Request approved by WFM',
          is_system: true,
        })
        .select()
        .single();
      testCommentIds.push(sysComment!.id);

      expect(sysComment!.is_system).toBe(true);
    });

    it('should distinguish between user and system comments', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `mixed-${Date.now()}@dabdoob.com`,
          name: 'Mixed User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      const { data: leave } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'casual',
          start_date: '2027-01-10',
          end_date: '2027-01-11',
          status: 'pending_tl',
        })
        .select()
        .single();
      testLeaveIds.push(leave!.id);

      // Create both types
      const { data: comments } = await testSupabase
        .from('comments')
        .insert([
          {
            request_type: 'leave',
            request_id: leave!.id,
            user_id: user!.id,
            content: 'User comment',
            is_system: false,
          },
          {
            request_type: 'leave',
            request_id: leave!.id,
            user_id: user!.id,
            content: 'System comment',
            is_system: true,
          },
        ])
        .select();
      testCommentIds.push(...comments!.map((c) => c.id));

      const { data: userComments } = await testSupabase
        .from('comments')
        .select('*')
        .eq('request_id', leave!.id)
        .eq('is_system', false);
      const { data: systemComments } = await testSupabase
        .from('comments')
        .select('*')
        .eq('request_id', leave!.id)
        .eq('is_system', true);

      expect(userComments!.length).toBe(1);
      expect(systemComments!.length).toBe(1);
    });
  });

  describe('Exception Request Workflow', () => {
    it('should support denied → exception request flow', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `exception-${Date.now()}@dabdoob.com`,
          name: 'Exception User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      // Create denied request
      const { data: denied } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'annual',
          start_date: '2027-01-15',
          end_date: '2027-01-20',
          status: 'denied',
          notes: 'Insufficient balance',
        })
        .select()
        .single();
      testLeaveIds.push(denied!.id);

      expect(denied!.status).toBe('denied');

      // User can create new request as exception
      const { data: exception } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'annual',
          start_date: '2027-01-15',
          end_date: '2027-01-20',
          status: 'pending_tl',
          notes: 'Exception request - urgent family matter',
        })
        .select()
        .single();
      testLeaveIds.push(exception!.id);

      expect(exception!.status).toBe('pending_tl');
      expect(exception!.notes).toContain('Exception');
    });

    it('should allow exception approval workflow', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `exc-approve-${Date.now()}@dabdoob.com`,
          name: 'Exception Approve User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      const { data: exception } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'sick',
          start_date: '2027-01-25',
          end_date: '2027-01-26',
          status: 'pending_tl',
          notes: 'Exception request',
        })
        .select()
        .single();
      testLeaveIds.push(exception!.id);

      // TL approves exception
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', exception!.id);

      // WFM approves exception
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'approved',
          wfm_approved_at: new Date().toISOString(),
        })
        .eq('id', exception!.id);

      const { data: approved } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', exception!.id)
        .single();

      expect(approved!.status).toBe('approved');
    });

    it('should allow exception rejection', async () => {
      const { data: user } = await testSupabase
        .from('users')
        .insert({
          email: `exc-reject-${Date.now()}@dabdoob.com`,
          name: 'Exception Reject User',
          role: 'agent',
        })
        .select()
        .single();
      testUserIds.push(user!.id);

      const { data: exception } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: user!.id,
          leave_type: 'casual',
          start_date: '2027-02-01',
          end_date: '2027-02-05',
          status: 'pending_tl',
          notes: 'Exception request',
        })
        .select()
        .single();
      testLeaveIds.push(exception!.id);

      // TL rejects exception
      await testSupabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', exception!.id);

      const { data: rejected } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', exception!.id)
        .single();

      expect(rejected!.status).toBe('rejected');
    });
  });
});
