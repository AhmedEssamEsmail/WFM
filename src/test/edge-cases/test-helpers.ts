/**
 * Test Helpers for Edge Case Testing
 * 
 * Provides utilities for creating test data and managing test state
 */

import { createClient } from '@supabase/supabase-js';

// Test database client with service role (bypasses RLS for testing)
export const testSupabase = createClient(
  process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_TEST_SERVICE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Test data factories
export const createTestUser = async (overrides?: {
  email?: string;
  name?: string;
  role?: 'agent' | 'tl' | 'wfm';
  department?: string;
}) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const user = {
    email: overrides?.email || `test-${timestamp}-${random}@dabdoob.com`,
    name: overrides?.name || `Test User ${timestamp}`,
    role: overrides?.role || 'agent',
    department: overrides?.department || 'Test Department',
  };

  const { data, error } = await testSupabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestShift = async (overrides?: {
  user_id?: string;
  date?: string;
  shift_type?: 'AM' | 'PM' | 'BET' | 'OFF';
}) => {
  const shift = {
    user_id: overrides?.user_id || '',
    date: overrides?.date || new Date().toISOString().split('T')[0],
    shift_type: overrides?.shift_type || 'AM',
  };

  const { data, error } = await testSupabase
    .from('shifts')
    .insert(shift)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestSwapRequest = async (overrides?: {
  requester_id?: string;
  target_user_id?: string;
  requester_shift_id?: string;
  target_shift_id?: string;
  status?: 'pending_acceptance' | 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected';
}) => {
  const swapRequest = {
    requester_id: overrides?.requester_id || '',
    target_user_id: overrides?.target_user_id || '',
    requester_shift_id: overrides?.requester_shift_id || '',
    target_shift_id: overrides?.target_shift_id || '',
    status: overrides?.status || 'pending_acceptance',
  };

  const { data, error } = await testSupabase
    .from('swap_requests')
    .insert(swapRequest)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTestLeaveRequest = async (overrides?: {
  user_id?: string;
  leave_type?: 'annual' | 'casual' | 'sick' | 'public_holiday' | 'bereavement';
  start_date?: string;
  end_date?: string;
  status?: 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected' | 'denied';
}) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const leaveRequest = {
    user_id: overrides?.user_id || '',
    leave_type: overrides?.leave_type || 'annual',
    start_date: overrides?.start_date || today.toISOString().split('T')[0],
    end_date: overrides?.end_date || tomorrow.toISOString().split('T')[0],
    status: overrides?.status || 'pending_tl',
    notes: 'Test leave request',
  };

  const { data, error } = await testSupabase
    .from('leave_requests')
    .insert(leaveRequest)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLeaveBalance = async (userId: string, leaveType: string) => {
  const { data, error } = await testSupabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('leave_type', leaveType)
    .single();

  if (error) throw error;
  return data;
};

export const updateLeaveBalance = async (
  userId: string,
  leaveType: string,
  balance: number
) => {
  const { data, error } = await testSupabase
    .from('leave_balances')
    .update({ balance })
    .eq('user_id', userId)
    .eq('leave_type', leaveType)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Cleanup helpers
export const cleanupTestData = async (ids: {
  userIds?: string[];
  shiftIds?: string[];
  swapRequestIds?: string[];
  leaveRequestIds?: string[];
}) => {
  if (ids.swapRequestIds?.length) {
    await testSupabase
      .from('swap_requests')
      .delete()
      .in('id', ids.swapRequestIds);
  }

  if (ids.leaveRequestIds?.length) {
    await testSupabase
      .from('leave_requests')
      .delete()
      .in('id', ids.leaveRequestIds);
  }

  if (ids.shiftIds?.length) {
    await testSupabase
      .from('shifts')
      .delete()
      .in('id', ids.shiftIds);
  }

  if (ids.userIds?.length) {
    await testSupabase
      .from('users')
      .delete()
      .in('id', ids.userIds);
  }
};

// Wait helper for async operations
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
