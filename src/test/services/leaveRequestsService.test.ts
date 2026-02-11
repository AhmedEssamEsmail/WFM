import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leaveRequestsService } from '../../services/leaveRequestsService'
import { supabase } from '../../lib/supabase'
import {
  ConcurrencyError,
  ResourceNotFoundError,
} from '../../types/errors'
import type { LeaveRequest, LeaveRequestStatus } from '../../types'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

// Mock validation module
vi.mock('../../services/validation/leaveBalanceValidation', () => ({
  validateLeaveRequest: vi.fn(),
}))

// Mock dateHelpers
vi.mock('../../utils/dateHelpers', () => ({
  getBusinessDaysBetween: vi.fn().mockReturnValue(5),
}))

// Test UUIDs
const TEST_UUID_1 = '123e4567-e89b-12d3-a456-426614174000'
const TEST_UUID_2 = '123e4567-e89b-12d3-a456-426614174001'
const TEST_UUID_3 = '123e4567-e89b-12d3-a456-426614174002'

describe('leaveRequestsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLeaveRequests', () => {
    it('should fetch all leave requests successfully', async () => {
      const mockData = [
        {
          id: TEST_UUID_1,
          user_id: TEST_UUID_2,
          leave_type: 'annual',
          status: 'pending_tl',
        },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any)

      const result = await leaveRequestsService.getLeaveRequests()

      expect(result).toEqual(mockData)
      expect(supabase.from).toHaveBeenCalledWith('leave_requests')
    })

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any)

      await expect(leaveRequestsService.getLeaveRequests()).rejects.toThrow('Database error')
    })
  })

  describe('getLeaveRequestsPaginated', () => {
    it('should fetch paginated leave requests', async () => {
      const mockData = [
        { id: TEST_UUID_1, created_at: '2024-01-01T00:00:00Z' },
        { id: TEST_UUID_2, created_at: '2024-01-02T00:00:00Z' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.getLeaveRequestsPaginated()

      expect(result.data).toEqual(mockData)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeUndefined()
    })

    it('should handle cursor-based pagination', async () => {
      const mockData = [
        { id: TEST_UUID_1, created_at: '2024-01-01T00:00:00Z' },
        { id: TEST_UUID_2, created_at: '2024-01-02T00:00:00Z' },
        { id: TEST_UUID_3, created_at: '2024-01-03T00:00:00Z' },
      ]

      const ltMock = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lt: ltMock,
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.getLeaveRequestsPaginated('2024-01-05T00:00:00Z', 2)

      expect(ltMock).toHaveBeenCalledWith('created_at', '2024-01-05T00:00:00Z')
      expect(result.data).toHaveLength(2)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBe('2024-01-02T00:00:00Z')
    })

    it('should cap limit at maximum page size', async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any)

      await leaveRequestsService.getLeaveRequestsPaginated(undefined, 1000)

      // Should cap at 100 + 1 for hasMore check
      expect(limitMock).toHaveBeenCalledWith(101)
    })
  })

  describe('getLeaveRequestById', () => {
    it('should fetch leave request by ID', async () => {
      const mockData = {
        id: TEST_UUID_1,
        user_id: TEST_UUID_2,
        status: 'pending_tl',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.getLeaveRequestById(TEST_UUID_1)

      expect(result).toEqual(mockData)
    })

    it('should throw error when leave request not found', async () => {
      const mockError = new Error('Not found')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any)

      await expect(leaveRequestsService.getLeaveRequestById(TEST_UUID_1)).rejects.toThrow('Not found')
    })
  })

  describe('createLeaveRequest', () => {
    it('should create leave request with valid data', async () => {
      const mockRequest = {
        user_id: TEST_UUID_1,
        leave_type: 'annual',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        notes: 'Test notes',
      }

      const mockCreatedRequest = {
        ...mockRequest,
        id: TEST_UUID_2,
        status: 'pending_tl',
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.createLeaveRequest(mockRequest)

      expect(result).toEqual(mockCreatedRequest)
    })

    it('should sanitize notes before creating', async () => {
      const mockRequest = {
        user_id: TEST_UUID_1,
        leave_type: 'annual',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        notes: '<script>alert("xss")</script>Test notes',
      }

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockRequest, id: TEST_UUID_2 },
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
      } as any)

      await leaveRequestsService.createLeaveRequest(mockRequest)

      // Verify sanitization occurred (script tags removed)
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.not.stringContaining('<script>'),
        })
      )
    })

    it('should throw error when notes exceed 1000 characters', async () => {
      const mockRequest = {
        user_id: TEST_UUID_1,
        leave_type: 'annual',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        notes: 'a'.repeat(1001),
      }

      await expect(leaveRequestsService.createLeaveRequest(mockRequest)).rejects.toThrow(
        'Notes must not exceed 1000 characters'
      )
    })

    it('should handle null notes', async () => {
      const mockRequest = {
        user_id: TEST_UUID_1,
        leave_type: 'annual',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        notes: null,
      }

      const mockCreatedRequest = {
        ...mockRequest,
        id: TEST_UUID_2,
        status: 'pending_tl',
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.createLeaveRequest(mockRequest as any)

      expect(result).toEqual(mockCreatedRequest)
    })
  })

  describe('updateLeaveRequestStatus', () => {
    it('should update status without optimistic locking', async () => {
      const mockUpdated = {
        id: TEST_UUID_1,
        status: 'pending_wfm',
      }

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
      } as any)

      const result = await leaveRequestsService.updateLeaveRequestStatus(TEST_UUID_1, 'pending_wfm')

      expect(result).toEqual(mockUpdated)
    })

    it('should update status with optimistic locking', async () => {
      const mockCurrent = { status: 'pending_tl' }
      const mockUpdated = {
        id: TEST_UUID_1,
        status: 'pending_wfm',
      }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const callCount = vi.mocked(supabase.from).mock.calls.length
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
          } as any
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
        } as any
      })

      const result = await leaveRequestsService.updateLeaveRequestStatus(
        TEST_UUID_1,
        'pending_wfm',
        undefined,
        'pending_tl'
      )

      expect(result).toEqual(mockUpdated)
    })

    it('should throw ConcurrencyError when status mismatch', async () => {
      const mockCurrent = { status: 'pending_wfm' }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCurrent,
              error: null,
            }),
          }),
        }),
      } as any)

      await expect(
        leaveRequestsService.updateLeaveRequestStatus(
          TEST_UUID_1,
          'approved',
          undefined,
          'pending_tl' // Expected status doesn't match
        )
      ).rejects.toThrow(ConcurrencyError)
    })

    it('should throw ResourceNotFoundError when request not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any)

      await expect(
        leaveRequestsService.updateLeaveRequestStatus(
          TEST_UUID_1,
          'approved',
          undefined,
          'pending_tl'
        )
      ).rejects.toThrow(ResourceNotFoundError)
    })

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
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as any)

      await leaveRequestsService.updateLeaveRequestStatus(TEST_UUID_1, 'pending_wfm', 'tl_approved_at')

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending_wfm',
          tl_approved_at: expect.any(String),
        })
      )
    })

    it('should throw ConcurrencyError when update fails due to status mismatch', async () => {
      const mockCurrent = { status: 'pending_tl' }

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const callCount = vi.mocked(supabase.from).mock.calls.length
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
          } as any
        }
        // Second call: update fails due to status mismatch
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        } as any
      })

      await expect(
        leaveRequestsService.updateLeaveRequestStatus(
          TEST_UUID_1,
          'approved',
          undefined,
          'pending_tl'
        )
      ).rejects.toThrow(ConcurrencyError)
    })
  })

  describe('deleteLeaveRequest', () => {
    it('should delete leave request successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await expect(leaveRequestsService.deleteLeaveRequest(TEST_UUID_1)).resolves.toBeUndefined()
    })

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed')

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: mockError,
          }),
        }),
      } as any)

      await expect(leaveRequestsService.deleteLeaveRequest(TEST_UUID_1)).rejects.toThrow('Delete failed')
    })
  })

  describe('getUserLeaveRequests', () => {
    it('should fetch user leave requests', async () => {
      const mockData = [
        { id: TEST_UUID_1, user_id: TEST_UUID_2 },
        { id: TEST_UUID_3, user_id: TEST_UUID_2 },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.getUserLeaveRequests(TEST_UUID_2)

      expect(result).toEqual(mockData)
    })

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any)

      await expect(leaveRequestsService.getUserLeaveRequests(TEST_UUID_2)).rejects.toThrow('Database error')
    })
  })

  describe('getPendingLeaveRequests', () => {
    it('should fetch all pending requests when no status provided', async () => {
      const mockData = [
        { id: TEST_UUID_1, status: 'pending_tl' },
        { id: TEST_UUID_2, status: 'pending_wfm' },
      ]

      const inMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: inMock,
        }),
      } as any)

      const result = await leaveRequestsService.getPendingLeaveRequests()

      expect(result).toEqual(mockData)
      expect(inMock).toHaveBeenCalledWith('status', ['pending_tl', 'pending_wfm'])
    })

    it('should fetch requests with specific status', async () => {
      const mockData = [{ id: TEST_UUID_1, status: 'pending_tl' }]

      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any)

      const result = await leaveRequestsService.getPendingLeaveRequests('pending_tl')

      expect(result).toEqual(mockData)
      expect(eqMock).toHaveBeenCalledWith('status', 'pending_tl')
    })

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any)

      await expect(leaveRequestsService.getPendingLeaveRequests()).rejects.toThrow('Database error')
    })
  })

  describe('getLeaveRequestsByDateRange', () => {
    it('should fetch leave requests by date range', async () => {
      const mockData = [
        { id: TEST_UUID_1, start_date: '2024-01-01', end_date: '2024-01-05' },
        { id: TEST_UUID_2, start_date: '2024-01-10', end_date: '2024-01-15' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await leaveRequestsService.getLeaveRequestsByDateRange('2024-01-01', '2024-01-31')

      expect(result).toEqual(mockData)
    })

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error')

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any)

      await expect(
        leaveRequestsService.getLeaveRequestsByDateRange('2024-01-01', '2024-01-31')
      ).rejects.toThrow('Database error')
    })
  })
})
