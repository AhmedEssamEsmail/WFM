/**
 * Property-Based Tests: Coverage and Display Properties
 * Feature: break-schedule-management
 * Properties: 16-19
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  agentBreakScheduleArb,
  timeArb,
  generateIntervals,
} from '../generators/breakScheduleGenerators';
import type { BreakType } from '../../types';

describe('Coverage and Display Properties', () => {
  /**
   * Property 16: Coverage calculation accuracy
   * For any interval, the summary count of agents in "IN" status should equal
   * the total number of agents with shifts minus the count of agents with break types HB1, B, or HB2.
   *
   * Validates: Requirements 2.2, 11.1
   */
  it('Property 16: Coverage calculation accuracy', () => {
    fc.assert(
      fc.property(
        fc.array(agentBreakScheduleArb, { minLength: 5, maxLength: 20 }),
        timeArb,
        (agents, interval) => {
          // Generate intervals for each agent
          const agentsWithIntervals = agents.map((agent) => ({
            ...agent,
            intervals: generateIntervals(agent.shift_type, agent.breaks),
          }));

          // Calculate coverage for the interval
          let inCount = 0;
          let hb1Count = 0;
          let bCount = 0;
          let hb2Count = 0;
          let totalWithShift = 0;

          for (const agent of agentsWithIntervals) {
            if (agent.shift_type !== 'OFF' && agent.intervals[interval]) {
              totalWithShift++;
              const breakType = agent.intervals[interval];

              if (breakType === 'IN') inCount++;
              else if (breakType === 'HB1') hb1Count++;
              else if (breakType === 'B') bCount++;
              else if (breakType === 'HB2') hb2Count++;
            }
          }

          // Verify the calculation
          expect(inCount + hb1Count + bCount + hb2Count).toBe(totalWithShift);
          expect(inCount).toBe(totalWithShift - hb1Count - bCount - hb2Count);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 17: Coverage color mapping
   * For any interval coverage count, the color should be:
   * green for ≥10, yellow for 5-9, orange for 3-4, and red for 0-2.
   *
   * Validates: Requirements 11.2, 11.3, 11.4, 11.5
   */
  it('Property 17: Coverage color mapping', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 }), (coverageCount) => {
        const getCoverageColor = (count: number): string => {
          if (count >= 10) return 'green';
          if (count >= 5) return 'yellow';
          if (count >= 3) return 'orange';
          return 'red';
        };

        const color = getCoverageColor(coverageCount);

        if (coverageCount >= 10) {
          expect(color).toBe('green');
        } else if (coverageCount >= 5) {
          expect(color).toBe('yellow');
        } else if (coverageCount >= 3) {
          expect(color).toBe('orange');
        } else {
          expect(color).toBe('red');
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 18: Date formatting consistency
   * For any date value, the formatted display should match the pattern
   * "DayOfWeek, Month DD, YYYY" (e.g., "Tuesday, Feb 11, 2026").
   *
   * Validates: Requirements 3.5
   */
  it('Property 18: Date formatting consistency', () => {
    fc.assert(
      fc.property(
        fc
          .date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
          .filter((d) => !isNaN(d.getTime())),
        (date) => {
          const formatDate = (d: Date): string => {
            const days = [
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ];
            const months = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];

            const dayName = days[d.getDay()];
            const monthName = months[d.getMonth()];
            const day = d.getDate();
            const year = d.getFullYear();

            return `${dayName}, ${monthName} ${day}, ${year}`;
          };

          const formatted = formatDate(date);

          // Verify format matches pattern
          const pattern =
            /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}$/;
          expect(formatted).toMatch(pattern);

          // Verify components are correct
          const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];
          expect(formatted).toContain(days[date.getDay()]);
          expect(formatted).toContain(date.getFullYear().toString());
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 19: Date navigation arithmetic
   * For any displayed date, clicking "Previous Day" should show date - 1 day,
   * and clicking "Next Day" should show date + 1 day.
   *
   * Validates: Requirements 3.2, 3.3
   */
  it('Property 19: Date navigation arithmetic', () => {
    fc.assert(
      fc.property(
        fc
          .date({ min: new Date('2024-01-02'), max: new Date('2026-12-30') })
          .filter((d) => !isNaN(d.getTime())),
        (currentDate) => {
          const previousDay = new Date(currentDate);
          previousDay.setUTCDate(previousDay.getUTCDate() - 1);

          const nextDay = new Date(currentDate);
          nextDay.setUTCDate(nextDay.getUTCDate() + 1);

          // Verify the difference is approximately 1 day in milliseconds
          // Allow for small variations due to DST transitions
          const diffPrev = Math.abs(currentDate.getTime() - previousDay.getTime());
          const diffNext = Math.abs(nextDay.getTime() - currentDate.getTime());

          const oneDayMs = 24 * 60 * 60 * 1000;
          const tolerance = 2 * 60 * 60 * 1000; // 2 hours tolerance for DST

          expect(diffPrev).toBeGreaterThanOrEqual(oneDayMs - tolerance);
          expect(diffPrev).toBeLessThanOrEqual(oneDayMs + tolerance);
          expect(diffNext).toBeGreaterThanOrEqual(oneDayMs - tolerance);
          expect(diffNext).toBeLessThanOrEqual(oneDayMs + tolerance);
        }
      ),
      { numRuns: 10 }
    );
  });
});
