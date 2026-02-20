import { describe, it, expect, beforeEach, vi } from 'vitest';
import { swapRequestsService } from '../../services/swapRequestsService';
import { supabase } from '../../lib/supabase';
import {
  ValidationError,
  ConcurrencyError,
  ResourceNotFoundError,
  SwapExecutionError,
} from '../../types/errors';
import type { SwapRequest, SwapRequestStatus } from '../../types';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Test UUIDs
const TEST_UUID_1 = '123e4567-e89b-12d3-a456-426614174000';
const TEST_UUID_2 = '123e4567-e89b-12d3-a456-426614174001';
const TEST_UUID_3 = '123e4567-e89b-12d3-a456-426614174002';
const TEST_UUID_4 = '123e4567-e89b-12d3-a456-426614174003';
const TEST_UUID_5 = '123e4567-e89b-12d3-a456-426614174004';

describe('swapRequestsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSwapRequests', () => {
    it('should fetch all swap requests successfully', async () => {
      const mockData = [
        {
          id: TEST_UUID_1,
          requester_id: TEST_UUID_2,
          target_user_id: TEST_UUID_3,
          status: 'pending_acceptance',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any);

      const result = await swapRequestsService.getSwapRequests();

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('swap_requests');
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

      await expect(swapRequestsService.getSwapRequests()).rejects.toThrow('Database error');
    });
  });

  describe('getSwapRequestsPaginated', () => {
    it('should fetch paginated swap requests', async () => {
      const mockData = [
        { id: TEST_UUID_1, created_at: '2024-01-01T00:00:00Z' },
        { id: TEST_UUID_2, created_at: '2024-01-02T00:00:00Z' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await swapRequestsService.getSwapRequestsPaginated();

      expect(result.data).toEqual(mockData);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle cursor-based pagination', async () => {
      const mockData = [
        { id: TEST_UUID_1, created_at: '2024-01-01T00:00:00Z' },
        { id: TEST_UUID_2, created_at: '2024-01-02T00:00:00Z' },
        { id: TEST_UUID_3, created_at: '2024-01-03T00:00:00Z' },
      ];

      const ltMock = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lt: ltMock,
            }),
          }),
        }),
      } as any);

      const result = await swapRequestsService.getSwapRequestsPaginated('2024-01-05T00:00:00Z', 2);

      expect(ltMock).toHaveBeenCalledWith('created_at', '2024-01-05T00:00:00Z');
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('2024-01-02T00:00:00Z');
    });

    it('should cap limit at maximum page size', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any);

      await swapRequestsService.getSwapRequestsPaginated(undefined, 1000);

      // Should cap at 100 + 1 for hasMore check
      expect(limitMock).toHaveBeenCalledWith(101);
    });
  });

  describe('getSwapRequestById', () => {
    it('should fetch swap request by ID', async () => {
      const mockData = {
        id: TEST_UUID_1,
        requester_id: TEST_UUID_2,
        status: 'pending_acceptance',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await swapRequestsService.getSwapRequestById(TEST_UUID_1);

      expect(result).toEqual(mockData);
    });

    it('should throw error when swap request not found', async () => {
      const mockError = new Error('Not found');

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

      await expect(swapRequestsService.getSwapRequestById(TEST_UUID_1)).rejects.toThrow(
        'Not found'
      );
    });
  });

  describe('createSwapRequest', () => {
    it('should create swap request with valid data', async () => {
      const mockRequest = {
        requester_id: TEST_UUID_1,
        target_user_id: TEST_UUID_2,
        requester_shift_id: TEST_UUID_3,
        target_shift_id: TEST_UUID_4,
        reason: 'Test reason',
      };

      const mockRequesterShift = {
        id: TEST_UUID_3,
        user_id: TEST_UUID_1,
        date: '2024-01-01',
        shift_type: 'morning',
      };

      const mockTargetShift = {
        id: TEST_UUID_4,
        user_id: TEST_UUID_2,
        date: '2024-01-02',
        shift_type: 'evening',
      };

      const mockCreatedRequest = {
        ...mockRequest,
        id: TEST_UUID_5,
        status: 'pending_acceptance',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock shift validation queries
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() => {
                  const callCount = vi
                    .mocked(supabase.from)
                    .mock.calls.filter((call) => call[0] === 'shifts').length;
                  if (callCount === 1) {
                    return Promise.resolve({ data: mockRequesterShift, error: null });
                  }
                  return Promise.resolve({ data: mockTargetShift, error: null });
                }),
              }),
            }),
          } as any;
        }
        // Mock insert for swap_requests
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCreatedRequest,
                error: null,
              }),
            }),
          }),
        } as any;
      });

      const result = await swapRequestsService.createSwapRequest(mockRequest);

      expect(result).toEqual(mockCreatedRequest);
    });

    it('should throw ValidationError when requester shift not found', async () => {
      const mockRequest = {
        requester_id: TEST_UUID_1,
        target_user_id: TEST_UUID_2,
        requester_shift_id: TEST_UUID_3,
        target_shift_id: TEST_UUID_4,
        reason: 'Test reason',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      } as any);

      await expect(swapRequestsService.createSwapRequest(mockRequest)).rejects.toThrow(
        ResourceNotFoundError
      );
    });

    it('should throw ValidationError when shift ownership is invalid', async () => {
      const mockRequest = {
        requester_id: TEST_UUID_1,
        target_user_id: TEST_UUID_2,
        requester_shift_id: TEST_UUID_3,
        target_shift_id: TEST_UUID_4,
        reason: 'Test reason',
      };

      const mockRequesterShift = {
        id: TEST_UUID_3,
        user_id: TEST_UUID_5, // Wrong owner
        date: '2024-01-01',
        shift_type: 'morning',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRequesterShift,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(swapRequestsService.createSwapRequest(mockRequest)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('updateSwapRequestStatus', () => {
    it('should update status without optimistic locking', async () => {
      const mockUpdated = {
        id: TEST_UUID_1,
        status: 'pending_tl',
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdated,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await swapRequestsService.updateSwapRequestStatus(TEST_UUID_1, 'pending_tl');

      expect(result).toEqual(mockUpdated);
    });

    it('should update status with optimistic locking', async () => {
      const mockCurrent = { status: 'pending_acceptance' };
      const mockUpdated = {
        id: TEST_UUID_1,
        status: 'pending_tl',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const callCount = vi.mocked(supabase.from).mock.calls.length;
        if (callCount === 1) {
          // First call: fetch current status
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCurrent,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        // Second call: update
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdated,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        } as any;
      });

      const result = await swapRequestsService.updateSwapRequestStatus(
        TEST_UUID_1,
        'pending_tl',
        undefined,
        'pending_acceptance'
      );

      expect(result).toEqual(mockUpdated);
    });

    it('should throw ConcurrencyError when status mismatch', async () => {
      const mockCurrent = { status: 'pending_tl' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCurrent,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(
        swapRequestsService.updateSwapRequestStatus(
          TEST_UUID_1,
          'approved',
          undefined,
          'pending_acceptance' // Expected status doesn't match
        )
      ).rejects.toThrow(ConcurrencyError);
    });

    it('should set approval timestamp when provided', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: TEST_UUID_1, status: 'pending_wfm', tl_approved_at: expect.any(String) },
              error: null,
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as any);

      await swapRequestsService.updateSwapRequestStatus(
        TEST_UUID_1,
        'pending_wfm',
        'tl_approved_at'
      );

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending_wfm',
          tl_approved_at: expect.any(String),
        })
      );
    });
  });

  describe('deleteSwapRequest', () => {
    it('should delete swap request successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      await expect(swapRequestsService.deleteSwapRequest(TEST_UUID_1)).resolves.toBeUndefined();
    });

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed');

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: mockError,
          }),
        }),
      } as any);

      await expect(swapRequestsService.deleteSwapRequest(TEST_UUID_1)).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('getUserSwapRequests', () => {
    it('should fetch user swap requests', async () => {
      const mockData = [
        { id: TEST_UUID_1, requester_id: TEST_UUID_2 },
        { id: TEST_UUID_3, target_user_id: TEST_UUID_2 },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await swapRequestsService.getUserSwapRequests(TEST_UUID_2);

      expect(result).toEqual(mockData);
    });
  });

  describe('getPendingSwapRequests', () => {
    it('should fetch all pending requests when no status provided', async () => {
      const mockData = [
        { id: TEST_UUID_1, status: 'pending_acceptance' },
        { id: TEST_UUID_2, status: 'pending_tl' },
      ];

      const inMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: inMock,
        }),
      } as any);

      const result = await swapRequestsService.getPendingSwapRequests();

      expect(result).toEqual(mockData);
      expect(inMock).toHaveBeenCalledWith('status', [
        'pending_acceptance',
        'pending_tl',
        'pending_wfm',
      ]);
    });

    it('should fetch requests with specific status', async () => {
      const mockData = [{ id: TEST_UUID_1, status: 'pending_tl' }];

      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any);

      const result = await swapRequestsService.getPendingSwapRequests('pending_tl');

      expect(result).toEqual(mockData);
      expect(eqMock).toHaveBeenCalledWith('status', 'pending_tl');
    });
  });

  describe('clearApprovalTimestamps', () => {
    it('should clear approval timestamps', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      await expect(
        swapRequestsService.clearApprovalTimestamps(TEST_UUID_1)
      ).resolves.toBeUndefined();
    });

    it('should throw error when clear fails', async () => {
      const mockError = new Error('Update failed');

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: mockError,
          }),
        }),
      } as any);

      await expect(swapRequestsService.clearApprovalTimestamps(TEST_UUID_1)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('executeSwap', () => {
    it('should throw ValidationError when swap request is not approved', async () => {
      const mockRequest = {
        id: TEST_UUID_1,
        status: 'pending_tl' as SwapRequestStatus,
        requester_id: TEST_UUID_2,
        target_user_id: TEST_UUID_3,
        requester_shift_id: TEST_UUID_4,
        target_shift_id: TEST_UUID_5,
      } as SwapRequest;

      await expect(swapRequestsService.executeSwap(mockRequest)).rejects.toThrow(ValidationError);
    });

    it('should execute swap successfully', async () => {
      const mockRequest = {
        id: TEST_UUID_1,
        status: 'approved' as SwapRequestStatus,
        requester_id: TEST_UUID_2,
        target_user_id: TEST_UUID_3,
        requester_shift_id: TEST_UUID_4,
        target_shift_id: TEST_UUID_5,
      } as SwapRequest;

      const mockRequesterShift = { date: '2024-01-01' };
      const mockTargetShift = { date: '2024-01-02' };
      const mockResult = { success: true, message: 'Swap executed' };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          const callCount = vi
            .mocked(supabase.from)
            .mock.calls.filter((call) => call[0] === 'shifts').length;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: callCount === 1 ? mockRequesterShift : mockTargetShift,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResult,
        error: null,
      } as any);

      const result = await swapRequestsService.executeSwap(mockRequest);

      expect(result).toEqual(mockResult);
      expect(supabase.rpc).toHaveBeenCalledWith('execute_shift_swap', {
        p_requester_id: TEST_UUID_2,
        p_target_user_id: TEST_UUID_3,
        p_requester_date: '2024-01-01',
        p_target_date: '2024-01-02',
      });
    });

    it('should throw SwapExecutionError when requester shift not found', async () => {
      const mockRequest = {
        id: TEST_UUID_1,
        status: 'approved' as SwapRequestStatus,
        requester_id: TEST_UUID_2,
        target_user_id: TEST_UUID_3,
        requester_shift_id: TEST_UUID_4,
        target_shift_id: TEST_UUID_5,
      } as SwapRequest;

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      } as any);

      await expect(swapRequestsService.executeSwap(mockRequest)).rejects.toThrow(
        SwapExecutionError
      );
    });

    it('should throw SwapExecutionError when stored procedure fails', async () => {
      const mockRequest = {
        id: TEST_UUID_1,
        status: 'approved' as SwapRequestStatus,
        requester_id: TEST_UUID_2,
        target_user_id: TEST_UUID_3,
        requester_shift_id: TEST_UUID_4,
        target_shift_id: TEST_UUID_5,
      } as SwapRequest;

      const mockRequesterShift = { date: '2024-01-01' };
      const mockTargetShift = { date: '2024-01-02' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRequesterShift,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed', code: 'P0001' },
      } as any);

      await expect(swapRequestsService.executeSwap(mockRequest)).rejects.toThrow(
        SwapExecutionError
      );
    });

    it('should throw SwapExecutionError when stored procedure returns error', async () => {
      const mockRequest = {
        id: TEST_UUID_1,
        status: 'approved' as SwapRequestStatus,
        requester_id: TEST_UUID_2,
        target_user_id: TEST_UUID_3,
        requester_shift_id: TEST_UUID_4,
        target_shift_id: TEST_UUID_5,
      } as SwapRequest;

      const mockRequesterShift = { date: '2024-01-01' };
      const mockTargetShift = { date: '2024-01-02' };
      const mockResult = { success: false, error: 'Swap failed', error_code: 'SWAP_ERROR' };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shifts') {
          const callCount = vi
            .mocked(supabase.from)
            .mock.calls.filter((call) => call[0] === 'shifts').length;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: callCount === 1 ? mockRequesterShift : mockTargetShift,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResult,
        error: null,
      } as any);

      await expect(swapRequestsService.executeSwap(mockRequest)).rejects.toThrow(
        SwapExecutionError
      );
    });
  });
});
