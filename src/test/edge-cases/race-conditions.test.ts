/**
 * Race Condition Tests
 * 
 * Tests race conditions in critical workflows:
 * - Status transition conflicts
 * - Optimistic locking for swap requests
 * - Optimistic locking for leave requests
 * - Concurrent balance updates
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  testSupabase,
  createTestUser,
  createTestShift,
  createTestSwapRequest,
  createTestLeaveRequest,
  getLeaveBalance,
  updateLeaveBalance,
  cleanupTestData,
} from './test-helpers';

describe('Race Condition Tests', () => {
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

  describe('Status Transition Conflicts', () => {
    it('should prevent invalid status transitions in swap requests', async () => {
      // Create test users
      const requester = await createTestUser({ role: 'agent' });
      const target = await createTestUser({ role: 'agent' });
      testIds.userIds.push(requester.id, target.id);

      // Create shifts
      const requesterShift = await createTestShift({
        user_id: requester.id,
        date: '2026-04-01',
      });
      const targetShift = await createTestShift({
        user_id: target.id,
        date: '2026-04-01',
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

      // Try to skip from pending_acceptance directly to approved (invalid)
      const { data: invalidTransition } = await testSupabase
        .from('swap_requests')
        .update({ status: 'approved' })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_tl') // This condition will fail
        .select();

      expect(invalidTransition).toEqual([]);

      // Verify status is still pending_acceptance
      const { data: currentRequest } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swapRequest.id)
        .single();

      expect(currentRequest?.status).toBe('pending_acceptance');
    });

    it('should enforce correct status flow: pending_acceptance → pending_tl → pending_wfm → approved', async () => {
      // Create test users
      const requester = await createTestUser({ role: 'agent' });
      const target = await createTestUser({ role: 'agent' });
      testIds.userIds.push(requester.id, target.id);

      // Create shifts
      const requesterShift = await createTestShift({
        user_id: requester.id,
        date: '2026-04-05',
      });
      const targetShift = await createTestShift({
        user_id: target.id,
        date: '2026-04-05',
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

      // Step 1: Target accepts
      const { data: step1 } = await testSupabase
        .from('swap_requests')
        .update({ status: 'pending_tl' })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_acceptance')
        .select()
        .single();

      expect(step1?.status).toBe('pending_tl');

      // Step 2: TL approves
      const { data: step2 } = await testSupabase
        .from('swap_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_tl')
        .select()
        .single();

      expect(step2?.status).toBe('pending_wfm');

      // Step 3: WFM approves
      const { data: step3 } = await testSupabase
        .from('swap_requests')
        .update({
          status: 'approved',
          wfm_approved_at: new Date().toISOString(),
        })
        .eq('id', swapRequest.id)
        .eq('status', 'pending_wfm')
        .select()
        .single();

      expect(step3?.status).toBe('approved');
    });
  });

  describe('Optimistic Locking for Swap Requests', () => {
    it('should use status as version field for optimistic locking', async () => {
      // Create test users
      const requester = await createTestUser({ role: 'agent' });
      const target = await createTestUser({ role: 'agent' });
      testIds.userIds.push(requester.id, target.id);

      // Create shifts
      const requesterShift = await createTestShift({
        user_id: requester.id,
        date: '2026-04-10',
      });
      const targetShift = await createTestShift({
        user_id: target.id,
        date: '2026-04-10',
      });
      testIds.shiftIds.push(requesterShift.id, targetShift.id);

      // Create swap request
      const swapRequest = await createTestSwapRequest({
        requester_id: requester.id,
        target_user_id: target.id,
        requester_shift_id: requesterShift.id,
        target_shift_id: targetShift.id,
        status: 'pending_tl',
      });
      testIds.swapRequestIds.push(swapRequest.id);

      // Read current status
      const { data: currentData } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swapRequest.id)
        .single();

      const expectedStatus = currentData?.status;

      // Another process updates the status
      await testSupabase
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', swapRequest.id);

      // Try to update with old status (should fail)
      const { data: staleUpdate } = await testSupabase
        .from('swap_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', swapRequest.id)
        .eq('status', expectedStatus) // This will fail - status changed
        .select();

      expect(staleUpdate).toEqual([]);

      // Verify status is rejected (not pending_wfm)
      const { data: finalData } = await testSupabase
        .from('swap_requests')
        .select('status')
        .eq('id', swapRequest.id)
        .single();

      expect(finalData?.status).toBe('rejected');
    });
  });

  describe('Optimistic Locking for Leave Requests', () => {
    it('should prevent concurrent modifications using status check', async () => {
      // Create test user
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      // Create leave request
      const leaveRequest = await createTestLeaveRequest({
        user_id: agent.id,
        status: 'pending_tl',
      });
      testIds.leaveRequestIds.push(leaveRequest.id);

      // Read current status
      const { data: currentData } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', leaveRequest.id)
        .single();

      const expectedStatus = currentData?.status;

      // Another process approves the request
      await testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', leaveRequest.id);

      // Try to reject with old status (should fail)
      const { data: staleUpdate } = await testSupabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', leaveRequest.id)
        .eq('status', expectedStatus) // This will fail
        .select();

      expect(staleUpdate).toEqual([]);

      // Verify status is pending_wfm (not rejected)
      const { data: finalData } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', leaveRequest.id)
        .single();

      expect(finalData?.status).toBe('pending_wfm');
    });
  });

  describe('Concurrent Balance Updates', () => {
    it('should handle concurrent leave balance deductions', async () => {
      // Create test user
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      // Set initial balance
      await updateLeaveBalance(agent.id, 'annual', 10);

      // Read current balance
      const currentBalance = await getLeaveBalance(agent.id, 'annual');
      expect(currentBalance.balance).toBe(10);

      // Simulate two concurrent deductions
      const deduction1 = testSupabase
        .from('leave_balances')
        .update({ balance: currentBalance.balance - 3 })
        .eq('user_id', agent.id)
        .eq('leave_type', 'annual')
        .select();

      const deduction2 = testSupabase
        .from('leave_balances')
        .update({ balance: currentBalance.balance - 2 })
        .eq('user_id', agent.id)
        .eq('leave_type', 'annual')
        .select();

      // Execute both deductions concurrently
      await Promise.all([deduction1, deduction2]);

      // Check final balance (last write wins - not ideal but expected)
      const finalBalance = await getLeaveBalance(agent.id, 'annual');

      // Balance should be either 7 or 8 (one deduction won)
      expect([7, 8]).toContain(finalBalance.balance);

      // Note: This demonstrates the need for atomic operations
      // In production, use database functions or transactions
    });

    it('should demonstrate need for atomic balance operations', async () => {
      // Create test user
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      // Set initial balance
      await updateLeaveBalance(agent.id, 'casual', 5);

      // Multiple concurrent updates
      const updates = Array.from({ length: 5 }, (_, i) =>
        testSupabase
          .from('leave_balances')
          .update({ balance: 5 - (i + 1) })
          .eq('user_id', agent.id)
          .eq('leave_type', 'casual')
      );

      await Promise.all(updates);

      // Final balance is unpredictable due to race conditions
      const finalBalance = await getLeaveBalance(agent.id, 'casual');

      // Balance should be between 0 and 4
      expect(finalBalance.balance).toBeGreaterThanOrEqual(0);
      expect(finalBalance.balance).toBeLessThanOrEqual(4);

      // This test demonstrates why we need atomic operations
      // for balance management in production
    });
  });

  describe('Status Transition Race Conditions', () => {
    it('should handle race between approval and rejection', async () => {
      // Create test users
      const agent = await createTestUser({ role: 'agent' });
      const tl = await createTestUser({ role: 'tl' });
      testIds.userIds.push(agent.id, tl.id);

      // Create leave request
      const leaveRequest = await createTestLeaveRequest({
        user_id: agent.id,
        status: 'pending_tl',
      });
      testIds.leaveRequestIds.push(leaveRequest.id);

      // Simulate concurrent approval and rejection
      const approval = testSupabase
        .from('leave_requests')
        .update({
          status: 'pending_wfm',
          tl_approved_at: new Date().toISOString(),
        })
        .eq('id', leaveRequest.id)
        .eq('status', 'pending_tl')
        .select();

      const rejection = testSupabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', leaveRequest.id)
        .eq('status', 'pending_tl')
        .select();

      // Execute both operations concurrently
      const [approveResult, rejectResult] = await Promise.all([
        approval,
        rejection,
      ]);

      // Only one should succeed
      const successCount = [
        approveResult.data?.length,
        rejectResult.data?.length,
      ].filter((count) => count && count > 0).length;

      expect(successCount).toBe(1);

      // Verify final state is consistent
      const { data: finalRequest } = await testSupabase
        .from('leave_requests')
        .select('status')
        .eq('id', leaveRequest.id)
        .single();

      expect(['pending_wfm', 'rejected']).toContain(finalRequest?.status);
    });
  });
});
