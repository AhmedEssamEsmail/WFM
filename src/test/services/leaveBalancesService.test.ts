import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leaveBalancesService } from '../../services/leaveBalancesService';
import { supabase } from '../../lib/supabase';
import type { LeaveBalance, LeaveType } from '../../types';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Test data
const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_LEAVE_TYPE: LeaveType = 'annual';

const mockLeaveBalance: LeaveBalance = {
  id: TEST_UUID,
  user_id: TEST_UUID,
  leave_type: TEST_LEAVE_TYPE,
  balance: 15,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('leaveBalancesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserLeaveBalances', () => {
    it('should fetch all leave balances for a user', async () => {
      const mockData = [mockLeaveBalance];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any);

      const result = await leaveBalancesService.getUserLeaveBalances(TEST_UUID);

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('leave_balances');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(leaveBalancesService.getUserLeaveBalances(TEST_UUID)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getLeaveBalance', () => {
    it('should fetch specific leave balance', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLeaveBalance,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await leaveBalancesService.getLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE);

      expect(result).toEqual(mockLeaveBalance);
    });

    it('should return null when balance not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      const result = await leaveBalancesService.getLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE);

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        leaveBalancesService.getLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateLeaveBalance', () => {
    it('should update leave balance successfully', async () => {
      const updatedBalance = { ...mockLeaveBalance, balance: 10 };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedBalance,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await leaveBalancesService.updateLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, 10);

      expect(result.balance).toBe(10);
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: mockError,
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        leaveBalancesService.updateLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, 10)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('upsertLeaveBalance', () => {
    it('should upsert leave balance successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLeaveBalance,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await leaveBalancesService.upsertLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, 15);

      expect(result).toEqual(mockLeaveBalance);
    });

    it('should throw error when upsert fails', async () => {
      const mockError = new Error('Upsert failed');

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        leaveBalancesService.upsertLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, 15)
      ).rejects.toThrow('Upsert failed');
    });
  });

  describe('bulkUpsertLeaveBalances', () => {
    it('should bulk upsert leave balances successfully', async () => {
      const balances = [
        { user_id: TEST_UUID, leave_type: 'annual' as LeaveType, balance: 15 },
        { user_id: TEST_UUID, leave_type: 'sick' as LeaveType, balance: 10 },
      ];
      const mockData = balances.map((b, i) => ({ ...mockLeaveBalance, ...b, id: `uuid-${i}` }));

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any);

      const result = await leaveBalancesService.bulkUpsertLeaveBalances(balances);

      expect(result).toHaveLength(2);
    });

    it('should throw error when bulk upsert fails', async () => {
      const mockError = new Error('Bulk upsert failed');
      const balances = [{ user_id: TEST_UUID, leave_type: 'annual' as LeaveType, balance: 15 }];

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(leaveBalancesService.bulkUpsertLeaveBalances(balances)).rejects.toThrow(
        'Bulk upsert failed'
      );
    });
  });

  describe('getLeaveBalanceHistory', () => {
    it('should fetch leave balance history', async () => {
      const mockData = [
        {
          id: TEST_UUID,
          user_id: TEST_UUID,
          leave_type: TEST_LEAVE_TYPE,
          previous_balance: 15,
          new_balance: 10,
          change_reason: 'Leave approved',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await leaveBalancesService.getLeaveBalanceHistory(TEST_UUID);

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('leave_balance_history');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(leaveBalancesService.getLeaveBalanceHistory(TEST_UUID)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('deductLeaveBalance', () => {
    it('should deduct leave balance successfully', async () => {
      const updatedBalance = { ...mockLeaveBalance, balance: 10 };

      // Mock getLeaveBalance
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLeaveBalance,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock updateLeaveBalance
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedBalance,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock history insert
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await leaveBalancesService.deductLeaveBalance(
        TEST_UUID,
        TEST_LEAVE_TYPE,
        5,
        'Leave approved'
      );

      expect(result.balance).toBe(10);
    });

    it('should throw error when balance not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        leaveBalancesService.deductLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, 5, 'Leave approved')
      ).rejects.toThrow('Leave balance not found');
    });

    it('should throw error for insufficient balance', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLeaveBalance,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        leaveBalancesService.deductLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, 20, 'Leave approved')
      ).rejects.toThrow('Insufficient leave balance');
    });
  });
});
