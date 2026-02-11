import { describe, it, expect } from 'vitest'
import {
  validateBreakOrdering,
  validateBreakTiming,
} from '../../lib/breakValidation'

describe('breakValidation', () => {
  describe('validateBreakOrdering', () => {
    it('should validate correct break order HB1 -> B -> HB2', () => {
      const intervals = [
        { interval_start: '10:00:00', break_type: 'HB1' as const },
        { interval_start: '12:00:00', break_type: 'B' as const },
        { interval_start: '14:00:00', break_type: 'HB2' as const },
      ]
      const result = validateBreakOrdering(intervals)
      expect(result).toBeNull()
    })

    it('should reject breaks out of order', () => {
      const intervals = [
        { interval_start: '14:00:00', break_type: 'HB1' as const },
        { interval_start: '12:00:00', break_type: 'B' as const },
        { interval_start: '10:00:00', break_type: 'HB2' as const },
      ]
      const result = validateBreakOrdering(intervals)
      expect(result).not.toBeNull()
    })

    it('should allow partial breaks', () => {
      const intervals = [
        { interval_start: '10:00:00', break_type: 'HB1' as const },
      ]
      const result = validateBreakOrdering(intervals)
      expect(result).toBeNull()
    })

    it('should reject B before HB1', () => {
      const intervals = [
        { interval_start: '10:00:00', break_type: 'B' as const },
        { interval_start: '12:00:00', break_type: 'HB1' as const },
      ]
      const result = validateBreakOrdering(intervals)
      expect(result).not.toBeNull()
    })
  })

  describe('validateBreakTiming', () => {
    it('should validate breaks with 90-270 minute gaps', () => {
      const intervals = [
        { interval_start: '09:00:00', break_type: 'HB1' as const },
        { interval_start: '11:00:00', break_type: 'B' as const }, // 120 minutes
        { interval_start: '13:30:00', break_type: 'HB2' as const }, // 150 minutes
      ]
      const result = validateBreakTiming(intervals, 90, 270)
      expect(result).toHaveLength(0)
    })

    it('should reject breaks too close together', () => {
      const intervals = [
        { interval_start: '09:00:00', break_type: 'HB1' as const },
        { interval_start: '09:30:00', break_type: 'B' as const }, // 30 minutes - too close
      ]
      const result = validateBreakTiming(intervals, 90, 270)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should reject breaks too far apart', () => {
      const intervals = [
        { interval_start: '09:00:00', break_type: 'HB1' as const },
        { interval_start: '14:00:00', break_type: 'B' as const }, // 300 minutes - too far
      ]
      const result = validateBreakTiming(intervals, 90, 270)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // Note: validateShiftBoundary, validateAgainstRules, and getRuleViolations
  // are now async and require database access, so they're tested in integration tests
})
