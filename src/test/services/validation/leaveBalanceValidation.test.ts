import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateLeaveBalance,
  checkOverlappingLeave,
  validateNoOverlappingLeave,
  validateLeaveRequest,
} from '../../../validation';
import { leaveBalancesService } from '../../../services/leaveBalancesService';
import { leaveRequestsService } from '../../../services/leaveRequestsService';
import { InsufficientLeaveBalanceError, ValidationError } from '../../../types/errors';
import type { LeaveBalance, LeaveRequest, LeaveType } from '../../../types';

// Mock services
vi.mock('../../../services/leaveBalancesService');
vi.mock('../../../services/leaveRequestsService');
vi.mock('../../../utils/dateHelpers', () => ({
  getBusinessDaysBetween: vi.fn((start: string, end: string) => {
    // Simple mock: count days between dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }),
}));

const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_LEAVE_TYPE: LeaveType = 'annual';

const mockBalance: LeaveBalance = {
  id: TEST_UUID,
  user_id: TEST_UUID,
  leave_type: TEST_LEAVE_TYPE,
  balance: 15,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockLeaveRequest: LeaveRequest = {
  id: TEST_UUID,
  user_id: TEST_UUID,
  leave_type: TEST_LEAVE_TYPE,
  start_date: '2024-01-15',
  end_date: '2024-01-20',
  status: 'approved',
  reason: 'Vacation',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('leaveBalanceValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateLeaveBalance', () => {
    it('should pass validation when sufficient balance exists', async () => {
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue(mockBalance);

      await expect(
        validateLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, '2024-01-01', '2024-01-05')
      ).resolves.toBeUndefined();
    });

    it('should throw InsufficientLeaveBalanceError when balance is insufficient', async () => {
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue({
        ...mockBalance,
        balance: 2,
      });

      await expect(
        validateLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, '2024-01-01', '2024-01-10')
      ).rejects.toThrow(InsufficientLeaveBalanceError);
    });

    it('should throw ValidationError when no balance found', async () => {
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue(null);

      await expect(
        validateLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, '2024-01-01', '2024-01-05')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid date range', async () => {
      // Mock getBusinessDaysBetween to return 0 for invalid range
      const { getBusinessDaysBetween } = await import('../../../utils/dateHelpers');
      vi.mocked(getBusinessDaysBetween).mockReturnValueOnce(0);
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue(mockBalance);

      await expect(
        validateLeaveBalance(TEST_UUID, TEST_LEAVE_TYPE, '2024-01-05', '2024-01-01')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('checkOverlappingLeave', () => {
    it('should return empty array when no overlapping requests exist', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([mockLeaveRequest]);

      const result = await checkOverlappingLeave(TEST_UUID, '2024-02-01', '2024-02-05');

      expect(result).toEqual([]);
    });

    it('should return overlapping requests', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([mockLeaveRequest]);

      const result = await checkOverlappingLeave(TEST_UUID, '2024-01-18', '2024-01-22');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_UUID);
    });

    it('should exclude specified request ID', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([mockLeaveRequest]);

      const result = await checkOverlappingLeave(TEST_UUID, '2024-01-18', '2024-01-22', TEST_UUID);

      expect(result).toEqual([]);
    });

    it('should only check approved and pending requests', async () => {
      const deniedRequest = { ...mockLeaveRequest, status: 'denied' as const };
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([deniedRequest]);

      const result = await checkOverlappingLeave(TEST_UUID, '2024-01-18', '2024-01-22');

      expect(result).toEqual([]);
    });
  });

  describe('validateNoOverlappingLeave', () => {
    it('should pass when no overlapping requests exist', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([mockLeaveRequest]);

      await expect(
        validateNoOverlappingLeave(TEST_UUID, '2024-02-01', '2024-02-05')
      ).resolves.toBeUndefined();
    });

    it('should throw ValidationError when overlapping requests exist', async () => {
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([mockLeaveRequest]);

      await expect(
        validateNoOverlappingLeave(TEST_UUID, '2024-01-18', '2024-01-22')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateLeaveRequest', () => {
    it('should return validation details when all checks pass', async () => {
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue(mockBalance);
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([]);

      const result = await validateLeaveRequest(
        TEST_UUID,
        TEST_LEAVE_TYPE,
        '2024-01-01',
        '2024-01-05'
      );

      expect(result).toHaveProperty('requestedDays');
      expect(result).toHaveProperty('availableBalance', 15);
    });

    it('should throw when balance is insufficient', async () => {
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue({
        ...mockBalance,
        balance: 2,
      });
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([]);

      await expect(
        validateLeaveRequest(TEST_UUID, TEST_LEAVE_TYPE, '2024-01-01', '2024-01-10')
      ).rejects.toThrow(InsufficientLeaveBalanceError);
    });

    it('should throw when overlapping requests exist', async () => {
      vi.mocked(leaveBalancesService.getLeaveBalance).mockResolvedValue(mockBalance);
      vi.mocked(leaveRequestsService.getUserLeaveRequests).mockResolvedValue([mockLeaveRequest]);

      await expect(
        validateLeaveRequest(TEST_UUID, TEST_LEAVE_TYPE, '2024-01-18', '2024-01-22')
      ).rejects.toThrow(ValidationError);
    });
  });
});
