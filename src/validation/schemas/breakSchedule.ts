/**
 * Break schedule validation schemas
 * Zod schemas for break schedule data validation
 */

import { z } from 'zod'
import { uuidSchema, isoDateSchema, timeSchema } from './common'
import { shiftTypeSchema } from './swapRequest'

// ============================================
// Base Schemas
// ============================================

export const breakTypeSchema = z.enum(['IN', 'HB1', 'B', 'HB2'])

export const ruleTypeSchema = z.enum(['distribution', 'ordering', 'timing', 'coverage'])

export const warningTypeSchema = z.enum(['shift_changed', 'breaks_cleared', 'swap_pending'])

export const severitySchema = z.enum(['error', 'warning'])

export const distributionStrategySchema = z.enum(['balanced_coverage', 'staggered_timing'])

export const applyModeSchema = z.enum(['only_unscheduled', 'all_agents'])

// ============================================
// Entity Schemas
// ============================================

export const breakScheduleSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  schedule_date: isoDateSchema,
  shift_type: shiftTypeSchema.nullable(),
  interval_start: timeSchema,
  break_type: breakTypeSchema,
  created_by: uuidSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const breakScheduleRuleSchema = z.object({
  id: uuidSchema,
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
  id: uuidSchema,
  user_id: uuidSchema,
  schedule_date: isoDateSchema,
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
  interval_start: timeSchema,
  break_type: breakTypeSchema,
})

export const breakScheduleUpdateRequestSchema = z.object({
  user_id: uuidSchema,
  schedule_date: isoDateSchema,
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
  user_id: uuidSchema,
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
  date: isoDateSchema,
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
  schedule_date: isoDateSchema,
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
      user_id: uuidSchema,
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
// Type Exports
// ============================================

export type BreakType = z.infer<typeof breakTypeSchema>
export type RuleType = z.infer<typeof ruleTypeSchema>
export type WarningType = z.infer<typeof warningTypeSchema>
export type Severity = z.infer<typeof severitySchema>
export type DistributionStrategy = z.infer<typeof distributionStrategySchema>
export type ApplyMode = z.infer<typeof applyModeSchema>
export type BreakSchedule = z.infer<typeof breakScheduleSchema>
export type BreakScheduleRule = z.infer<typeof breakScheduleRuleSchema>
export type BreakScheduleWarning = z.infer<typeof breakScheduleWarningSchema>
export type IntervalUpdate = z.infer<typeof intervalUpdateSchema>
export type BreakScheduleUpdateRequest = z.infer<typeof breakScheduleUpdateRequestSchema>
export type ValidationViolation = z.infer<typeof validationViolationSchema>
export type BreakScheduleUpdateResponse = z.infer<typeof breakScheduleUpdateResponseSchema>
export type AgentBreakSchedule = z.infer<typeof agentBreakScheduleSchema>
export type BreakScheduleSummary = z.infer<typeof breakScheduleSummarySchema>
export type BreakScheduleResponse = z.infer<typeof breakScheduleResponseSchema>
export type BreakScheduleCSVRow = z.infer<typeof breakScheduleCSVRowSchema>
export type ImportResult = z.infer<typeof importResultSchema>
export type AutoDistributeRequest = z.infer<typeof autoDistributeRequestSchema>
export type AutoDistributePreview = z.infer<typeof autoDistributePreviewSchema>
export type RuleUpdate = z.infer<typeof ruleUpdateSchema>
