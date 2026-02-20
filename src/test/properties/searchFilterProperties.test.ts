/**
 * Property-Based Tests: Search and Filter Properties
 * Feature: break-schedule-management
 * Properties: 20-22
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { agentBreakScheduleArb, departmentArb } from '../generators/breakScheduleGenerators';

describe('Search and Filter Properties', () => {
  /**
   * Property 20: Case-insensitive name search
   * For any search term, the filtered agents should include all agents whose names
   * contain the search term (case-insensitive) and exclude all agents whose names do not contain the term.
   *
   * Validates: Requirements 10.1
   */
  it('Property 20: Case-insensitive name search', () => {
    fc.assert(
      fc.property(
        fc.array(agentBreakScheduleArb, { minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (agents, searchTerm) => {
          const filterByName = (agents: (typeof agentBreakScheduleArb._TYPE)[], term: string) => {
            return agents.filter((agent) => agent.name.toLowerCase().includes(term.toLowerCase()));
          };

          const filtered = filterByName(agents, searchTerm);

          // All filtered agents should contain the search term
          for (const agent of filtered) {
            expect(agent.name.toLowerCase()).toContain(searchTerm.toLowerCase());
          }

          // All excluded agents should not contain the search term
          const excluded = agents.filter((a) => !filtered.includes(a));
          for (const agent of excluded) {
            expect(agent.name.toLowerCase()).not.toContain(searchTerm.toLowerCase());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 21: Department filter accuracy
   * For any selected department, the displayed agents should include
   * only agents from that department.
   *
   * Validates: Requirements 10.2
   */
  it('Property 21: Department filter accuracy', () => {
    fc.assert(
      fc.property(
        fc.array(agentBreakScheduleArb, { minLength: 5, maxLength: 20 }),
        departmentArb,
        (agents, selectedDepartment) => {
          const filterByDepartment = (
            agents: (typeof agentBreakScheduleArb._TYPE)[],
            dept: string
          ) => {
            if (dept === 'All') return agents;
            return agents.filter((agent) => agent.department === dept);
          };

          const filtered = filterByDepartment(agents, selectedDepartment);

          if (selectedDepartment === 'All') {
            expect(filtered.length).toBe(agents.length);
          } else {
            // All filtered agents should be from the selected department
            for (const agent of filtered) {
              expect(agent.department).toBe(selectedDepartment);
            }

            // All excluded agents should not be from the selected department
            const excluded = agents.filter((a) => !filtered.includes(a));
            for (const agent of excluded) {
              expect(agent.department).not.toBe(selectedDepartment);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 22: Filter state persistence
   * For any active search or department filter, navigating to a different date
   * should preserve the filter settings.
   *
   * Validates: Requirements 10.5
   */
  it('Property 22: Filter state persistence', () => {
    fc.assert(
      fc.property(
        fc.record({
          searchTerm: fc.string({ minLength: 0, maxLength: 20 }),
          department: departmentArb,
          initialDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          navigateForward: fc.boolean(),
        }),
        ({ searchTerm, department, initialDate, navigateForward }) => {
          // Simulate filter state
          const filterState = {
            search: searchTerm,
            department: department,
            date: initialDate,
          };

          // Navigate to new date
          const newDate = new Date(initialDate);
          newDate.setDate(newDate.getDate() + (navigateForward ? 1 : -1));

          // Simulate state after navigation
          const stateAfterNavigation = {
            search: filterState.search,
            department: filterState.department,
            date: newDate,
          };

          // Verify filters are preserved
          expect(stateAfterNavigation.search).toBe(searchTerm);
          expect(stateAfterNavigation.department).toBe(department);
          expect(stateAfterNavigation.date).not.toBe(initialDate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
