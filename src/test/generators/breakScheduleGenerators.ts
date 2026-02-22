/**
 * Property-Based Test Generators for Break Schedule Management
 *
 * This module provides fast-check arbitraries (generators) for property-based testing
 * of break schedule functionality. These generators create random but valid test data
 * that conforms to business rules.
 *
 * ## What is Property-Based Testing?
 *
 * Property-based testing validates that certain properties (invariants) hold true
 * for all possible inputs, not just specific examples. Instead of writing:
 * ```typescript
 * expect(parseTime('09:00')).toBe('09:00:00')
 * ```
 *
 * You write:
 * ```typescript
 * fc.assert(fc.property(timeArb, (time) => {
 *   const parsed = parseTime(time);
 *   expect(parsed).toMatch(/^\d{2}:\d{2}:\d{2}$/);
 * }));
 * ```
 *
 * This runs 100+ times with different random times, catching edge cases you might miss.
 *
 * ## Usage Patterns
 *
 * ### 1. Basic Type Generators
 * Use these for generating individual values:
 * ```typescript
 * fc.assert(fc.property(breakTypeArb, (breakType) => {
 *   expect(['IN', 'HB1', 'B', 'HB2']).toContain(breakType);
 * }));
 * ```
 *
 * ### 2. Composite Generators
 * Use these for generating complex objects:
 * ```typescript
 * fc.assert(fc.property(agentBreakScheduleArb, (agent) => {
 *   // Test properties of the entire agent schedule
 *   expect(agent.name).toBeTruthy();
 * }));
 * ```
 *
 * ### 3. CSV Testing
 * Use CSV generators for round-trip testing:
 * ```typescript
 * fc.assert(fc.property(breakScheduleCSVDataArb, (data) => {
 *   const csv = generateCSV(data);
 *   const parsed = parseCSV(csv);
 *   expect(parsed).toEqual(data);
 * }));
 * ```
 */
import * as fc from 'fast-check';
import type { BreakType, ShiftType, AgentBreakSchedule, BreakScheduleRule } from '../../types';

/**
 * Generates random break types (IN, HB1, B, HB2)
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(breakTypeArb, (breakType) => {
 *   expect(['IN', 'HB1', 'B', 'HB2']).toContain(breakType);
 * }));
 * ```
 */
export const breakTypeArb = fc.constantFrom<BreakType>('IN', 'HB1', 'B', 'HB2');

/**
 * Generates random shift types including OFF (AM, PM, BET, OFF)
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(shiftTypeArb, (shift) => {
 *   expect(['AM', 'PM', 'BET', 'OFF']).toContain(shift);
 * }));
 * ```
 */
export const shiftTypeArb = fc.constantFrom<ShiftType>('AM', 'PM', 'BET', 'OFF');

/**
 * Generates random working shift types excluding OFF (AM, PM, BET)
 * Use this when testing break scheduling logic that doesn't apply to OFF shifts
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(nonOffShiftTypeArb, (shift) => {
 *   expect(shift).not.toBe('OFF');
 * }));
 * ```
 */
export const nonOffShiftTypeArb = fc.constantFrom<ShiftType>('AM', 'PM', 'BET');

/**
 * Generates random times in HH:MM format within business hours (09:00-19:00)
 * Times are in 15-minute intervals to match break scheduling constraints
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(timeArb, (time) => {
 *   expect(time).toMatch(/^\d{2}:\d{2}$/);
 *   const [hours, minutes] = time.split(':').map(Number);
 *   expect(hours).toBeGreaterThanOrEqual(9);
 *   expect(hours).toBeLessThanOrEqual(19);
 *   expect([0, 15, 30, 45]).toContain(minutes);
 * }));
 * ```
 */
export const timeArb = fc
  .tuple(
    fc.integer({ min: 9, max: 19 }), // hours 9-19 (to stay within all shift types)
    fc.constantFrom(0, 15, 30, 45) // minutes in 15-min intervals
  )
  .map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/**
 * Generates random times in HH:MM:SS format (adds :00 seconds to timeArb)
 * Use this when testing functions that expect or return times with seconds
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(timeWithSecondsArb, (time) => {
 *   expect(time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
 *   expect(time.endsWith(':00')).toBe(true);
 * }));
 * ```
 */
export const timeWithSecondsArb = timeArb.map((t) => `${t}:00`);

/**
 * Generates random dates in ISO format (YYYY-MM-DD) between 2024-2026
 * Filters out invalid dates (NaN timestamps)
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(dateArb, (date) => {
 *   expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
 *   expect(new Date(date).getTime()).not.toBeNaN();
 * }));
 * ```
 */
export const dateArb = fc
  .date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
  .filter((d) => !isNaN(d.getTime()))
  .map((d) => d.toISOString().split('T')[0]);

/**
 * Generates random UUIDs using fast-check's built-in UUID generator
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(uuidArb, (uuid) => {
 *   expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
 * }));
 * ```
 */
export const uuidArb = fc.uuid();

/**
 * Generates random department names from a predefined list
 */
export const departmentArb = fc.constantFrom('Sales', 'Support', 'Customer Success', 'Engineering');

/**
 * Generates random user roles (agent, tl, wfm)
 */
export const userRoleArb = fc.constantFrom('agent', 'tl', 'wfm');

/**
 * Generates random agent names by combining first and last names
 * Produces realistic-looking names for test data
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(agentNameArb, (name) => {
 *   expect(name).toContain(' '); // Has space between first and last
 *   expect(name.split(' ')).toHaveLength(2);
 * }));
 * ```
 */
export const agentNameArb = fc
  .tuple(
    fc.constantFrom('John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Lisa'),
    fc.constantFrom('Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis')
  )
  .map(([first, last]) => `${first} ${last}`);

/**
 * Generates ordered break times ensuring HB1 < B < HB2
 * Times are represented as minutes from shift start
 *
 * This generator ensures breaks are in the correct order, which is a business rule
 * that must always be satisfied.
 *
 * @example
 * ```typescript
 * fc.assert(fc.property(orderedBreakTimesArb, (times) => {
 *   expect(times.hb1).toBeLessThan(times.b);
 *   expect(times.b).toBeLessThan(times.hb2);
 * }));
 * ```
 */
export const orderedBreakTimesArb = fc
  .record({
    hb1: fc.integer({ min: 0, max: 200 }), // minutes from shift start
    b: fc.integer({ min: 90, max: 300 }),
    hb2: fc.integer({ min: 180, max: 400 }),
  })
  .filter((times) => times.hb1 < times.b && times.b < times.hb2);

/**
 * Converts minutes from shift start to HH:MM time string
 * Assumes shifts start at 09:00 and rounds to 15-minute intervals
 *
 * @param minutes - Minutes elapsed since shift start (09:00)
 * @returns Time string in HH:MM format
 *
 * @example
 * ```typescript
 * minutesToTime(0)   // '09:00' (shift start)
 * minutesToTime(90)  // '10:30' (90 minutes later)
 * minutesToTime(180) // '12:00' (3 hours later)
 * ```
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) + 9; // Start from 9:00
  const mins = minutes % 60;
  const roundedMins = Math.floor(mins / 15) * 15;
  return `${hours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`;
}

// Agent break schedule generator
export const agentBreakScheduleArb = fc
  .record({
    user_id: uuidArb,
    name: agentNameArb,
    shift_type: shiftTypeArb,
    department: departmentArb,
    has_warning: fc.boolean(),
    warning_details: fc.constant(null),
    breaks: fc.record({
      HB1: fc.option(timeArb, { nil: null }),
      B: fc.option(timeArb, { nil: null }),
      HB2: fc.option(timeArb, { nil: null }),
    }),
    intervals: fc.constant({}),
  })
  .filter((agent) => {
    // OFF shifts should not have any breaks scheduled
    if (agent.shift_type === 'OFF') {
      return agent.breaks.HB1 === null && agent.breaks.B === null && agent.breaks.HB2 === null;
    }

    // Ensure all breaks are at different times (no duplicates)
    const times = [agent.breaks.HB1, agent.breaks.B, agent.breaks.HB2].filter((t) => t !== null);
    const uniqueTimes = new Set(times);
    return times.length === uniqueTimes.size;
  })
  .chain((agent) => {
    // OFF shifts should not have any breaks scheduled
    if (agent.shift_type === 'OFF') {
      return fc.constant({
        ...agent,
        breaks: { HB1: null, B: null, HB2: null },
      });
    }
    return fc.constant(agent);
  });

// Break schedule rule generator
export const breakScheduleRuleArb = fc.record({
  id: uuidArb,
  rule_name: fc.constantFrom('break_ordering', 'minimum_gap', 'maximum_gap', 'shift_boundary'),
  rule_type: fc.constantFrom<'distribution' | 'ordering' | 'timing' | 'coverage'>(
    'ordering',
    'timing',
    'coverage',
    'distribution'
  ),
  description: fc.string(),
  parameters: fc.constant({}),
  is_active: fc.boolean(),
  is_blocking: fc.boolean(),
  priority: fc.integer({ min: 1, max: 10 }),
  created_at: fc
    .date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
    .filter((d) => !isNaN(d.getTime()))
    .map((d) => d.toISOString()),
  updated_at: fc
    .date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
    .filter((d) => !isNaN(d.getTime()))
    .map((d) => d.toISOString()),
});

// Interval map generator
export function generateIntervals(
  shiftType: ShiftType,
  breaks: { HB1: string | null; B: string | null; HB2: string | null }
): Record<string, BreakType> {
  const intervals: Record<string, BreakType> = {};

  const shiftHours: Record<ShiftType, { start: number; end: number } | null> = {
    AM: { start: 9, end: 17 },
    PM: { start: 13, end: 21 },
    BET: { start: 11, end: 19 },
    OFF: null,
  };

  const hours = shiftHours[shiftType];
  if (!hours) return intervals;

  // Generate all intervals for shift
  for (let h = hours.start; h < hours.end; h++) {
    for (const m of [0, 15, 30, 45]) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      intervals[time] = 'IN';
    }
  }

  // Apply breaks in order: HB1, B, HB2 to ensure correct assignment
  // This ensures that if a break time overlaps, the correct break type is assigned
  const breakOrder: Array<{ time: string | null; type: BreakType }> = [
    { time: breaks.HB1, type: 'HB1' },
    { time: breaks.B, type: 'B' },
    { time: breaks.HB2, type: 'HB2' },
  ];

  for (const { time, type } of breakOrder) {
    if (time && intervals[time] !== undefined) {
      intervals[time] = type;

      // B is 30 minutes, so mark next interval too
      if (type === 'B') {
        const [h, m] = time.split(':').map(Number);
        const nextM = m + 15;
        const nextH = nextM >= 60 ? h + 1 : h;
        const adjustedM = nextM >= 60 ? nextM - 60 : nextM;
        const nextTime = `${nextH.toString().padStart(2, '0')}:${adjustedM.toString().padStart(2, '0')}`;
        if (intervals[nextTime] !== undefined) {
          intervals[nextTime] = type;
        }
      }
    }
  }

  return intervals;
}

// Coverage summary generator
export const coverageSummaryArb = fc.dictionary(
  timeArb,
  fc.record({
    in: fc.integer({ min: 0, max: 20 }),
    hb1: fc.integer({ min: 0, max: 5 }),
    b: fc.integer({ min: 0, max: 5 }),
    hb2: fc.integer({ min: 0, max: 5 }),
  })
);

// CSV Break Schedule Data Generator for Property-Based Testing
// Used for testing CSV round-trip properties

/**
 * Generates valid break schedule data for CSV testing
 * Ensures data conforms to expected CSV format
 */
export const breakScheduleCSVDataArb = fc
  .record({
    agent_name: agentNameArb,
    date: dateArb,
    shift: nonOffShiftTypeArb,
    hb1_start: fc.option(timeArb, { nil: null }),
    b_start: fc.option(timeArb, { nil: null }),
    hb2_start: fc.option(timeArb, { nil: null }),
  })
  .filter((data) => {
    // Ensure all break times are different (no duplicates)
    const times = [data.hb1_start, data.b_start, data.hb2_start].filter((t) => t !== null);
    const uniqueTimes = new Set(times);
    return times.length === uniqueTimes.size;
  });

/**
 * Generates an array of break schedule data for CSV testing
 * Useful for testing CSV parsing with multiple rows
 */
export const breakScheduleCSVArrayArb = fc.array(breakScheduleCSVDataArb, {
  minLength: 1,
  maxLength: 20,
});

/**
 * Generates invalid CSV data for error handling tests
 * Tests various malformed inputs
 */
export const invalidCSVDataArb = fc.oneof(
  // Empty string
  fc.constant(''),
  // Header only
  fc.constant('agent_name,date,shift,hb1_start,b_start,hb2_start'),
  // Invalid date format
  fc.record({
    agent_name: agentNameArb,
    date: fc.constantFrom('2024/01/01', '01-01-2024', 'invalid-date'),
    shift: nonOffShiftTypeArb,
    hb1_start: fc.option(timeArb, { nil: null }),
    b_start: fc.option(timeArb, { nil: null }),
    hb2_start: fc.option(timeArb, { nil: null }),
  }),
  // Invalid time format
  fc.record({
    agent_name: agentNameArb,
    date: dateArb,
    shift: nonOffShiftTypeArb,
    hb1_start: fc.constantFrom('25:00', '12:60', 'invalid-time'),
    b_start: fc.option(timeArb, { nil: null }),
    hb2_start: fc.option(timeArb, { nil: null }),
  }),
  // Missing required fields
  fc.record({
    agent_name: fc.constant(''),
    date: dateArb,
    shift: nonOffShiftTypeArb,
    hb1_start: fc.option(timeArb, { nil: null }),
    b_start: fc.option(timeArb, { nil: null }),
    hb2_start: fc.option(timeArb, { nil: null }),
  })
);
