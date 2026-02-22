// Leave balances service

import { supabase } from '../lib/supabase';
import type { LeaveBalance, LeaveBalanceHistory, LeaveType, User } from '../types';
import { API_ENDPOINTS } from '../constants';

export const leaveBalancesService = {
  /**
   * Get all leave balances for a user
   */
  async getUserLeaveBalances(userId: string): Promise<LeaveBalance[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_BALANCES)
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data as LeaveBalance[];
  },

  /**
   * Get specific leave balance
   */
  async getLeaveBalance(userId: string, leaveType: LeaveType): Promise<LeaveBalance | null> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_BALANCES)
      .select('*')
      .eq('user_id', userId)
      .eq('leave_type', leaveType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as LeaveBalance;
  },

  /**
   * Update leave balance
   */
  async updateLeaveBalance(
    userId: string,
    leaveType: LeaveType,
    newBalance: number
  ): Promise<LeaveBalance> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_BALANCES)
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('leave_type', leaveType)
      .select()
      .single();

    if (error) throw error;
    return data as LeaveBalance;
  },

  /**
   * Upsert leave balance (insert or update)
   */
  async upsertLeaveBalance(
    userId: string,
    leaveType: LeaveType,
    balance: number
  ): Promise<LeaveBalance> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_BALANCES)
      .upsert(
        {
          user_id: userId,
          leave_type: leaveType,
          balance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,leave_type' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as LeaveBalance;
  },

  /**
   * Bulk upsert leave balances
   */
  async bulkUpsertLeaveBalances(
    balances: Array<{ user_id: string; leave_type: LeaveType; balance: number }>
  ): Promise<LeaveBalance[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_BALANCES)
      .upsert(
        balances.map((b) => ({ ...b, updated_at: new Date().toISOString() })),
        { onConflict: 'user_id,leave_type' }
      )
      .select();

    if (error) throw error;
    return data as LeaveBalance[];
  },

  /**
   * Get leave balance history
   */
  async getLeaveBalanceHistory(userId: string): Promise<LeaveBalanceHistory[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_BALANCE_HISTORY)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as LeaveBalanceHistory[];
  },

  /**
   * Deduct leave balance
   */
  async deductLeaveBalance(
    userId: string,
    leaveType: LeaveType,
    amount: number,
    reason: string
  ): Promise<LeaveBalance> {
    // Get current balance
    const currentBalance = await this.getLeaveBalance(userId, leaveType);
    if (!currentBalance) {
      throw new Error('Leave balance not found');
    }

    const newBalance = currentBalance.balance - amount;
    if (newBalance < 0) {
      throw new Error('Insufficient leave balance');
    }

    // Update balance
    const updatedBalance = await this.updateLeaveBalance(userId, leaveType, newBalance);

    // Record history
    await supabase.from(API_ENDPOINTS.LEAVE_BALANCE_HISTORY).insert({
      user_id: userId,
      leave_type: leaveType,
      previous_balance: currentBalance.balance,
      new_balance: newBalance,
      change_reason: reason,
    });

    return updatedBalance;
  },

  /**
   * Get all leave balances with user information
   * Supports role-based filtering:
   * - agent: sees only their own balances
   * - tl: sees team balances (currently all users - adjust if team filtering is needed)
   * - wfm: sees all balances
   */
  async getAllLeaveBalances(
    currentUserId: string,
    currentUserRole: 'agent' | 'tl' | 'wfm'
  ): Promise<Array<{ user: User; balances: LeaveBalance[] }>> {
    // Fetch users based on role
    let usersQuery = supabase.from('users').select('*');

    if (currentUserRole === 'agent') {
      usersQuery = usersQuery.eq('id', currentUserId);
    }
    // TL and WFM see all users (adjust TL filtering if team-based filtering is needed)

    const { data: usersData, error: usersError } = await usersQuery.order('name');
    if (usersError) throw usersError;

    // Fetch leave balances based on role
    let balancesQuery = supabase.from(API_ENDPOINTS.LEAVE_BALANCES).select('*');

    if (currentUserRole === 'agent') {
      balancesQuery = balancesQuery.eq('user_id', currentUserId);
    }
    // TL and WFM see all balances

    const { data: balancesData, error: balancesError } = await balancesQuery;
    if (balancesError) throw balancesError;

    // Group balances by user
    const balancesByUser = new Map<string, LeaveBalance[]>();
    (balancesData || []).forEach((balance: LeaveBalance) => {
      if (!balancesByUser.has(balance.user_id)) {
        balancesByUser.set(balance.user_id, []);
      }
      balancesByUser.get(balance.user_id)!.push(balance);
    });

    // Combine users with their balances
    return (usersData || []).map((user) => ({
      user,
      balances: balancesByUser.get(user.id) || [],
    }));
  },
};
