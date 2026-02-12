/**
 * Database Trigger Tests
 * 
 * Tests database triggers:
 * - User creation trigger
 * - Leave balance initialization trigger
 * - Verify triggers fire correctly
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

describe.skip('Database Trigger Tests', () => {
  let testUserIds: string[] = [];

  afterEach(async () => {
    if (testUserIds.length) {
      await serviceSupabase.from('users').delete().in('id', testUserIds);
    }
    testUserIds = [];
  });

  describe('User Creation Trigger', () => {
    it('should initialize leave balances when user is created', async () => {
      // Create new user
      const { data: user } = await serviceSupabase.from('users').insert({
        email: `trigger-user-${Date.now()}@dabdoob.com`,
        name: 'Trigger Test User',
        role: 'agent'
      }).select().single();
      
      testUserIds.push(user!.id);

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify leave balances were created
      const { data: balances } = await serviceSupabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user!.id);

      expect(balances).toBeDefined();
      expect(balances!.length).toBe(5); // 5 leave types

      // Verify all leave types are present
      const leaveTypes = balances!.map(b => b.leave_type).sort();
      expect(leaveTypes).toContain('annual');
      expect(leaveTypes).toContain('casual');
      expect(leaveTypes).toContain('sick');
      expect(leaveTypes).toContain('public_holiday');
      expect(leaveTypes).toContain('bereavement');
    });

    it('should set default balance values', async () => {
      const { data: user } = await serviceSupabase.from('users').insert({
        email: `balance-user-${Date.now()}@dabdoob.com`,
        name: 'Balance User',
        role: 'agent'
      }).select().single();
      
      testUserIds.push(user!.id);

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: balances } = await serviceSupabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user!.id);

      // Verify balances have numeric values
      balances!.forEach(balance => {
        expect(typeof balance.balance).toBe('number');
        expect(balance.balance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should create balances for multiple users', async () => {
      const { data: users, error: userError } = await serviceSupabase.from('users').insert([
        { email: `multi1-${Date.now()}@dabdoob.com`, name: 'Multi User 1', role: 'agent' },
        { email: `multi2-${Date.now()}@dabdoob.com`, name: 'Multi User 2', role: 'tl' },
        { email: `multi3-${Date.now()}@dabdoob.com`, name: 'Multi User 3', role: 'wfm' }
      ]).select();
      
      if (userError || !users) {
        throw new Error(`Failed to create users: ${userError?.message}`);
      }
      
      testUserIds.push(...users.map(u => u.id));

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify each user has balances
      for (const user of users!) {
        const { data: balances } = await serviceSupabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', user.id);

        expect(balances!.length).toBe(5);
      }
    });
  });

  describe('Leave Balance Initialization', () => {
    it('should initialize annual leave balance', async () => {
      const { data: user } = await serviceSupabase.from('users').insert({
        email: `annual-${Date.now()}@dabdoob.com`,
        name: 'Annual User',
        role: 'agent'
      }).select().single();
      
      testUserIds.push(user!.id);

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: balance } = await serviceSupabase
        .from('leave_balances')
        .select('balance')
        .eq('user_id', user!.id)
        .eq('leave_type', 'annual')
        .single();

      expect(balance).toBeDefined();
      expect(Number(balance!.balance)).toBeGreaterThanOrEqual(0);
    });

    it('should initialize sick leave balance', async () => {
      const { data: user } = await serviceSupabase.from('users').insert({
        email: `sick-${Date.now()}@dabdoob.com`,
        name: 'Sick User',
        role: 'agent'
      }).select().single();
      
      testUserIds.push(user!.id);

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: balance } = await serviceSupabase
        .from('leave_balances')
        .select('balance')
        .eq('user_id', user!.id)
        .eq('leave_type', 'sick')
        .single();

      expect(balance).toBeDefined();
      expect(Number(balance!.balance)).toBeGreaterThanOrEqual(0);
    });

    it('should initialize casual leave balance', async () => {
      const { data: user } = await serviceSupabase.from('users').insert({
        email: `casual-${Date.now()}@dabdoob.com`,
        name: 'Casual User',
        role: 'agent'
      }).select().single();
      
      testUserIds.push(user!.id);

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: balance } = await serviceSupabase
        .from('leave_balances')
        .select('balance')
        .eq('user_id', user!.id)
        .eq('leave_type', 'casual')
        .single();

      expect(balance).toBeDefined();
      expect(Number(balance!.balance)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Trigger Reliability', () => {
    it('should fire trigger consistently', async () => {
      const userCount = 5;
      const emails = Array.from({ length: userCount }, (_, i) => 
        `reliable-${Date.now()}-${i}@dabdoob.com`
      );

      const { data: users } = await serviceSupabase.from('users').insert(
        emails.map(email => ({ email, name: 'Reliable User', role: 'agent' }))
      ).select();
      
      testUserIds.push(...users!.map(u => u.id));

      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify all users have balances
      for (const user of users!) {
        const { data: balances } = await serviceSupabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', user.id);

        expect(balances!.length).toBe(5);
      }
    });
  });
});
