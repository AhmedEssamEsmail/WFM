import { z } from 'zod'

// ============================================
// Base Schemas
// ============================================

export const breakTypeSchema = z.enum(['IN', 'HB1', 'B', 'HB2'])

// Flexible shift type schema - accepts any string
// Database is the source of truth for valid shift types
export const shiftTypeSchema = z.string().min(1).max(10)

export const ruleTypeSchema = z.enum(['distribution', 'ordering', 'timing', 'coverage'])

export const warningTypeSchema = z.enum(['shift_changed', 'breaks_cleared', 'swap_pending'])

export const severitySchema = z.enum(['error', 'warning'])

export const distributionStrategySchema = z.enum(['balanced_coverage', 'staggered_timing'])

export const applyModeSchema = z.enum(['only_unscheduled', 'all_agents'])

// ============================================
// Entity Schemas
// ============================================

export const breakScheduleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date format
  shift_type: shiftTypeSchema.nullable(),
  interval_start: z.string().regex(/^\d{2}:\d{2}:\d{2}$/), // Time format HH:MM:SS
  break_type: breakTypeSchema,
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const breakScheduleRuleSchema = z.object({
  id: z.string().uuid(),
  rule_name: z.string().min(1),
  rule_type: ruleTypeSchema,
  description: z.string().nullable(),
  parameters: z.record(z.string(), z.any()),
  is_active: z.boolean(),
  is_blocking: z.boolean(),
  priority: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
})

export const breakScheduleWarningSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  warning_type: warningTypeSchema,
  old_shift_type: shiftTypeSchema.nullable(),
  new_shift_type: shiftTypeSchema.nullable(),
  is_resolved: z.boolean(),
  created_at: z.string(),
})

// ============================================
// Request/Response Schemas
// ============================================

export const intervalUpdateSchema = z.object({
  interval_start: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  break_type: breakTypeSchema,
})

export const breakScheduleUpdateRequestSchema = z.object({
  user_id: z.string().uuid(),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  intervals: z.array(intervalUpdateSchema).min(1),
})

export const validationViolationSchema = z.object({
  rule_name: z.string(),
  message: z.string(),
  severity: severitySchema,
  affected_intervals: z.array(z.string()).optional(),
})

export const breakScheduleUpdateResponseSchema = z.object({
  success: z.boolean(),
  violations: z.array(validationViolationSchema),
})

export const agentBreakScheduleSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string(),
  shift_type: shiftTypeSchema.nullable(),
  department: z.string(),
  has_warning: z.boolean(),
  warning_details: breakScheduleWarningSchema.nullable(),
  breaks: z.object({
    HB1: z.string().nullable(),
    B: z.string().nullable(),
    HB2: z.string().nullable(),
  }),
  intervals: z.record(z.string(), breakTypeSchema),
})

export const breakScheduleSummarySchema = z.record(
  z.string(),
  z.object({
    in: z.number().int().min(0),
    hb1: z.number().int().min(0),
    b: z.number().int().min(0),
    hb2: z.number().int().min(0),
  })
)

export const breakScheduleResponseSchema = z.object({
  agents: z.array(agentBreakScheduleSchema),
  summary: breakScheduleSummarySchema,
})

// ============================================
// CSV Schemas
// ============================================

export const breakScheduleCSVRowSchema = z.object({
  agent_name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift: shiftTypeSchema,
  hb1_start: z.string().nullable(),
  b_start: z.string().nullable(),
  hb2_start: z.string().nullable(),
})

export const importResultSchema = z.object({
  success: z.boolean(),
  imported: z.number().int().min(0),
  errors: z.array(
    z.object({
      row: z.number().int().min(1),
      agent: z.string(),
      error: z.string(),
    })
  ),
})

// ============================================
// Auto-Distribution Schemas
// ============================================

export const autoDistributeRequestSchema = z.object({
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  strategy: distributionStrategySchema,
  apply_mode: applyModeSchema,
  department: z.string().optional(),
})

export const autoDistributePreviewSchema = z.object({
  proposed_schedules: z.array(agentBreakScheduleSchema),
  coverage_stats: z.object({
    min_coverage: z.number().int().min(0),
    max_coverage: z.number().int().min(0),
    avg_coverage: z.number().min(0),
    variance: z.number().min(0),
  }),
  rule_compliance: z.object({
    total_violations: z.number().int().min(0),
    blocking_violations: z.number().int().min(0),
    warning_violations: z.number().int().min(0),
  }),
  failed_agents: z.array(
    z.object({
      user_id: z.string().uuid(),
      name: z.string(),
      reason: z.string(),
      blockedBy: z.array(z.string()).optional(),
    })
  ),
})

// ============================================
// Rule Update Schemas
// ============================================

export const ruleUpdateSchema = z.object({
  parameters: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().optional(),
  is_blocking: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  description: z.string().optional(),
})

// ============================================
// Validation Helpers
// ============================================

/**
 * Validates that a time string is in HH:MM format
 */
export function isValidTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time)
}

/**
 * Validates that a time string is in HH:MM:SS format
 */
export function isValidTimeFormatWithSeconds(time: string): boolean {
  return /^\d{2}:\d{2}:\d{2}$/.test(time)
}

/**
 * Validates that a date string is in YYYY-MM-DD format
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

/**
 * Converts HH:MM:SS to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converts minutes since midnight to HH:MM:SS
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
}

/**
 * Validates that intervals are in 15-minute increments
 */
export function isValid15MinuteInterval(time: string): boolean {
  const minutes = timeToMinutes(time)
  return minutes % 15 === 0
}

/**
 * Generates all 15-minute intervals between start and end times
 */
export function generateIntervals(startTime: string, endTime: string): string[] {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const intervals: string[] = []

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
    intervals.push(minutesToTime(minutes))
  }

  return intervals
}

/**
 * Validates that a break schedule has valid ordering (HB1 -> B -> HB2)
 */
export function validateBreakOrdering(
  intervals: Record<string, string>
): { valid: boolean; error?: string } {
  const breakTimes: Record<string, number> = {}

  for (const [time, breakType] of Object.entries(intervals)) {
    if (breakType !== 'IN') {
      breakTimes[breakType] = timeToMinutes(time)
    }
  }

  if (breakTimes.HB1 && breakTimes.B && breakTimes.HB1 >= breakTimes.B) {
    return { valid: false, error: 'HB1 must come before B' }
  }

  if (breakTimes.B && breakTimes.HB2 && breakTimes.B >= breakTimes.HB2) {
    return { valid: false, error: 'B must come before HB2' }
  }

  if (breakTimes.HB1 && breakTimes.HB2 && breakTimes.HB1 >= breakTimes.HB2) {
    return { valid: false, error: 'HB1 must come before HB2' }
  }

  return { valid: true }
}

/**
 * Calculates the gap in minutes between two break times
 */
export function calculateBreakGap(time1: string, time2: string): number {
  return Math.abs(timeToMinutes(time2) - timeToMinutes(time1))
}
