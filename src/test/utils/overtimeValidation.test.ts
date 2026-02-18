/**
 * Unit tests for Overtime Validation Utilities
 */

import { describe, it, expect } from 'vitest'
import {
  calculateHours,
  timesOverlap,
  checkDailyLimit,
  checkWeeklyLimit,
  checkOverlap,
  validateOvertimeRequest,
  checkShiftVerification
} from '../../utils/overtimeValidation'
import type { OvertimeRequest, OvertimeSettings, CreateOvertimeRequestInput } from '../../types/overtime'

const mockSettings: OvertimeSettings = {
  auto_approve: { enabled: false },
  max_daily_hours: { regular: 4, double: 4 },
  max_weekly_hours: { regular: 12, double: 12 },
  require_shift_verification: { enabled: true },
  approval_deadline_days: { days: 7 },
  pay_multipliers: { regular: 1.5, double: 2.0 }
}

describe('Overtime Validation Utilities', () => {
  describe('calculateHours', () => {
    it('should calculate hours correctly for same day', () => {
      expect(calculateHours('09:00:00', '17:00:00')).toBe(8)
      expect(calculateHours('14:30:00', '18:45:00')).toBeCloseTo(4.25, 2)
      expect(calculateHours('08:15:00', '12:30:00')).toBeCloseTo(4.25, 2)
    })

    it('should handle exact hour boundaries', () => {
      expect(calculateHours('09:00:00', '10:00:00')).toBe(1)
      expect(calculateHours('00:00:00', '23:59:59')).toBeCloseTo(24, 1)
    })

    it('should handle 15-minute increments', () => {
      expect(calculateHours('09:00:00', '09:15:00')).toBeCloseTo(0.25, 2)
      expect(calculateHours('09:00:00', '09:45:00')).toBeCloseTo(0.75, 2)
    })

    it('should return negative for end before start', () => {
      expect(calculateHours('17:00:00', '09:00:00')).toBeLessThan(0)
    })
  })

  describe('timesOverlap', () => {
    it('should detect overlapping ranges', () => {
      expect(timesOverlap('09:00:00', '13:00:00', '11:00:00', '15:00:00')).toBe(true)
      expect(timesOverlap('09:00:00', '13:00:00', '10:00:00', '12:00:00')).toBe(true)
      expect(timesOverlap('10:00:00', '12:00:00', '09:00:00', '13:00:00')).toBe(true)
    })

    it('should not detect non-overlapping ranges', () => {
      expect(timesOverlap('09:00:00', '13:00:00', '13:00:00', '17:00:00')).toBe(false)
      expect(timesOverlap('09:00:00', '13:00:00', '14:00:00', '18:00:00')).toBe(false)
      expect(timesOverlap('14:00:00', '18:00:00', '09:00:00', '13:00:00')).toBe(false)
    })

    it('should handle adjacent ranges', () => {
      expect(timesOverlap('09:00:00', '13:00:00', '13:00:00', '17:00:00')).toBe(false)
    })
  })

  describe('checkDailyLimit', () => {
    it('should allow requests within daily limit', () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '11:00:00',
        overtime_type: 'regular',
        reason: 'Test reason for overtime'
      }

      const result = checkDailyLimit(input, mockSettings, [])
      expect(result.exceeded).toBe(false)
      expect(result.remaining).toBe(4)
      expect(result.used).toBe(0)
    })

    it('should detect when daily limit would be exceeded', () => {
      const existingRequest: OvertimeRequest = {
        id: '1',
        requester_id: 'user1',
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '12:00:00',
        total_hours: 3,
        overtime_type: 'regular',
        reason: 'Existing overtime',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '14:00:00',
        end_time: '16:30:00',
        overtime_type: 'regular',
        reason: 'Additional overtime'
      }

      const result = checkDailyLimit(input, mockSettings, [existingRequest])
      expect(result.exceeded).toBe(true)
      expect(result.used).toBe(3)
    })

    it('should track different overtime types separately', () => {
      const existingRegular: OvertimeRequest = {
        id: '1',
        requester_id: 'user1',
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        total_hours: 4,
        overtime_type: 'regular',
        reason: 'Regular overtime',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '14:00:00',
        end_time: '16:00:00',
        overtime_type: 'double',
        reason: 'Double overtime'
      }

      const result = checkDailyLimit(input, mockSettings, [existingRegular])
      expect(result.exceeded).toBe(false)
      expect(result.used).toBe(0) // Different type
    })

    it('should only count active requests', () => {
      const cancelledRequest: OvertimeRequest = {
        id: '1',
        requester_id: 'user1',
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        total_hours: 4,
        overtime_type: 'regular',
        reason: 'Cancelled overtime',
        status: 'cancelled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '14:00:00',
        end_time: '18:00:00',
        overtime_type: 'regular',
        reason: 'New overtime'
      }

      const result = checkDailyLimit(input, mockSettings, [cancelledRequest])
      expect(result.exceeded).toBe(false)
      expect(result.used).toBe(0) // Cancelled not counted
    })
  })

  describe('checkWeeklyLimit', () => {
    it('should allow requests within weekly limit', () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Test reason'
      }

      const result = checkWeeklyLimit(input, mockSettings, [])
      expect(result.exceeded).toBe(false)
      expect(result.remaining).toBe(12)
    })

    it('should track weekly hours across multiple days', () => {
      const existingRequests: OvertimeRequest[] = [
        {
          id: '1',
          requester_id: 'user1',
          request_date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '13:00:00',
          total_hours: 4,
          overtime_type: 'regular',
          reason: 'Monday overtime',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          requester_id: 'user1',
          request_date: '2024-01-16',
          start_time: '09:00:00',
          end_time: '13:00:00',
          total_hours: 4,
          overtime_type: 'regular',
          reason: 'Tuesday overtime',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-17',
        start_time: '09:00:00',
        end_time: '14:00:00',
        overtime_type: 'regular',
        reason: 'Wednesday overtime'
      }

      const result = checkWeeklyLimit(input, mockSettings, existingRequests)
      expect(result.exceeded).toBe(true)
      expect(result.used).toBe(8)
    })
  })

  describe('checkOverlap', () => {
    it('should detect overlapping requests', () => {
      const existingRequest: OvertimeRequest = {
        id: '1',
        requester_id: 'user1',
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        total_hours: 4,
        overtime_type: 'regular',
        reason: 'Existing overtime',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '11:00:00',
        end_time: '15:00:00',
        overtime_type: 'regular',
        reason: 'Overlapping overtime'
      }

      const result = checkOverlap(input, [existingRequest])
      expect(result.overlapping).toBe(true)
      expect(result.overlappingRequest).toBeDefined()
    })

    it('should not detect overlap for different dates', () => {
      const existingRequest: OvertimeRequest = {
        id: '1',
        requester_id: 'user1',
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        total_hours: 4,
        overtime_type: 'regular',
        reason: 'Monday overtime',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-16',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Tuesday overtime'
      }

      const result = checkOverlap(input, [existingRequest])
      expect(result.overlapping).toBe(false)
    })
  })

  describe('validateOvertimeRequest', () => {
    it('should validate a correct request', () => {
      const input: CreateOvertimeRequestInput = {
        request_date: new Date().toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Valid overtime request for project work'
      }

      const result = validateOvertimeRequest(input, mockSettings, [])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const input: CreateOvertimeRequestInput = {
        request_date: futureDate.toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Future overtime request'
      }

      const result = validateOvertimeRequest(input, mockSettings, [])
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('future'))).toBe(true)
    })

    it('should reject dates beyond deadline', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)

      const input: CreateOvertimeRequestInput = {
        request_date: oldDate.toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Old overtime request'
      }

      const result = validateOvertimeRequest(input, mockSettings, [])
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('days in the past'))).toBe(true)
    })
  })

  describe('checkShiftVerification', () => {
    it('should warn when no shift found', () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '13:00:00',
        overtime_type: 'regular',
        reason: 'Test overtime'
      }

      const result = checkShiftVerification(input, null, mockSettings)
      expect(result.hasShift).toBe(false)
      expect(result.warning).toBeDefined()
    })

    it('should detect overtime outside shift hours', () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '18:00:00',
        end_time: '20:00:00',
        overtime_type: 'regular',
        reason: 'After shift overtime'
      }

      const shift = {
        shift_type: 'AM',
        start_time: '09:00:00',
        end_time: '17:00:00',
        date: '2024-01-15'
      }

      const result = checkShiftVerification(input, shift, mockSettings)
      expect(result.outsideShift).toBe(true)
      expect(result.warning).toBeDefined()
    })

    it('should allow overtime during shift hours', () => {
      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '10:00:00',
        end_time: '12:00:00',
        overtime_type: 'regular',
        reason: 'During shift overtime'
      }

      const shift = {
        shift_type: 'AM',
        start_time: '09:00:00',
        end_time: '17:00:00',
        date: '2024-01-15'
      }

      const result = checkShiftVerification(input, shift, mockSettings)
      expect(result.outsideShift).toBe(false)
      expect(result.warning).toBeUndefined()
    })

    it('should skip verification when disabled', () => {
      const settingsDisabled = {
        ...mockSettings,
        require_shift_verification: { enabled: false }
      }

      const input: CreateOvertimeRequestInput = {
        request_date: '2024-01-15',
        start_time: '18:00:00',
        end_time: '20:00:00',
        overtime_type: 'regular',
        reason: 'After shift overtime'
      }

      const shift = {
        shift_type: 'AM',
        start_time: '09:00:00',
        end_time: '17:00:00',
        date: '2024-01-15'
      }

      const result = checkShiftVerification(input, shift, settingsDisabled)
      expect(result.outsideShift).toBe(false)
    })
  })
})
