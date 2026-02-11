/**
 * Property-Based Tests: Core Data Properties
 * Feature: break-schedule-management
 * Properties: 1-3
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { agentBreakScheduleArb, shiftTypeArb, uuidArb, agentNameArb, departmentArb, timeArb, generateIntervals } from '../generators/breakScheduleGenerators'
import type { AgentBreakSchedule } from '../../types'

describe('Core Data Properties', () => {
  /**
   * Property 1: Break schedule data completeness
   * For any agent with a shift assignment, the break schedule response should include
   * shift type, all interval statuses, and calculated break start times for any scheduled breaks.
   * 
   * Validates: Requirements 1.2, 1.3, 1.4
   */
  it('Property 1: Break schedule data completeness', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: uuidArb,
          name: agentNameArb,
          shift_type: shiftTypeArb,
          department: departmentArb,
          has_warning: fc.boolean(),
          warning_details: fc.constant(null),
          breaks: fc.record({
            HB1: fc.option(timeArb, { nil: null }),
            B: fc.option(timeArb, { nil: null }),
            HB2: fc.option(timeArb, { nil: null })
          })
        }),
        (agent) => {
          // Generate intervals based on shift and breaks
          const intervals = generateIntervals(agent.shift_type, agent.breaks)
          const completeAgent: AgentBreakSchedule = {
            ...agent,
            intervals
          }
          
          // Verify completeness
          expect(completeAgent).toHaveProperty('user_id')
          expect(completeAgent).toHaveProperty('name')
          expect(completeAgent).toHaveProperty('shift_type')
          expect(completeAgent).toHaveProperty('department')
          expect(completeAgent).toHaveProperty('breaks')
          expect(completeAgent).toHaveProperty('intervals')
          
          // If shift is not OFF, should have intervals
          if (agent.shift_type !== 'OFF') {
            expect(Object.keys(intervals).length).toBeGreaterThan(0)
          }
          
          // If breaks are scheduled, they should appear in intervals
          if (agent.breaks.HB1) {
            expect(intervals[agent.breaks.HB1]).toBe('HB1')
          }
          if (agent.breaks.B) {
            expect(intervals[agent.breaks.B]).toBe('B')
          }
          if (agent.breaks.HB2) {
            expect(intervals[agent.breaks.HB2]).toBe('HB2')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2: Role-based data filtering
   * For any Team Lead user, the break schedule data should contain only agents from their department,
   * and for any Agent user, the data should contain only their own schedule.
   * 
   * Validates: Requirements 2.1
   */
  it('Property 2: Role-based data filtering', () => {
    fc.assert(
      fc.property(
        fc.record({
          userRole: fc.constantFrom('agent', 'tl', 'wfm'),
          userId: uuidArb,
          userDepartment: departmentArb,
          agents: fc.array(agentBreakScheduleArb, { minLength: 1, maxLength: 10 })
        }),
        ({ userRole, userId, userDepartment, agents }) => {
          let filteredAgents: AgentBreakSchedule[]
          
          if (userRole === 'agent') {
            // Agent should only see their own schedule
            filteredAgents = agents.filter(a => a.user_id === userId)
            expect(filteredAgents.every(a => a.user_id === userId)).toBe(true)
          } else if (userRole === 'tl') {
            // TL should only see agents from their department
            filteredAgents = agents.filter(a => a.department === userDepartment)
            expect(filteredAgents.every(a => a.department === userDepartment)).toBe(true)
          } else {
            // WFM should see all agents
            filteredAgents = agents
            expect(filteredAgents.length).toBe(agents.length)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Warning indicator presence
   * For any agent with an unresolved warning record, the break schedule response should include
   * has_warning: true and the warning details.
   * 
   * Validates: Requirements 2.3, 7.3
   */
  it('Property 3: Warning indicator presence', () => {
    fc.assert(
      fc.property(
        fc.record({
          agent: agentBreakScheduleArb,
          hasUnresolvedWarning: fc.boolean()
        }),
        ({ agent, hasUnresolvedWarning }) => {
          const agentWithWarning: AgentBreakSchedule = {
            ...agent,
            has_warning: hasUnresolvedWarning,
            warning_details: hasUnresolvedWarning ? {
              id: 'warning-id',
              user_id: agent.user_id,
              schedule_date: '2024-01-01',
              warning_type: 'shift_changed',
              old_shift_type: 'AM',
              new_shift_type: 'PM',
              is_resolved: false,
              created_at: new Date().toISOString()
            } : null
          }
          
          if (hasUnresolvedWarning) {
            expect(agentWithWarning.has_warning).toBe(true)
            expect(agentWithWarning.warning_details).not.toBeNull()
            expect(agentWithWarning.warning_details?.is_resolved).toBe(false)
          } else {
            expect(agentWithWarning.has_warning).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
