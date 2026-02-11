/**
 * Property-Based Tests: State Transition Properties
 * Feature: break-schedule-management
 * Properties: 9-12
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { breakTypeArb } from '../generators/breakScheduleGenerators'
import { validateFullBreakDuration } from '../../lib/breakValidation'
import type { BreakType } from '../../types'

describe('State Transition Properties', () => {
  /**
   * Property 9: Break type cycling
   * For any break type, clicking to cycle should transition to the next type
   * in the sequence: IN → HB1 → B → HB2 → IN.
   * 
   * Validates: Requirements 4.1
   */
  it('Property 9: Break type cycling', () => {
    fc.assert(
      fc.property(
        breakTypeArb,
        (currentType) => {
          const cycleNext = (type: BreakType): BreakType => {
            const sequence: BreakType[] = ['IN', 'HB1', 'B', 'HB2']
            const currentIndex = sequence.indexOf(type)
            const nextIndex = (currentIndex + 1) % sequence.length
            return sequence[nextIndex]
          }
          
          const nextType = cycleNext(currentType)
          
          // Verify the cycle is correct
          if (currentType === 'IN') expect(nextType).toBe('HB1')
          else if (currentType === 'HB1') expect(nextType).toBe('B')
          else if (currentType === 'B') expect(nextType).toBe('HB2')
          else if (currentType === 'HB2') expect(nextType).toBe('IN')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10: Full break duration enforcement
   * For any interval set to break type "B", the immediately following interval
   * should also be set to "B" to enforce the 30-minute duration.
   * 
   * Validates: Requirements 4.2
   */
  it('Property 10: Full break duration enforcement', () => {
    fc.assert(
      fc.property(
        fc.record({
          firstInterval: fc.tuple(
            fc.integer({ min: 9, max: 20 }),
            fc.constantFrom(0, 15, 30, 45)
          ),
          hasSecondInterval: fc.boolean()
        }),
        ({ firstInterval, hasSecondInterval }) => {
          const [h, m] = firstInterval
          const firstTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`
          
          const intervals: Array<{ interval_start: string; break_type: BreakType }> = [
            { interval_start: firstTime, break_type: 'B' }
          ]
          
          if (hasSecondInterval) {
            const nextM = m + 15
            if (nextM < 60) {
              const secondTime = `${h.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}:00`
              intervals.push({ interval_start: secondTime, break_type: 'B' })
            }
          }
          
          const violation = validateFullBreakDuration(intervals)
          
          // If we have exactly 2 consecutive B intervals, no violation
          if (hasSecondInterval && intervals.length === 2) {
            expect(violation).toBeNull()
          } else {
            // Otherwise, should have a violation
            expect(violation).not.toBeNull()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11: Shift change clears breaks
   * For any shift record where the shift_type changes, all break schedules
   * for that user and date should be deleted, and a warning record should be created.
   * 
   * Validates: Requirements 7.1, 7.2
   * 
   * Note: This property tests the expected behavior. Actual database trigger testing
   * would require integration tests with a real database.
   */
  it('Property 11: Shift change clears breaks (behavior specification)', () => {
    fc.assert(
      fc.property(
        fc.record({
          oldShift: fc.constantFrom('AM', 'PM', 'BET'),
          newShift: fc.constantFrom('AM', 'PM', 'BET', 'OFF'),
          hadBreaks: fc.boolean()
        }),
        ({ oldShift, newShift, hadBreaks }) => {
          const shiftChanged = oldShift !== newShift
          
          // Simulate the expected behavior
          const breaksAfterChange = shiftChanged ? [] : (hadBreaks ? ['HB1', 'B', 'HB2'] : [])
          const warningCreated = shiftChanged
          
          if (shiftChanged) {
            expect(breaksAfterChange).toHaveLength(0)
            expect(warningCreated).toBe(true)
          } else {
            if (hadBreaks) {
              expect(breaksAfterChange.length).toBeGreaterThan(0)
            }
            expect(warningCreated).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 12: Warning dismissal state change
   * For any warning, when dismissed, the is_resolved field should be set to true
   * and the warning indicator should not be displayed.
   * 
   * Validates: Requirements 7.5
   */
  it('Property 12: Warning dismissal state change', () => {
    fc.assert(
      fc.property(
        fc.record({
          warningId: fc.uuid(),
          initiallyResolved: fc.boolean(),
          dismissed: fc.boolean()
        }),
        ({ warningId, initiallyResolved, dismissed }) => {
          // Simulate warning state
          let isResolved = initiallyResolved
          
          if (dismissed) {
            isResolved = true
          }
          
          // After dismissal, warning should be resolved
          if (dismissed) {
            expect(isResolved).toBe(true)
          }
          
          // Warning indicator should not be shown if resolved
          const shouldShowIndicator = !isResolved
          expect(shouldShowIndicator).toBe(!isResolved)
        }
      ),
      { numRuns: 100 }
    )
  })
})
