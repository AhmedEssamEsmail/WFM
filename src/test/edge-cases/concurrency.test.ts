/**
 * Concurrency Tests
 * 
 * Tests concurrent operations to ensure data integrity:
 * - Concurrent swap request approvals
 * - Concurrent leave request approvals
 * - Concurrent shift updates
 * - Optimistic locking verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  testSupabase,
  createTestUser,
  createTestShift,
  createTestSwapRequest,
  createTestLeaveRequest,
  cleanupTestData,
  wait,
} from './test-helpers';

describe('Concurrency Tests', () => {
  const testIds: {
    userIds: string[];
    shiftIds: string[];
    swapRequestIds: string[];
    leaveRequestIds: string[];
  } = {
    userIds: [],
    shiftIds: [],
    swapRequestIds: [],
    leaveRequestIds: [],
  };

  afterEach(async () => {
    await cleanupTestData(testIds);
    testIds.userIds = [];
    testIds.shiftIds = [];
    testIds.swapRequestIds = [];
    testIds.leaveRequestIds = [];
  });

  describe('Concurrent Swap Request Approvals', () => {
    it('should handle two TLs approving the same swap request simultaneously', async () => {
      // Create test users
      const requester = await createTestUser({ role: 'agent', name: 'Requester' });
      const target = await createTestUser({ role: 'agent', name: 'Target' });
      const tl1 = await createTestUser({ role: 'tl', name: 'TL 1' });
      const tl2 = await createTestUser({ role: 'tl', name: 'TL 2' });
      testIds.userIds.push(requester.id, target.id, tl1.id, tl2.id);

      // Create shifts
      const requesterShift = await createTestShift({
        user_id: requester.id,
        date: '2026-03-01',
        shift_type: 'AM',
      });
      const targetShift = await createTestShift({
        user_id: target.id,
        date: '2026-03-01',
        shift_type: 'PM',
      });
      testIds.shiftIds.push(requesterShift.id, targetShift.id);

      // Create swap request in pending_tl state
      const swapRequest = await createTestSwapRequest({
        requester_id: requester.id,
        target_user_id: target.id,
        requester_shift_id: requesterShift.id,
        target_shift_id: targetShift.id,
        status: 'pending_tl',
      });
      testIds.swapRequestIds.push(swapRequest.id);

      // Simulate concurrent approvals by two TLs
      const approval1 = testSupabase
        .from('swap_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_tl') // Optimistic locking check
        .select();

      const approval2 = testSupabase
        .from('swap_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_tl') // Optimistic locking check
        .select();

      // Execute both approvals concurrently
      const [result1, result2] = await Promise.all([approval1, approval2]);

      // One should succeed, one should return empty (status already changed)
      const successCount = [result1.data?.length, result2.data?.length].filter(
        (count) => count && count > 0
      ).length;

      expect(successCount).toBe(1);

      // Verify final state
      const { data: finalRequest } = await testSupabase
        .from('swap_requests')
        .select('*')
        .eq('id', swapRequest.id)
        .single();

      expect(finalRequest?.status).toBe('pending_wfm');
      expect(finalRequest?.tl_approved_at).toBeTruthy();
    });

    it('should handle concurrent target acceptance and requester cancellation', async () => {
      // Create test users
      const requester = await createTestUser({ role: 'agent', name: 'Requester' });
      const target = await createTestUser({ role: 'agent', name: 'Target' });
      testIds.userIds.push(requester.id, target.id);

      // Create shifts
      const requesterShift = await createTestShift({
        user_id: requester.id,
        date: '2026-03-02',
        shift_type: 'AM',
      });
      const targetShift = await createTestShift({
        user_id: target.id,
        date: '2026-03-02',
        shift_type: 'PM',
      });
      testIds.shiftIds.push(requesterShift.id, targetShift.id);

      // Create swap request in pending_acceptance state
      const swapRequest = await createTestSwapRequest({
        requester_id: requester.id,
        target_user_id: target.id,
        requester_shift_id: requesterShift.id,
        target_shift_id: targetShift.id,
        status: 'pending_acceptance',
      });
      testIds.swapRequestIds.push(swapRequest.id);

      // Simulate concurrent acceptance and cancellation
      const acceptance = testSupabase
        .from('swap_requests')
        .update({ status: 'pending_tl' })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_acceptance')
        .select();

      const cancellation = testSupabase
        .from('swap_requests')
        .delete()
        .eq('id', swapRequest.id)
        .eq('status', 'pending_acceptance')
        .select();

      // Execute both operations concurrently
      const [acceptResult, cancelResult] = await Promise.all([
        acceptance,
        cancellation,
      ]);

      // Only one should succeed
      const successCount = [
        acceptResult.data?.length,
        cancelResult.data?.length,
      ].filter((count) => count && count > 0).length;

      expect(successCount).toBe(1);

      // Verify final state - either accepted or deleted
      const { data: finalRequest } = await testSupabase
        .from('swap_requests')
        .select('*')
        .eq('id', swapRequest.id)
        .maybeSingle();

      if (finalRequest) {
        expect(finalRequest.status).toBe('pending_tl');
      } else {
        // Request was deleted
        expect(finalRequest).toBeNull();
      }
    });
  });

  describe('Concurrent Leave Request Approvals', () => {
    it('should handle two TLs approving the same leave request simultaneously', async () => {
      // Create test user
      const agent = await createTestUser({ role: 'agent', name: 'Agent' });
      const tl1 = await createTestUser({ role: 'tl', name: 'TL 1' });
      const tl2 = await createTestUser({ role: 'tl', name: 'TL 2' });
      testIds.userIds.push(agent.id, tl1.id, tl2.id);

      // Create leave request
      const leaveRequest = await createTestLeaveRequest({
        user_id: agent.id,
        leave_type: 'annual',
        start_date: '2026-03-10',
        end_date: '2026-03-12',
        status: 'pending_tl',
      });
      testIds.leaveRequestIds.push(leaveRequest.id);

      // Simulate concurrent approvals
      const approval1 = testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', leaveRequest.id)
        .eq('status', 'pending_tl')
        .select();

      const approval2 = testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', leaveRequest.id)
        .eq('status', 'pending_tl')
        .select();

      // Execute both approvals concurrently
      const [result1, result2] = await Promise.all([approval1, approval2]);

      // Only one should succeed
      const successCount = [result1.data?.length, result2.data?.length].filter(
        (count) => count && count > 0
      ).length;

      expect(successCount).toBe(1);

      // Verify final state
      const { data: finalRequest } = await testSupabase
        .from('leave_requests')
        .select('*')
        .eq('id', leaveRequest.id)
        .single();

      expect(finalRequest?.status).toBe('pending_wfm');
      expect(finalRequest?.tl_approved_at).toBeTruthy();
    });

    it('should handle concurrent WFM approval and user cancellation', async () => {
      // Create test user
      const agent = await createTestUser({ role: 'agent', name: 'Agent' });
      const wfm = await createTestUser({ role: 'wfm', name: 'WFM' });
      testIds.userIds.push(agent.id, wfm.id);

      // Create leave request in pending_wfm state
      const leaveRequest = await createTestLeaveRequest({
        user_id: agent.id,
        leave_type: 'casual',
        start_date: '2026-03-15',
        end_date: '2026-03-16',
        status: 'pending_wfm',
      });
      testIds.leaveRequestIds.push(leaveRequest.id);

      // Simulate concurrent approval and cancellation
      const approval = testSupabase
        .from('leave_requests')
        .update({
          status: 'approved',
          wfm_approved_at: new Date().toISOString(),
        })
        .eq('id', leaveRequest.id)
        .eq('status', 'pending_wfm')
        .select();

      const cancellation = testSupabase
        .from('leave_requests')
        .delete()
        .eq('id', leaveRequest.id)
        .eq('status', 'pending_wfm')
        .select();

      // Execute both operations concurrently
      const [approveResult, cancelResult] = await Promise.all([
        approval,
        cancellation,
      ]);

      // Only one should succeed
      const successCount = [
        approveResult.data?.length,
        cancelResult.data?.length,
      ].filter((count) => count && count > 0).length;

      expect(successCount).toBe(1);

      // Verify final state
      const { data: finalRequest } = await testSupabase
        .from('leave_requests')
        .select('*')
        .eq('id', leaveRequest.id)
        .maybeSingle();

      if (finalRequest) {
        expect(finalRequest.status).toBe('approved');
      } else {
        expect(finalRequest).toBeNull();
      }
    });
  });

  describe('Concurrent Shift Updates', () => {
    it('should handle concurrent updates to the same shift', async () => {
      // Create test user
      const agent = await createTestUser({ role: 'agent', name: 'Agent' });
      testIds.userIds.push(agent.id);

      // Create shift
      const shift = await createTestShift({
        user_id: agent.id,
        date: '2026-03-20',
        shift_type: 'AM',
      });
      testIds.shiftIds.push(shift.id);

      // Simulate concurrent updates
      const update1 = testSupabase
        .from('shifts')
        .update({ shift_type: 'PM' })
        .eq('id', shift.id)
        .select();

      const update2 = testSupabase
        .from('shifts')
        .update({ shift_type: 'BET' })
        .eq('id', shift.id)
        .select();

      // Execute both updates concurrently
      const [result1, result2] = await Promise.all([update1, update2]);

      // Both should succeed (last write wins)
      expect(result1.error).toBeNull();
      expect(result2.error).toBeNull();

      // Verify final state (one of the updates won)
      const { data: finalShift } = await testSupabase
        .from('shifts')
        .select('*')
        .eq('id', shift.id)
        .single();

      expect(['PM', 'BET']).toContain(finalShift?.shift_type);
    });
  });

  describe('Optimistic Locking Verification', () => {
    it('should prevent lost updates using status-based optimistic locking', async () => {
      // Create test users
      const requester = await createTestUser({ role: 'agent', name: 'Requester' });
      const target = await createTestUser({ role: 'agent', name: 'Target' });
      testIds.userIds.push(requester.id, target.id);

      // Create shifts
      const requesterShift = await createTestShift({
        user_id: requester.id,
        date: '2026-03-25',
        shift_type: 'AM',
      });
      const targetShift = await createTestShift({
        user_id: target.id,
        date: '2026-03-25',
        shift_type: 'PM',
      });
      testIds.shiftIds.push(requesterShift.id, targetShift.id);

      // Create swap request
      const swapRequest = await createTestSwapRequest({
        requester_id: requester.id,
        target_user_id: target.id,
        requester_shift_id: requesterShift.id,
        target_shift_id: targetShift.id,
        status: 'pending_acceptance',
      });
      testIds.swapRequestIds.push(swapRequest.id);

      // First update: target accepts
      const { data: accepted } = await testSupabase
        .from('swap_requests')
        .update({ status: 'pending_tl' })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_acceptance')
        .select()
        .single();

      expect(accepted?.status).toBe('pending_tl');

      // Second update: try to reject (should fail - status already changed)
      const { data: rejected } = await testSupabase
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_acceptance') // This condition will fail
        .select();

      // Second update should return empty array (no rows matched)
      expect(rejected).toEqual([]);

      // Verify final state is still pending_tl
      const { data: finalRequest } = await testSupabase
        .from('swap_requests')
        .select('*')
        .eq('id', swapRequest.id)
        .single();

      expect(finalRequest?.status).toBe('pending_tl');
    });
  });
});
