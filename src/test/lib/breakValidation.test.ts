import { describe, it, expect } from 'vitest'
import {
  validateBreakOrdering,
  validateBreakTiming,
  validateShiftBoundary,
  validateAgainstRules,
  getRuleViolations,
} from '../../lib/breakValidation'
import type { BreakScheduleRule } from '../../types'

describe('breakValidation', () => {
  describe('validateBreakOrdering', () => {
    it('should validate correct break order HB1 -> B -> HB2', () => {
      const breaks = {
        HB1: '10:00:00',
        B: '12:00:00',
        HB2: '14:00:00',
      }
      const result = validateBreakOrdering(breaks)
      expect(result.valid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should reject breaks out of order', () => {
      const breaks = {
        HB1: '14:00:00',
        B: '12:00:00',
        HB2: '10:00:00',
      }
      const result = validateBreakOrdering(breaks)
      expect(result.valid).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
    })

    it('should allow partial breaks', () => {
      const breaks = {
        HB1: '10:00:00',
        B: null,
        HB2: null,
      }
      const result = validateBreakOrdering(breaks)
      expect(result.valid).toBe(true)
    })

    it('should reject B before HB1', () => {
      const breaks = {
        HB1: '12:00:00',
        B: '10:00:00',
        HB2: null,
      }
      const result = validateBreakOrdering(breaks)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateBreakTiming', () => {
    it('should validate breaks with 90-270 minute gaps', () => {
      const breaks = {
        HB1: '09:00:00',
        B: '11:00:00', // 120 minutes
        HB2: '13:30:00', // 150 minutes
      }
      const result = validateBreakTiming(breaks)
      expect(result.valid).toBe(true)
    })

    it('should reject breaks too close together', () => {
      const breaks = {
        HB1: '09:00:00',
        B: '09:30:00', // 30 minutes - too close
        HB2: null,
      }
      const result = validateBreakTiming(breaks)
      expect(result.valid).toBe(false)
    })

    it('should reject breaks too far apart', () => {
      const breaks = {
        HB1: '09:00:00',
        B: '14:00:00', // 300 minutes - too far
        HB2: null,
      }
      const result = validateBreakTiming(breaks)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateShiftBoundary', () => {
    it('should validate breaks within AM shift hours', () => {
      const breaks = {
        HB1: '10:00:00',
        B: '12:00:00',
        HB2: '14:00:00',
      }
      const result = validateShiftBoundary(breaks, 'AM')
      expect(result.valid).toBe(true)
    })

    it('should reject breaks outside shift hours', () => {
      const breaks = {
        HB1: '08:00:00', // Before AM shift start (09:00)
        B: '12:00:00',
        HB2: '14:00:00',
      }
      const result = validateShiftBoundary(breaks, 'AM')
      expect(result.valid).toBe(false)
    })

    it('should validate breaks within PM shift hours', () => {
      const breaks = {
        HB1: '14:00:00',
        B: '16:00:00',
        HB2: '18:00:00',
      }
      const result = validateShiftBoundary(breaks, 'PM')
      expect(result.valid).toBe(true)
    })

    it('should handle OFF shift type', () => {
      const breaks = {
        HB1: '10:00:00',
        B: null,
        HB2: null,
      }
      const result = validateShiftBoundary(breaks, 'OFF')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateAgainstRules', () => {
    it('should validate against active rules', () => {
      const breaks = {
        HB1: '10:00:00',
        B: '12:00:00',
        HB2: '14:00:00',
      }
      const rules: BreakScheduleRule[] = [
        {
          id: '1',
          rule_name: 'Break Ordering',
          rule_type: 'ordering',
          description: 'Breaks must be in order',
          parameters: {},
          is_active: true,
          is_blocking: true,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      const result = validateAgainstRules(breaks, 'AM', rules)
      expect(result.violations).toBeDefined()
    })

    it('should skip inactive rules', () => {
      const breaks = {
        HB1: '10:00:00',
        B: '12:00:00',
        HB2: '14:00:00',
      }
      const rules: BreakScheduleRule[] = [
        {
          id: '1',
          rule_name: 'Inactive Rule',
          rule_type: 'ordering',
          description: 'Should be skipped',
          parameters: {},
          is_active: false,
          is_blocking: true,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      const result = validateAgainstRules(breaks, 'AM', rules)
      expect(result.violations).toHaveLength(0)
    })
  })

  describe('getRuleViolations', () => {
    it('should collect and prioritize violations', () => {
      const breaks = {
        HB1: '14:00:00',
        B: '12:00:00',
        HB2: '10:00:00',
      }
      const rules: BreakScheduleRule[] = [
        {
          id: '1',
          rule_name: 'Break Ordering',
          rule_type: 'ordering',
          description: 'Breaks must be in order',
          parameters: {},
          is_active: true,
          is_blocking: true,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      const violations = getRuleViolations(breaks, 'AM', rules)
      expect(violations.length).toBeGreaterThan(0)
      expect(violations[0].severity).toBe('error')
    })

    it('should return empty array for valid breaks', () => {
      const breaks = {
        HB1: '10:00:00',
        B: '12:00:00',
        HB2: '14:00:00',
      }
      const rules: BreakScheduleRule[] = []
      const violations = getRuleViolations(breaks, 'AM', rules)
      expect(violations).toHaveLength(0)
    })
  })
})
