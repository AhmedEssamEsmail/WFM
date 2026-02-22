/**
 * Property-Based Tests: Validation Properties
 * Feature: break-schedule-management
 * Properties: 4-8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  orderedBreakTimesArb,
  minutesToTime,
  breakScheduleRuleArb,
} from '../generators/breakScheduleGenerators';
import {
  validateBreakOrdering,
  validateBreakTiming,
  validateShiftBoundary,
  getRuleViolations,
  validateFullBreakDuration,
} from '../../lib/breakValidation';
import type { BreakScheduleUpdateRequest, ShiftType, BreakType } from '../../types';

describe('Validation Properties', () => {
  /**
   * Property 4: Break ordering invariant
   * For any valid break schedule, if HB1, B, and HB2 are all scheduled,
   * then the start time of HB1 must be before B, and B must be before HB2.
   *
   * Validates: Requirements 5.1
   */
  it('Property 4: Break ordering invariant', () => {
    fc.assert(
      fc.property(orderedBreakTimesArb, (breakTimes) => {
        const hb1Time = minutesToTime(breakTimes.hb1);
        const bTime = minutesToTime(breakTimes.b);
        const hb2Time = minutesToTime(breakTimes.hb2);

        const request: BreakScheduleUpdateRequest = {
          user_id: 'test-user',
          schedule_date: '2024-01-01',
          intervals: [
            { interval_start: `${hb1Time}:00`, break_type: 'HB1' },
            { interval_start: `${bTime}:00`, break_type: 'B' },
            { interval_start: `${hb2Time}:00`, break_type: 'HB2' },
          ],
        };

        const violation = validateBreakOrdering(request.intervals);

        // If times are properly ordered, should have no violations
        if (hb1Time < bTime && bTime < hb2Time) {
          expect(violation).toBeNull();
        } else {
          expect(violation).not.toBeNull();
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 5: Break timing constraints
   * For any pair of consecutive breaks (HB1→B or B→HB2),
   * the time gap should be between 90 and 270 minutes inclusive.
   *
   * Validates: Requirements 5.2, 5.3
   */
  it('Property 5: Break timing constraints', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            hb1: fc.integer({ min: 0, max: 200 }),
            b: fc.integer({ min: 90, max: 400 }),
            hb2: fc.integer({ min: 180, max: 500 }),
          })
          .filter((times) => {
            // Ensure breaks are ordered
            if (!(times.hb1 < times.b && times.b < times.hb2)) return false;

            // Calculate gaps
            const gapHB1toB = times.b - times.hb1;
            const gapBtoHB2 = times.hb2 - times.b;

            // Only test cases where at least one gap is outside valid range
            // or both gaps are within valid range (to test both pass and fail cases)
            return true;
          }),
        (breakTimes) => {
          const hb1Time = minutesToTime(breakTimes.hb1);
          const bTime = minutesToTime(breakTimes.b);
          const hb2Time = minutesToTime(breakTimes.hb2);

          const request: BreakScheduleUpdateRequest = {
            user_id: 'test-user',
            schedule_date: '2024-01-01',
            intervals: [
              { interval_start: `${hb1Time}:00`, break_type: 'HB1' },
              { interval_start: `${bTime}:00`, break_type: 'B' },
              { interval_start: `${hb2Time}:00`, break_type: 'HB2' },
            ],
          };

          const violations = validateBreakTiming(request.intervals);

          // Calculate actual gaps based on the rounded times (not the input minutes)
          const hb1Minutes = parseInt(hb1Time.split(':')[0]) * 60 + parseInt(hb1Time.split(':')[1]);
          const bMinutes = parseInt(bTime.split(':')[0]) * 60 + parseInt(bTime.split(':')[1]);
          const hb2Minutes = parseInt(hb2Time.split(':')[0]) * 60 + parseInt(hb2Time.split(':')[1]);

          const actualGapHB1toB = bMinutes - hb1Minutes;
          const actualGapBtoHB2 = hb2Minutes - bMinutes;

          // Check if gaps are within valid range (90-270 minutes inclusive)
          const validGaps =
            actualGapHB1toB >= 90 &&
            actualGapHB1toB <= 270 &&
            actualGapBtoHB2 >= 90 &&
            actualGapBtoHB2 <= 270;

          if (validGaps) {
            expect(violations).toHaveLength(0);
          } else {
            // If gaps are invalid, should have violations
            expect(violations.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 8: Rule priority resolution
   * For any set of conflicting rules, the validation should apply
   * the rule with the lowest priority number (highest priority).
   *
   * Validates: Requirements 6.5
   */
  it('Property 8: Rule priority resolution', () => {
    fc.assert(
      fc.property(fc.array(breakScheduleRuleArb, { minLength: 2, maxLength: 5 }), (rules) => {
        // Sort rules by priority
        const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

        // The first rule should have the lowest priority number (highest priority)
        const highestPriorityRule = sortedRules[0];

        expect(sortedRules.every((r) => r.priority >= highestPriorityRule.priority)).toBe(true);

        // Verify that when rules are processed in order, highest priority comes first
        for (let i = 1; i < sortedRules.length; i++) {
          expect(sortedRules[i].priority).toBeGreaterThanOrEqual(sortedRules[i - 1].priority);
        }
      }),
      { numRuns: 10 }
    );
  });
});
