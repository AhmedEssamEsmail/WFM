import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leaveTypesService } from '../../services/leaveTypesService';
import { supabase } from '../../lib/supabase';
import type { LeaveTypeConfig, LeaveType } from '../../types';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';

const mockLeaveType: LeaveTypeConfig = {
  id: TEST_UUID,
  code: 'annual' as LeaveType,
  name: 'Annual Leave',
  description: 'Annual vacation leave',
  is_active: true,
  display_order: 1,
  created_at: '2024-01-01T00:00:00Z',
};

describe('leaveTypesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveLeaveTypes', () => {
    it('should fetch all active leave types', async () => {
      const mockData = [mockLeaveType];

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

      const result = await leaveTypesService.getActiveLeaveTypes();

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('leave_types');
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

      await expect(leaveTypesService.getActiveLeaveTypes()).rejects.toThrow('Database error');
    });
  });

  describe('getAllLeaveTypes', () => {
    it('should fetch all leave types including inactive', async () => {
      const mockData = [mockLeaveType, { ...mockLeaveType, is_active: false }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any);

      const result = await leaveTypesService.getAllLeaveTypes();

      expect(result).toHaveLength(2);
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(leaveTypesService.getAllLeaveTypes()).rejects.toThrow('Database error');
    });
  });

  describe('getLeaveTypeByCode', () => {
    it('should fetch leave type by code', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLeaveType,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await leaveTypesService.getLeaveTypeByCode('annual');

      expect(result).toEqual(mockLeaveType);
    });

    it('should return null when leave type not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      const result = await leaveTypesService.getLeaveTypeByCode('annual');

      expect(result).toBeNull();
    });

    it('should throw error for other errors', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(leaveTypesService.getLeaveTypeByCode('annual')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createLeaveType', () => {
    it('should create a new leave type', async () => {
      const newLeaveType = {
        code: 'sick' as LeaveType,
        name: 'Sick Leave',
        description: 'Medical leave',
        is_active: true,
        display_order: 2,
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockLeaveType, ...newLeaveType },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await leaveTypesService.createLeaveType(newLeaveType);

      expect(result.code).toBe('sick');
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        leaveTypesService.createLeaveType({
          code: 'sick' as LeaveType,
          name: 'Sick Leave',
          description: 'Medical leave',
          is_active: true,
          display_order: 2,
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('updateLeaveType', () => {
    it('should update leave type successfully', async () => {
      const updates = { name: 'Updated Name' };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockLeaveType, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await leaveTypesService.updateLeaveType(TEST_UUID, updates);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      await expect(leaveTypesService.updateLeaveType(TEST_UUID, { name: 'New' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deactivateLeaveType', () => {
    it('should deactivate leave type successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await expect(leaveTypesService.deactivateLeaveType(TEST_UUID)).resolves.toBeUndefined();
    });

    it('should throw error when deactivation fails', async () => {
      const mockError = new Error('Deactivation failed');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(leaveTypesService.deactivateLeaveType(TEST_UUID)).rejects.toThrow(
        'Deactivation failed'
      );
    });
  });

  describe('getDefaultLeaveBalances', () => {
    it('should return default balances for all active leave types', async () => {
      const mockLeaveTypes = [
        { ...mockLeaveType, code: 'annual' as LeaveType },
        { ...mockLeaveType, code: 'sick' as LeaveType, id: '223e4567-e89b-12d3-a456-426614174000' },
        {
          ...mockLeaveType,
          code: 'emergency' as LeaveType,
          id: '323e4567-e89b-12d3-a456-426614174000',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLeaveTypes,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await leaveTypesService.getDefaultLeaveBalances();

      expect(result).toEqual({
        annual: 0,
        sick: 0,
        emergency: 0,
      });
    });

    it('should return empty object when no active leave types exist', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await leaveTypesService.getDefaultLeaveBalances();

      expect(result).toEqual({});
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

      await expect(leaveTypesService.getDefaultLeaveBalances()).rejects.toThrow('Database error');
    });
  });
});
