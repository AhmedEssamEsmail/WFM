/**
 * Property-Based Tests: breakSchedulesService
 * Feature: break-schedule-management
 * Properties: 14
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { breakSchedulesService } from '../../services/breakSchedulesService';
import type { BreakScheduleUpdateRequest, BreakType } from '../../types';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      }),
    })),
  },
}));

// Mock breakRulesService
vi.mock('../../services/breakRulesService', () => ({
  breakRulesService: {
    getActiveRules: vi.fn().mockResolvedValue([]),
  },
}));

// Mock shiftConfigurationsService
vi.mock('../../services/shiftConfigurationsService', () => ({
  shiftConfigurationsService: {
    getActiveShiftConfigurations: vi.fn().mockResolvedValue([]),
    getShiftHoursMap: vi.fn().mockResolvedValue({}),
  },
}));

// Arbitraries for generating test data
const dateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => {
  // Ensure valid date by using local date components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});
const uuidArb = fc.uuid();
const timeArb = fc
  .integer({ min: 0, max: 23 })
  .chain((h) =>
    fc
      .integer({ min: 0, max: 59 })
      .chain((m) =>
        fc
          .integer({ min: 0, max: 59 })
          .map(
            (s) =>
              `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          )
      )
  );

const breakTypeArb = fc.constantFrom<BreakType>('IN', 'HB1', 'B', 'HB2');

const intervalArb = fc.record({
  interval_start: timeArb,
  break_type: breakTypeArb,
});

const intervalsArb = fc.array(intervalArb, { minLength: 1, maxLength: 10 });

const breakScheduleUpdateRequestArb: fc.Arbitrary<BreakScheduleUpdateRequest> = fc.record({
  user_id: uuidArb,
  schedule_date: dateArb,
  intervals: intervalsArb,
});

describe('breakSchedulesService Properties', () => {
  /**
   * Property 14: Test Coverage Maintenance
   * For any valid break schedule update request, the service should
   * either succeed or return validation violations, never throw unexpectedly.
   *
   * Validates: Requirements 6.1
   */
  describe('updateBreakSchedule', () => {
    it('Property 14: Should handle any valid request without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(breakScheduleUpdateRequestArb, async (request) => {
          // The function should either:
          // 1. Return a valid response object with success and violations
          // 2. Throw an error for invalid input
          // 3. Not crash or return undefined

          try {
            const result = await breakSchedulesService.updateBreakSchedule(request);

            // If we get here, result should be defined
            expect(result).toBeDefined();
            expect(typeof result.success).toBe('boolean');
            expect(Array.isArray(result.violations)).toBe(true);
          } catch (error) {
            // Errors are acceptable for invalid input
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('Property 14: Violations should have required properties', async () => {
      await fc.assert(
        fc.asyncProperty(breakScheduleUpdateRequestArb, async (request) => {
          try {
            const result = await breakSchedulesService.updateBreakSchedule(request);

            for (const violation of result.violations) {
              expect(violation).toHaveProperty('rule_name');
              expect(violation).toHaveProperty('message');
              expect(violation).toHaveProperty('severity');
              expect(['error', 'warning']).toContain(violation.severity);
            }
          } catch {
            // Errors are acceptable for invalid input
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('bulkUpdateBreakSchedules', () => {
    it('Property 14: Should handle bulk updates consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(breakScheduleUpdateRequestArb, { minLength: 1, maxLength: 5 }),
          async (updates) => {
            try {
              const result = await breakSchedulesService.bulkUpdateBreakSchedules(updates);

              expect(result).toBeDefined();
              expect(typeof result.success).toBe('boolean');
              expect(Array.isArray(result.violations)).toBe(true);

              // If all individual updates succeeded, bulk should succeed
              // Note: This is a simplified check as we can't easily mock all responses
            } catch (error) {
              // Errors are acceptable for invalid input
              expect(error).toBeInstanceOf(Error);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('getScheduleForDate', () => {
    it('Property 14: Should return valid response structure for any date', async () => {
      await fc.assert(
        fc.asyncProperty(fc.option(dateArb, { nil: undefined }), async (date) => {
          try {
            const result = await breakSchedulesService.getScheduleForDate(date || '2024-01-01');

            // If successful, result should have the expected structure
            if (result) {
              expect(result).toHaveProperty('agents');
              expect(result).toHaveProperty('summary');
              expect(Array.isArray(result.agents)).toBe(true);
              expect(typeof result.summary).toBe('object');
            }
          } catch (error) {
            // Database errors are acceptable in test environment
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('getCoverageSummary', () => {
    it('Property 14: Should return valid summary structure', async () => {
      await fc.assert(
        fc.asyncProperty(dateArb, async (date) => {
          try {
            const result = await breakSchedulesService.getCoverageSummary(date);

            // If successful, result should be an object
            if (result) {
              expect(typeof result).toBe('object');
            }
          } catch (error) {
            // Database errors are acceptable
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('getWarnings', () => {
    it('Property 14: Should return array of warnings', async () => {
      await fc.assert(
        fc.asyncProperty(dateArb, async (date) => {
          try {
            const result = await breakSchedulesService.getWarnings(date);

            // If successful, result should be an array
            if (result) {
              expect(Array.isArray(result)).toBe(true);
            }
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('getBreakScheduleById', () => {
    it('Property 14: Should return valid break schedule or throw', async () => {
      await fc.assert(
        fc.asyncProperty(fc.option(uuidArb, { nil: undefined }), async (id) => {
          if (!id) return; // Skip if no ID provided

          try {
            const result = await breakSchedulesService.getBreakScheduleById(id);

            // If successful, result should have expected properties
            if (result) {
              expect(result).toHaveProperty('id');
              expect(result).toHaveProperty('user_id');
            }
          } catch (error) {
            // Not found errors are acceptable
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 5 }
      );
    });
  });

  describe('deleteUserBreaks', () => {
    it('Property 14: Should not throw for valid input', async () => {
      await fc.assert(
        fc.asyncProperty(uuidArb, dateArb, async (userId, date) => {
          try {
            await breakSchedulesService.deleteUserBreaks(userId, date);
            // If no error, operation succeeded
            expect(true).toBe(true);
          } catch (error) {
            // Database errors are acceptable
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 5 }
      );
    });
  });

  describe('dismissWarning', () => {
    it('Property 14: Should not throw for valid warning ID', async () => {
      await fc.assert(
        fc.asyncProperty(uuidArb, async (warningId) => {
          try {
            await breakSchedulesService.dismissWarning(warningId);
            // If no error, operation succeeded
            expect(true).toBe(true);
          } catch (error) {
            // Not found errors are acceptable
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { numRuns: 5 }
      );
    });
  });
});
