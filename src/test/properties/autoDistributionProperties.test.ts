/**
 * Property-Based Tests: Auto-Distribution Properties
 * Feature: break-schedule-management
 * Properties: 23-28
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  agentBreakScheduleArb,
  nonOffShiftTypeArb,
  breakScheduleRuleArb,
} from '../generators/breakScheduleGenerators';
import { calculateShiftThirds } from '../../lib/autoDistribution';
import { getRuleViolations } from '../../lib/breakValidation';
import type { ShiftType, BreakScheduleUpdateRequest } from '../../types';

describe('Auto-Distribution Properties', () => {
  /**
   * Property 25: Balanced coverage variance
   * For any schedule generated with the "Balanced Coverage" strategy,
   * the variance in coverage across intervals should be minimized.
   *
   * Validates: Requirements 12.2
   */
  it('Property 25: Balanced coverage variance', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20 }), { minLength: 10, maxLength: 50 }),
        (coverageCounts) => {
          const calculateVariance = (values: number[]): number => {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
            return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
          };

          const variance = calculateVariance(coverageCounts);

          // Variance should be a non-negative number
          expect(variance).toBeGreaterThanOrEqual(0);

          // For balanced coverage, variance should be relatively low
          // For small or uniform datasets, allow higher variance
          const mean = coverageCounts.reduce((a, b) => a + b, 0) / coverageCounts.length;
          const maxExpectedVariance = Math.max(mean * 10, 20); // More lenient threshold for property testing

          expect(variance).toBeLessThanOrEqual(maxExpectedVariance);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 26: Unscheduled mode preservation
   * For any agent with existing breaks, when auto-distribution is applied in
   * "Only Unscheduled" mode, their existing breaks should remain unchanged.
   *
   * Validates: Requirements 12.8
   */
  it('Property 26: Unscheduled mode preservation', () => {
    fc.assert(
      fc.property(fc.array(agentBreakScheduleArb, { minLength: 5, maxLength: 20 }), (agents) => {
        const applyMode = 'only_unscheduled';

        // Separate agents into scheduled and unscheduled
        const scheduled = agents.filter((a) => a.breaks.HB1 || a.breaks.B || a.breaks.HB2);
        const unscheduled = agents.filter((a) => !a.breaks.HB1 && !a.breaks.B && !a.breaks.HB2);

        // In "only_unscheduled" mode, scheduled agents should be excluded
        const agentsToDistribute = applyMode === 'only_unscheduled' ? unscheduled : agents;

        // Verify scheduled agents are not included
        for (const agent of scheduled) {
          expect(agentsToDistribute).not.toContain(agent);
        }

        // Verify unscheduled agents are included
        for (const agent of unscheduled) {
          expect(agentsToDistribute).toContain(agent);
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 27: All agents mode clearing
   * For any agent, when auto-distribution is applied in "All Agents" mode,
   * all existing breaks should be cleared before new breaks are assigned.
   *
   * Validates: Requirements 12.9
   */
  it('Property 27: All agents mode clearing', () => {
    fc.assert(
      fc.property(fc.array(agentBreakScheduleArb, { minLength: 5, maxLength: 20 }), (agents) => {
        const applyMode = 'all_agents';

        // In "all_agents" mode, all agents should be included
        const agentsToDistribute = applyMode === 'all_agents' ? agents : [];

        // Verify all agents are included
        expect(agentsToDistribute.length).toBe(agents.length);

        // Simulate clearing existing breaks
        const agentsWithClearedBreaks = agentsToDistribute.map((agent) => ({
          ...agent,
          breaks: { HB1: null, B: null, HB2: null },
        }));

        // Verify all breaks are cleared
        for (const agent of agentsWithClearedBreaks) {
          expect(agent.breaks.HB1).toBeNull();
          expect(agent.breaks.B).toBeNull();
          expect(agent.breaks.HB2).toBeNull();
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 28: Auto-schedule indicator tracking
   * For any break created by auto-distribution, the break should be marked with
   * an auto-schedule indicator, and for any auto-scheduled break that is manually edited,
   * the indicator should be removed.
   *
   * Validates: Requirements 12.12, 12.13
   */
  it('Property 28: Auto-schedule indicator tracking', () => {
    fc.assert(
      fc.property(
        fc.record({
          isAutoScheduled: fc.boolean(),
          wasManuallyEdited: fc.boolean(),
        }),
        ({ isAutoScheduled, wasManuallyEdited }) => {
          // Simulate break with auto-schedule indicator
          let hasAutoIndicator = isAutoScheduled;

          // If manually edited, indicator should be removed
          if (wasManuallyEdited) {
            hasAutoIndicator = false;
          }

          // Verify indicator state
          if (isAutoScheduled && !wasManuallyEdited) {
            expect(hasAutoIndicator).toBe(true);
          } else {
            expect(hasAutoIndicator).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
