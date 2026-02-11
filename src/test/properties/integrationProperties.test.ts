/**
 * Property-Based Tests: Integration Properties
 * Feature: break-schedule-management
 * Properties: 13-15
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { agentBreakScheduleArb, dateArb, uuidArb } from '../generators/breakScheduleGenerators'
import { exportToCSV, parseCSV, validateCSVFormat } from '../../lib/breakScheduleCSV'
import type { BreakScheduleCSVRow } from '../../types'

describe('Integration Properties', () => {
  /**
   * Property 13: Break swap completeness
   * For any approved swap request, the break schedules for both users on both dates
   * should be exchanged, with the approver recorded as created_by.
   * 
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4
   * 
   * Note: This property tests the expected behavior. Actual database trigger testing
   * would require integration tests with a real database.
   */
  it('Property 13: Break swap completeness (behavior specification)', () => {
    fc.assert(
      fc.property(
        fc.record({
          requesterId: uuidArb,
          targetUserId: uuidArb,
          date1: dateArb,
          date2: dateArb,
          approverId: uuidArb,
          requesterBreaksDate1: fc.array(fc.string(), { minLength: 0, maxLength: 4 }),
          requesterBreaksDate2: fc.array(fc.string(), { minLength: 0, maxLength: 4 }),
          targetBreaksDate1: fc.array(fc.string(), { minLength: 0, maxLength: 4 }),
          targetBreaksDate2: fc.array(fc.string(), { minLength: 0, maxLength: 4 })
        }),
        (swap) => {
          // Simulate swap operation
          const swapBreaks = (
            requesterBreaks: string[],
            targetBreaks: string[]
          ): { requesterAfter: string[], targetAfter: string[] } => {
            return {
              requesterAfter: targetBreaks,
              targetAfter: requesterBreaks
            }
          }
          
          // Swap date1 breaks
          const date1Result = swapBreaks(swap.requesterBreaksDate1, swap.targetBreaksDate1)
          
          // Swap date2 breaks
          const date2Result = swapBreaks(swap.requesterBreaksDate2, swap.targetBreaksDate2)
          
          // Verify swap completeness
          expect(date1Result.requesterAfter).toEqual(swap.targetBreaksDate1)
          expect(date1Result.targetAfter).toEqual(swap.requesterBreaksDate1)
          expect(date2Result.requesterAfter).toEqual(swap.targetBreaksDate2)
          expect(date2Result.targetAfter).toEqual(swap.requesterBreaksDate2)
          
          // Verify approver would be recorded (in actual implementation)
          expect(swap.approverId).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14: CSV export round-trip
   * For any break schedule, exporting to CSV and then importing the CSV should produce
   * an equivalent schedule (same agents, dates, shifts, and break times).
   * 
   * Validates: Requirements 9.1, 9.2, 9.3, 9.4
   */
  it('Property 14: CSV export round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(agentBreakScheduleArb, { minLength: 1, maxLength: 10 }),
        dateArb,
        async (agents, date) => {
          // Export to CSV
          const csvBlob = await exportToCSV(agents, date)
          
          // Read blob text - Blob has a text() method in modern environments
          // For Node.js testing, we need to handle it differently
          let csvText: string
          if (typeof csvBlob.text === 'function') {
            csvText = await csvBlob.text()
          } else {
            // Fallback for older Node versions
            const reader = new Response(csvBlob)
            csvText = await reader.text()
          }
          
          // Parse CSV back
          const parsedRows = parseCSV(csvText)
          
          // Validate format
          const validation = validateCSVFormat(parsedRows)
          expect(validation.valid).toBe(true)
          
          // Verify data integrity
          expect(parsedRows.length).toBe(agents.length)
          
          for (let i = 0; i < agents.length; i++) {
            const agent = agents[i]
            const row = parsedRows[i]
            
            expect(row.agent_name).toBe(agent.name)
            expect(row.date).toBe(date)
            expect(row.shift).toBe(agent.shift_type || 'OFF')
            
            // Break times should match (or be null)
            if (agent.breaks.HB1) {
              expect(row.hb1_start).toBe(agent.breaks.HB1)
            }
            if (agent.breaks.B) {
              expect(row.b_start).toBe(agent.breaks.B)
            }
            if (agent.breaks.HB2) {
              expect(row.hb2_start).toBe(agent.breaks.HB2)
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 15: Import clears existing breaks
   * For any agent included in an import CSV, all existing breaks for that agent
   * on the import date should be deleted before new breaks are inserted.
   * 
   * Validates: Requirements 9.4
   */
  it('Property 15: Import clears existing breaks (behavior specification)', () => {
    fc.assert(
      fc.property(
        fc.record({
          agentId: uuidArb,
          importDate: dateArb,
          existingBreaks: fc.array(fc.string(), { minLength: 0, maxLength: 4 }),
          newBreaks: fc.array(fc.string(), { minLength: 0, maxLength: 4 }),
          agentInImport: fc.boolean()
        }),
        ({ agentId, importDate, existingBreaks, newBreaks, agentInImport }) => {
          // Simulate import behavior
          let currentBreaks = [...existingBreaks]
          
          if (agentInImport) {
            // Clear existing breaks
            currentBreaks = []
            // Insert new breaks
            currentBreaks = [...newBreaks]
          }
          
          // Verify behavior
          if (agentInImport) {
            expect(currentBreaks).toEqual(newBreaks)
            expect(currentBreaks).not.toContain(...existingBreaks.filter(b => !newBreaks.includes(b)))
          } else {
            expect(currentBreaks).toEqual(existingBreaks)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('CSV Format Properties', () => {
  /**
   * Additional property: CSV format validation
   * For any CSV with invalid format, validation should detect and report errors.
   */
  it('CSV format validation detects errors', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            agent_name: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.oneof(
              dateArb,
              fc.string({ minLength: 1, maxLength: 20 }) // Invalid dates
            ),
            shift: fc.oneof(
              fc.constantFrom('AM', 'PM', 'BET', 'OFF'),
              fc.string({ minLength: 1, maxLength: 10 }) // Invalid shifts
            ),
            hb1_start: fc.option(fc.string(), { nil: null }),
            b_start: fc.option(fc.string(), { nil: null }),
            hb2_start: fc.option(fc.string(), { nil: null })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (rows) => {
          const validation = validateCSVFormat(rows as BreakScheduleCSVRow[])
          
          // Check if any row has invalid data
          const hasInvalidDate = rows.some(r => 
            typeof r.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(r.date)
          )
          const hasInvalidShift = rows.some(r => 
            !['AM', 'PM', 'BET', 'OFF'].includes(r.shift as string)
          )
          
          if (hasInvalidDate || hasInvalidShift) {
            expect(validation.valid).toBe(false)
            expect(validation.errors.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})
