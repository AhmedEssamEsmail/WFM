/**
 * Boundary Condition Tests
 * 
 * Tests boundary conditions and edge values:
 * - Maximum string lengths
 * - Date range boundaries
 * - Numeric boundaries (balances)
 * - Empty/null inputs
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  testSupabase,
  createTestUser,
  createTestShift,
  createTestLeaveRequest,
  updateLeaveBalance,
  cleanupTestData,
} from './test-helpers';

describe('Boundary Condition Tests', () => {
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

  describe('Maximum String Lengths', () => {
    it('should handle very long user names', async () => {
      const longName = 'A'.repeat(1000);

      const { data, error } = await testSupabase
        .from('users')
        .insert({
          email: `longname-${Date.now()}@dabdoob.com`,
          name: longName,
          role: 'agent',
        })
        .select()
        .single();

      // Database should accept long names (TEXT type has no limit)
      expect(error).toBeNull();
      expect(data?.name).toBe(longName);
      if (data) {
        testIds.userIds.push(data.id);
      }
    });

    it('should handle very long email addresses', async () => {
      const longEmail = `${'a'.repeat(200)}@dabdoob.com`;

      const { data, error } = await testSupabase
        .from('users')
        .insert({
          email: longEmail,
          name: 'Long Email User',
          role: 'agent',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.email).toBe(longEmail);
      if (data) {
        testIds.userIds.push(data.id);
      }
    });

    it('should handle very long leave request notes', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const longNotes = 'X'.repeat(10000);

      const { data, error } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: agent.id,
          leave_type: 'annual',
          start_date: '2026-08-01',
          end_date: '2026-08-02',
          status: 'pending_tl',
          notes: longNotes,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.notes).toBe(longNotes);
      if (data) {
        testIds.leaveRequestIds.push(data.id);
      }
    });

    it('should handle empty strings', async () => {
      const { error } = await testSupabase
        .from('users')
        .insert({
          email: `empty-${Date.now()}@dabdoob.com`,
          name: '', // Empty string
          role: 'agent',
        });

      // Database allows empty strings
      expect(error).toBeNull();
    });

    it('should handle special characters in names', async () => {
      const specialName = "O'Brien-Smith (Jr.) <test@example.com>";

      const { data, error } = await testSupabase
        .from('users')
        .insert({
          email: `special-${Date.now()}@dabdoob.com`,
          name: specialName,
          role: 'agent',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.name).toBe(specialName);
      if (data) {
        testIds.userIds.push(data.id);
      }
    });
  });

  describe('Date Range Boundaries', () => {
    it('should handle minimum date (far past)', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const { data, error } = await testSupabase
        .from('shifts')
        .insert({
          user_id: agent.id,
          date: '1900-01-01',
          shift_type: 'AM',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.date).toBe('1900-01-01');
      if (data) {
        testIds.shiftIds.push(data.id);
      }
    });

    it('should handle maximum date (far future)', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const { data, error } = await testSupabase
        .from('shifts')
        .insert({
          user_id: agent.id,
          date: '2099-12-31',
          shift_type: 'PM',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.date).toBe('2099-12-31');
      if (data) {
        testIds.shiftIds.push(data.id);
      }
    });

    it('should handle single-day leave request', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const { data, error } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: agent.id,
          leave_type: 'sick',
          start_date: '2026-08-15',
          end_date: '2026-08-15', // Same day
          status: 'pending_tl',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.start_date).toBe(data?.end_date);
      if (data) {
        testIds.leaveRequestIds.push(data.id);
      }
    });

    it('should handle very long leave request (365 days)', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const { data, error } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: agent.id,
          leave_type: 'annual',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          status: 'pending_tl',
        })
        .select()
        .single();

      expect(error).toBeNull();
      if (data) {
        testIds.leaveRequestIds.push(data.id);
      }
    });

    it('should handle leap year dates', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const { data, error } = await testSupabase
        .from('shifts')
        .insert({
          user_id: agent.id,
          date: '2024-02-29', // Leap year
          shift_type: 'BET',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.date).toBe('2024-02-29');
      if (data) {
        testIds.shiftIds.push(data.id);
      }
    });
  });

  describe('Numeric Boundaries', () => {
    it('should handle zero balance', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const data = await updateLeaveBalance(agent.id, 'annual', 0);

      expect(data.balance).toBe(0);
    });

    it('should handle very large balance', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const largeBalance = 999999.99;
      const data = await updateLeaveBalance(
        agent.id,
        'casual',
        largeBalance
      );

      expect(Number(data.balance)).toBe(largeBalance);
    });

    it('should handle decimal balances', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const decimalBalance = 12.5;
      const data = await updateLeaveBalance(
        agent.id,
        'sick',
        decimalBalance
      );

      expect(Number(data.balance)).toBe(decimalBalance);
    });

    it('should handle very small decimal balances', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const smallBalance = 0.01;
      const data = await updateLeaveBalance(
        agent.id,
        'bereavement',
        smallBalance
      );

      expect(Number(data.balance)).toBe(smallBalance);
    });

    it('should handle negative balance (if allowed)', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const negativeBalance = -5;
      const data = await updateLeaveBalance(
        agent.id,
        'public_holiday',
        negativeBalance
      );

      // Database allows negative balances
      // Application should validate this
      expect(Number(data.balance)).toBe(negativeBalance);
    });
  });

  describe('Empty and Null Inputs', () => {
    it('should reject null email', async () => {
      const { error } = await testSupabase
        .from('users')
        .insert({
          email: null as any,
          name: 'Null Email User',
          role: 'agent',
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('null value');
    });

    it('should reject null name', async () => {
      const { error } = await testSupabase
        .from('users')
        .insert({
          email: `nullname-${Date.now()}@dabdoob.com`,
          name: null as any,
          role: 'agent',
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('null value');
    });

    it('should handle null notes in leave request', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const { data, error } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: agent.id,
          leave_type: 'casual',
          start_date: '2026-09-01',
          end_date: '2026-09-02',
          status: 'pending_tl',
          notes: null, // Null is allowed for notes
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.notes).toBeNull();
      if (data) {
        testIds.leaveRequestIds.push(data.id);
      }
    });

    it('should handle empty department', async () => {
      const { data, error } = await testSupabase
        .from('users')
        .insert({
          email: `nodept-${Date.now()}@dabdoob.com`,
          name: 'No Department User',
          role: 'agent',
          department: null, // Null department
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.department).toBeNull();
      if (data) {
        testIds.userIds.push(data.id);
      }
    });
  });

  describe('Array and Collection Boundaries', () => {
    it('should handle empty result sets', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000001';

      const { data, error } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', fakeId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should handle large result sets', async () => {
      // Query all users (could be large)
      const { data, error } = await testSupabase
        .from('users')
        .select('*')
        .limit(1000);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle pagination boundaries', async () => {
      // Test first page
      const { data: page1, error: error1 } = await testSupabase
        .from('users')
        .select('*')
        .range(0, 9);

      expect(error1).toBeNull();
      expect(Array.isArray(page1)).toBe(true);

      // Test empty page (beyond data)
      const { data: emptyPage, error: error2 } = await testSupabase
        .from('users')
        .select('*')
        .range(10000, 10009);

      expect(error2).toBeNull();
      expect(emptyPage).toEqual([]);
    });
  });

  describe('Special Character Handling', () => {
    it('should handle SQL injection attempts in email', async () => {
      const maliciousEmail = "'; DROP TABLE users; --@dabdoob.com";

      const { data, error } = await testSupabase
        .from('users')
        .insert({
          email: maliciousEmail,
          name: 'SQL Injection Test',
          role: 'agent',
        })
        .select()
        .single();

      // Should be safely escaped
      expect(error).toBeNull();
      expect(data?.email).toBe(maliciousEmail);
      if (data) {
        testIds.userIds.push(data.id);
      }
    });

    it('should handle unicode characters in names', async () => {
      const unicodeName = '测试用户 👤 Тест';

      const { data, error } = await testSupabase
        .from('users')
        .insert({
          email: `unicode-${Date.now()}@dabdoob.com`,
          name: unicodeName,
          role: 'agent',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.name).toBe(unicodeName);
      if (data) {
        testIds.userIds.push(data.id);
      }
    });

    it('should handle newlines and tabs in notes', async () => {
      const agent = await createTestUser({ role: 'agent' });
      testIds.userIds.push(agent.id);

      const notesWithWhitespace = 'Line 1\nLine 2\tTabbed\rCarriage Return';

      const { data, error } = await testSupabase
        .from('leave_requests')
        .insert({
          user_id: agent.id,
          leave_type: 'annual',
          start_date: '2026-09-10',
          end_date: '2026-09-11',
          status: 'pending_tl',
          notes: notesWithWhitespace,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.notes).toBe(notesWithWhitespace);
      if (data) {
        testIds.leaveRequestIds.push(data.id);
      }
    });
  });
});
