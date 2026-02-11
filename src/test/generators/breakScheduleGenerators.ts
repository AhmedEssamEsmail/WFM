// Property-Based Test Generators for Break Schedule Management
import * as fc from 'fast-check'
import type { BreakType, ShiftType, AgentBreakSchedule, BreakScheduleRule } from '../../types'

// Basic type generators
export const breakTypeArb = fc.constantFrom<BreakType>('IN', 'HB1', 'B', 'HB2')
export const shiftTypeArb = fc.constantFrom<ShiftType>('AM', 'PM', 'BET', 'OFF')
export const nonOffShiftTypeArb = fc.constantFrom<ShiftType>('AM', 'PM', 'BET')

// Time generators (HH:MM format)
export const timeArb = fc.tuple(
  fc.integer({ min: 9, max: 20 }), // hours 9-20
  fc.constantFrom(0, 15, 30, 45) // minutes in 15-min intervals
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)

// Time with seconds (HH:MM:SS format)
export const timeWithSecondsArb = timeArb.map(t => `${t}:00`)

// Date generator (ISO format)
export const dateArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })
  .filter(d => !isNaN(d.getTime()))
  .map(d => d.toISOString().split('T')[0])

// UUID generator
export const uuidArb = fc.uuid()

// Department generator
export const departmentArb = fc.constantFrom('Sales', 'Support', 'Customer Success', 'Engineering')

// User role generator
export const userRoleArb = fc.constantFrom('agent', 'tl', 'wfm')

// Agent name generator
export const agentNameArb = fc.tuple(
  fc.constantFrom('John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Lisa'),
  fc.constantFrom('Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis')
).map(([first, last]) => `${first} ${last}`)

// Break times generator (ensures proper ordering)
export const orderedBreakTimesArb = fc.record({
  hb1: fc.integer({ min: 0, max: 200 }), // minutes from shift start
  b: fc.integer({ min: 90, max: 300 }),
  hb2: fc.integer({ min: 180, max: 400 })
}).filter(times => times.hb1 < times.b && times.b < times.hb2)

// Convert minutes to time string
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) + 9 // Start from 9:00
  const mins = minutes % 60
  const roundedMins = Math.floor(mins / 15) * 15
  return `${hours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`
}

// Agent break schedule generator
export const agentBreakScheduleArb = fc.record({
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
  }),
  intervals: fc.constant({})
}).chain(agent => {
  // OFF shifts should not have any breaks scheduled
  if (agent.shift_type === 'OFF') {
    return fc.constant({
      ...agent,
      breaks: { HB1: null, B: null, HB2: null }
    })
  }
  return fc.constant(agent)
})

// Break schedule rule generator
export const breakScheduleRuleArb = fc.record({
  id: uuidArb,
  rule_name: fc.constantFrom('break_ordering', 'minimum_gap', 'maximum_gap', 'shift_boundary'),
  rule_type: fc.constantFrom<'distribution' | 'ordering' | 'timing' | 'coverage'>('ordering', 'timing', 'coverage', 'distribution'),
  description: fc.string(),
  parameters: fc.constant({}),
  is_active: fc.boolean(),
  is_blocking: fc.boolean(),
  priority: fc.integer({ min: 1, max: 10 }),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString())
})

// Interval map generator
export function generateIntervals(shiftType: ShiftType, breaks: { HB1: string | null, B: string | null, HB2: string | null }): Record<string, BreakType> {
  const intervals: Record<string, BreakType> = {}
  
  const shiftHours: Record<ShiftType, { start: number, end: number } | null> = {
    AM: { start: 9, end: 17 },
    PM: { start: 13, end: 21 },
    BET: { start: 11, end: 19 },
    OFF: null
  }
  
  const hours = shiftHours[shiftType]
  if (!hours) return intervals
  
  // Generate all intervals for shift
  for (let h = hours.start; h < hours.end; h++) {
    for (const m of [0, 15, 30, 45]) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      intervals[time] = 'IN'
    }
  }
  
  // Apply breaks
  if (breaks.HB1) {
    intervals[breaks.HB1] = 'HB1'
  }
  if (breaks.B) {
    intervals[breaks.B] = 'B'
    // B is 30 minutes, so mark next interval too
    const [h, m] = breaks.B.split(':').map(Number)
    const nextM = m + 15
    const nextTime = `${h.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`
    if (intervals[nextTime]) {
      intervals[nextTime] = 'B'
    }
  }
  if (breaks.HB2) {
    intervals[breaks.HB2] = 'HB2'
  }
  
  return intervals
}

// Coverage summary generator
export const coverageSummaryArb = fc.dictionary(
  timeArb,
  fc.record({
    in: fc.integer({ min: 0, max: 20 }),
    hb1: fc.integer({ min: 0, max: 5 }),
    b: fc.integer({ min: 0, max: 5 }),
    hb2: fc.integer({ min: 0, max: 5 })
  })
)
