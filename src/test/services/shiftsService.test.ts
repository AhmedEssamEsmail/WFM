import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shiftsService } from '../../services/shiftsService'
import { supabase } from '../../lib/supabase'
import type { Shift } from '../../types'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000'

const mockShift: Shift = {
  id: TEST_UUID,
  user_id: TEST_UUID,
  date: '2024-01-01',
  shift_type: 'morning',
  start_time: '09:00',
  end_time: '17:00',
  created_at: '2024-01-01T00:00:00Z',
}

describe('shiftsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getShifts', () => {
    it('should fetch all shifts', async () => {
      const mockData = [mockShift]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any)

      const result = await shiftsService.getShifts()

      expect(result).toEqual(mockData)
      expect(supabase.from).toHaveBeenCalledWith('shifts')
    })

    it('should filter by start date', async () => {
      const mockData = [mockShift]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await shiftsService.getShifts('2024-01-01')

      expect(result).toEqual(mockData)
    })

    it('should filter by date range', async () => {
      const mockData = [mockShift]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await shiftsService.getShifts('2024-01-01', '2024-01-31')

      expect(result).toEqual(mockData)
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

      await expect(shiftsService.getShifts()).rejects.toThrow('Database error')
    })
  })

  describe('getUserShifts', () => {
    it('should fetch shifts for a specific user', async () => {
      const mockData = [mockShift]

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

      const result = await shiftsService.getUserShifts(TEST_UUID)

      expect(result).toEqual(mockData)
    })

    it('should filter user shifts by date range', async () => {
      const mockData = [mockShift]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockData,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any)

      const result = await shiftsService.getUserShifts(TEST_UUID, '2024-01-01', '2024-01-31')

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

      await expect(shiftsService.getUserShifts(TEST_UUID)).rejects.toThrow('Database error')
    })
  })

  describe('getShiftById', () => {
    it('should fetch shift by ID', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockShift,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await shiftsService.getShiftById(TEST_UUID)

      expect(result).toEqual(mockShift)
    })

    it('should throw error when shift not found', async () => {
      const mockError = new Error('Shift not found')

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

      await expect(shiftsService.getShiftById(TEST_UUID)).rejects.toThrow('Shift not found')
    })
  })

  describe('createShift', () => {
    it('should create a new shift', async () => {
      const newShift = {
        user_id: TEST_UUID,
        date: '2024-01-02',
        shift_type: 'evening',
        start_time: '14:00',
        end_time: '22:00',
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockShift, ...newShift },
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await shiftsService.createShift(newShift)

      expect(result.shift_type).toBe('evening')
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any)

      await expect(
        shiftsService.createShift({
          user_id: TEST_UUID,
          date: '2024-01-02',
          shift_type: 'evening',
          start_time: '14:00',
          end_time: '22:00',
        })
      ).rejects.toThrow('Creation failed')
    })
  })

  describe('updateShift', () => {
    it('should update shift successfully', async () => {
      const updates = { shift_type: 'night' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockShift, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await shiftsService.updateShift(TEST_UUID, updates)

      expect(result.shift_type).toBe('night')
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')

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
      } as any)

      await expect(shiftsService.updateShift(TEST_UUID, { shift_type: 'night' })).rejects.toThrow(
        'Update failed'
      )
    })
  })

  describe('deleteShift', () => {
    it('should delete shift successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any)

      await expect(shiftsService.deleteShift(TEST_UUID)).resolves.toBeUndefined()
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed')

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any)

      await expect(shiftsService.deleteShift(TEST_UUID)).rejects.toThrow('Deletion failed')
    })
  })

  describe('bulkCreateShifts', () => {
    it('should bulk create shifts successfully', async () => {
      const shifts = [
        { ...mockShift, id: undefined, created_at: undefined },
        { ...mockShift, id: undefined, created_at: undefined, date: '2024-01-02' },
      ]
      const mockData = shifts.map((s, i) => ({ ...s, id: `uuid-${i}` }))

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any)

      const result = await shiftsService.bulkCreateShifts(shifts as any)

      expect(result).toHaveLength(2)
    })

    it('should throw error when bulk creation fails', async () => {
      const mockError = new Error('Bulk creation failed')

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any)

      await expect(shiftsService.bulkCreateShifts([mockShift as any])).rejects.toThrow(
        'Bulk creation failed'
      )
    })
  })

  describe('bulkUpsertShifts', () => {
    it('should bulk upsert shifts successfully', async () => {
      const shifts = [
        { ...mockShift, id: undefined, created_at: undefined },
        { ...mockShift, id: undefined, created_at: undefined, date: '2024-01-02' },
      ]
      const mockData = shifts.map((s, i) => ({ ...s, id: `uuid-${i}` }))

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any)

      const result = await shiftsService.bulkUpsertShifts(shifts as any)

      expect(result).toHaveLength(2)
    })

    it('should throw error when bulk upsert fails', async () => {
      const mockError = new Error('Bulk upsert failed')

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any)

      await expect(shiftsService.bulkUpsertShifts([mockShift as any])).rejects.toThrow(
        'Bulk upsert failed'
      )
    })
  })
})
