// Break Schedules Service

import { supabase } from '../lib/supabase'
import { shiftConfigurationsService } from './shiftConfigurationsService'
import { breakRulesService } from './breakRulesService'
import { BREAK_SCHEDULE } from '../constants'
import type {
  BreakSchedule,
  BreakScheduleResponse,
  AgentBreakSchedule,
  BreakScheduleSummary,
  BreakScheduleWarning,
  BreakScheduleUpdateRequest,
  BreakScheduleUpdateResponse,
  BreakType,
  ShiftType,
  AutoDistributeRequest,
  AutoDistributePreview,
  ValidationViolation,
  BreakScheduleRule,
} from '../types'

const { TABLE_NAMES: BREAK_SCHEDULES_TABLE_NAMES, HOURS, INTERVAL_MINUTES } = BREAK_SCHEDULE

// Unused helper function - kept for potential future use
// function toError(error: unknown): Error {
//   if (error instanceof Error) return error
//   if (typeof error === 'object' && error !== null) {
//     const err = error as { message?: string; code?: string }
//     return new Error(err.message || 'Unknown error')
//   }
//   return new Error(String(error))
// }

/**
 * IntervalMap class for efficient interval lookups with pre-computation support
 * Optimized for building interval maps once and reusing them
 */
class IntervalMap {
  private intervals: Map<string, BreakType> = new Map()
  private breakTimes: Map<BreakType, string[]> = new Map()
  private computed: boolean = false

  /**
   * Pre-compute templates for common shift types
   * This allows faster interval map building for known shift configurations
   */
  static templates: Map<string, Record<string, BreakType>> = new Map()

  /**
   * Initialize a template for a shift type
   */
  static createTemplate(
    shiftType: string,
    shiftHours: { start: string; end: string }
  ): Record<string, BreakType> {
    const intervals: Record<string, BreakType> = {}
    const [shiftStartHour, shiftStartMin] = shiftHours.start.split(':').map(Number)
    const [shiftEndHour, shiftEndMin] = shiftHours.end.split(':').map(Number)
    const shiftStartMinutes = shiftStartHour * 60 + shiftStartMin
    const shiftEndMinutes = shiftEndHour * 60 + shiftEndMin

    for (let hour = HOURS.START; hour < HOURS.END; hour++) {
      for (let minute = 0; minute < 60; minute += INTERVAL_MINUTES) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const intervalMinutes = hour * 60 + minute

        if (intervalMinutes >= shiftStartMinutes && intervalMinutes < shiftEndMinutes) {
          intervals[timeStr] = 'IN'
        }
      }
    }

    this.templates.set(shiftType, intervals)
    return intervals
  }

  /**
   * Get or create a template for a shift type
   */
  static getTemplate(shiftType: string, shiftHours: { start: string; end: string }): Record<string, BreakType> {
    let template = this.templates.get(shiftType)
    if (!template) {
      template = this.createTemplate(shiftType, shiftHours)
    }
    return template
  }

  /**
   * Clear all cached templates
   */
  static clearTemplates(): void {
    this.templates.clear()
  }

  /**
   * Build interval map from schedules using pre-computed templates
   */
  buildFromSchedules(
    schedules: BreakSchedule[],
    shiftType: ShiftType,
    shiftHours: Record<string, { start: string; end: string } | null>
  ): this {
    // Clear existing data
    this.intervals.clear()
    this.breakTimes.clear()
    this.computed = false

    // Use pre-computed template if available
    if (shiftType && shiftType !== 'OFF' && shiftHours[shiftType]) {
      const template = IntervalMap.getTemplate(shiftType, shiftHours[shiftType]!)
      // Copy template values
      for (const [time, value] of Object.entries(template)) {
        this.intervals.set(time, value)
      }
    }

    // Override with actual break schedules
    for (const schedule of schedules) {
      const time = schedule.interval_start.substring(0, 5)
      this.intervals.set(time, schedule.break_type)
    }

    // Build break times index for faster lookups
    for (const [time, breakType] of this.intervals) {
      if (breakType !== 'IN') {
        const times = this.breakTimes.get(breakType) || []
        times.push(time)
        this.breakTimes.set(breakType, times)
      }
    }

    this.computed = true
    return this
  }

  /**
   * Get value at a specific interval
   */
  get(time: string): BreakType | undefined {
    return this.intervals.get(time)
  }

  /**
   * Set value at a specific interval
   */
  set(time: string, value: BreakType): this {
    this.intervals.set(time, value)
    this.computed = false
    return this
  }

  /**
   * Get all break times for a specific break type
   */
  getBreakTimes(breakType: BreakType): string[] {
    return this.breakTimes.get(breakType) || []
  }

  /**
   * Get first break time for a specific break type
   */
  getFirstBreakTime(breakType: BreakType): string | null {
    const times = this.breakTimes.get(breakType)
    return times && times.length > 0 ? times[0] : null
  }

  /**
   * Get all entries as a plain object
   */
  toObject(): Record<string, BreakType> {
    const result: Record<string, BreakType> = {}
    for (const [key, value] of this.intervals) {
      result[key] = value
    }
    return result
  }

  /**
   * Check if the map has been computed
   */
  isComputed(): boolean {
    return this.computed
  }
}

/**
 * Validate break schedule against configured rules
 */
async function validateBreakSchedule(
  userId: string,
  scheduleDate: string,
  intervals: BreakScheduleUpdateRequest['intervals']
): Promise<ValidationViolation[]> {
  const violations: ValidationViolation[] = []

  try {
    // Fetch active break schedule rules
    const rules = await breakRulesService.getActiveRules()

    // Build interval map from the update request
    const intervalMap: Record<string, BreakType> = {}
    for (const interval of intervals) {
      intervalMap[interval.interval_start] = interval.break_type
    }

    // Get user's shift for the date
    const { data: shift } = await supabase
      .from('shifts')
      .select('shift_type')
      .eq('user_id', userId)
      .eq('date', scheduleDate)
      .single()

    const shiftType = shift?.shift_type as ShiftType | null

    // Get shift hours for validation
    const shiftHoursMap = await shiftConfigurationsService.getShiftHoursMap()
    const shiftHours = shiftType ? shiftHoursMap[shiftType] : null

    // Validate against each rule
    for (const rule of rules) {
      const ruleViolations = validateAgainstRule(
        rule,
        intervalMap,
        shiftType,
        shiftHours
      )
      violations.push(...ruleViolations)
    }
  } catch (error) {
    // If validation fails, log but don't block the update
    console.error('Error validating break schedule:', error)
  }

  return violations
}

/**
 * Validate break schedule against a single rule
 */
function validateAgainstRule(
  rule: BreakScheduleRule,
  intervalMap: Record<string, BreakType>,
  shiftType: ShiftType | null,
  shiftHours: { start: string; end: string } | null
): ValidationViolation[] {
  const violations: ValidationViolation[] = []

  switch (rule.rule_type) {
    case 'ordering':
      // Validate break ordering (HB1 -> B -> HB2)
      violations.push(...validateBreakOrdering(rule, intervalMap))
      break

    case 'timing':
      // Validate break timing (within shift hours)
      violations.push(...validateBreakTiming(rule, intervalMap, shiftType, shiftHours))
      break

    case 'coverage':
      // Validate break coverage requirements
      violations.push(...validateBreakCoverage(rule, intervalMap))
      break

    case 'distribution':
      // Validate break distribution rules
      violations.push(...validateBreakDistribution(rule, intervalMap))
      break
  }

  return violations
}

/**
 * Validate break ordering (HB1 -> B -> HB2)
 */
function validateBreakOrdering(
  rule: BreakScheduleRule,
  intervalMap: Record<string, BreakType>
): ValidationViolation[] {
  const violations: ValidationViolation[] = []

  // Extract break times
  const breakTimes: Record<string, number> = {}
  for (const [time, breakType] of Object.entries(intervalMap)) {
    if (breakType !== 'IN') {
      const [hours, minutes] = time.split(':').map(Number)
      breakTimes[breakType] = hours * 60 + minutes
    }
  }

  // Check ordering constraints
  if (breakTimes.HB1 && breakTimes.B && breakTimes.HB1 >= breakTimes.B) {
    violations.push({
      rule_name: rule.rule_name,
      message: 'HB1 must come before B (lunch break)',
      severity: rule.is_blocking ? 'error' : 'warning',
      affected_intervals: Object.keys(intervalMap).filter(
        (t) => intervalMap[t] === 'HB1' || intervalMap[t] === 'B'
      ),
    })
  }

  if (breakTimes.B && breakTimes.HB2 && breakTimes.B >= breakTimes.HB2) {
    violations.push({
      rule_name: rule.rule_name,
      message: 'B (lunch) must come before HB2',
      severity: rule.is_blocking ? 'error' : 'warning',
      affected_intervals: Object.keys(intervalMap).filter(
        (t) => intervalMap[t] === 'B' || intervalMap[t] === 'HB2'
      ),
    })
  }

  if (breakTimes.HB1 && breakTimes.HB2 && breakTimes.HB1 >= breakTimes.HB2) {
    violations.push({
      rule_name: rule.rule_name,
      message: 'HB1 must come before HB2',
      severity: rule.is_blocking ? 'error' : 'warning',
      affected_intervals: Object.keys(intervalMap).filter(
        (t) => intervalMap[t] === 'HB1' || intervalMap[t] === 'HB2'
      ),
    })
  }

  return violations
}

/**
 * Validate break timing (within shift hours)
 */
function validateBreakTiming(
  rule: BreakScheduleRule,
  intervalMap: Record<string, BreakType>,
  _shiftType: ShiftType | null,
  shiftHours: { start: string; end: string } | null
): ValidationViolation[] {
  const violations: ValidationViolation[] = []

  // If no shift hours defined, skip timing validation
  if (!shiftHours) {
    return violations
  }

  const [shiftStartHour, shiftStartMin] = shiftHours.start.split(':').map(Number)
  const [shiftEndHour, shiftEndMin] = shiftHours.end.split(':').map(Number)
  const shiftStartMinutes = shiftStartHour * 60 + shiftStartMin
  const shiftEndMinutes = shiftEndHour * 60 + shiftEndMin

  for (const [time, breakType] of Object.entries(intervalMap)) {
    if (breakType !== 'IN') {
      const [hours, minutes] = time.split(':').map(Number)
      const intervalMinutes = hours * 60 + minutes

      // Check if break is within shift hours
      if (intervalMinutes < shiftStartMinutes || intervalMinutes >= shiftEndMinutes) {
        violations.push({
          rule_name: rule.rule_name,
          message: `${breakType} break at ${time} is outside shift hours (${shiftHours.start} - ${shiftHours.end})`,
          severity: rule.is_blocking ? 'error' : 'warning',
          affected_intervals: [time],
        })
      }
    }
  }

  return violations
}

/**
 * Validate break coverage requirements
 */
function validateBreakCoverage(
  rule: BreakScheduleRule,
  intervalMap: Record<string, BreakType>
): ValidationViolation[] {
  const violations: ValidationViolation[] = []

  // Check if required breaks are present
  const hasHB1 = Object.values(intervalMap).includes('HB1')
  const hasB = Object.values(intervalMap).includes('B')
  const hasHB2 = Object.values(intervalMap).includes('HB2')

  const params = rule.parameters as { required_breaks?: string[] }
  const requiredBreaks = params.required_breaks || ['HB1', 'B', 'HB2']

  if (requiredBreaks.includes('HB1') && !hasHB1) {
    violations.push({
      rule_name: rule.rule_name,
      message: 'HB1 (first break) is required',
      severity: rule.is_blocking ? 'error' : 'warning',
    })
  }

  if (requiredBreaks.includes('B') && !hasB) {
    violations.push({
      rule_name: rule.rule_name,
      message: 'B (lunch break) is required',
      severity: rule.is_blocking ? 'error' : 'warning',
    })
  }

  if (requiredBreaks.includes('HB2') && !hasHB2) {
    violations.push({
      rule_name: rule.rule_name,
      message: 'HB2 (second break) is required',
      severity: rule.is_blocking ? 'error' : 'warning',
    })
  }

  return violations
}

/**
 * Validate break distribution rules
 */
function validateBreakDistribution(
  rule: BreakScheduleRule,
  intervalMap: Record<string, BreakType>
): ValidationViolation[] {
  const violations: ValidationViolation[] = []

  // Distribution rules are typically handled by auto-distribution
  // This is a placeholder for future distribution validation logic
  // For now, we just check that breaks are not all at the same time

  const breakTimes = Object.keys(intervalMap).filter(
    (t) => intervalMap[t] !== 'IN'
  )

  if (breakTimes.length > 0) {
    const uniqueTimes = new Set(breakTimes)
    if (uniqueTimes.size === 1) {
      violations.push({
        rule_name: rule.rule_name,
        message: 'All breaks are scheduled at the same time',
        severity: rule.is_blocking ? 'error' : 'warning',
        affected_intervals: breakTimes,
      })
    }
  }

  return violations
}

/**
 * Convert break schedules to interval map using optimized IntervalMap class
 */
function buildIntervalMap(
  schedules: BreakSchedule[],
  shiftType: ShiftType,
  shiftHours: Record<string, { start: string; end: string } | null>
): Record<string, BreakType> {
  return new IntervalMap()
    .buildFromSchedules(schedules, shiftType, shiftHours)
    .toObject()
}

/**
 * Extract break start times from intervals
 */
function extractBreakTimes(intervals: Record<string, BreakType>): {
  HB1: string | null
  B: string | null
  HB2: string | null
} {
  const breaks = { HB1: null as string | null, B: null as string | null, HB2: null as string | null }

  for (const [time, breakType] of Object.entries(intervals)) {
    if (breakType === 'HB1' && !breaks.HB1) {
      breaks.HB1 = time
    } else if (breakType === 'B' && !breaks.B) {
      breaks.B = time
    } else if (breakType === 'HB2' && !breaks.HB2) {
      breaks.HB2 = time
    }
  }

  return breaks
}

export const breakSchedulesService = {
  /**
   * Get break schedules for a specific date
   */
  async getScheduleForDate(
    date: string,
    department?: string
  ): Promise<BreakScheduleResponse> {
    // Fetch shift hours from database
    const shiftHours = await shiftConfigurationsService.getShiftHoursMap()
    
    // Fetch shifts for the date
    let shiftsQuery = supabase
      .from('shifts')
      .select('*, users(id, name, department)')
      .eq('date', date)

    if (department && department !== 'All') {
      shiftsQuery = shiftsQuery.eq('users.department', department)
    }

    const { data: shifts, error: shiftsError } = await shiftsQuery

    if (shiftsError) throw shiftsError

    // Fetch break schedules for the date
    const { data: breakSchedules, error: breaksError } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
      .select('*')
      .eq('schedule_date', date)

    if (breaksError) throw breaksError

    // Fetch warnings for the date
    const { data: warnings, error: warningsError } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.WARNINGS)
      .select('*')
      .eq('schedule_date', date)
      .eq('is_resolved', false)

    if (warningsError) throw warningsError

    // Build agent schedules
    const agents: AgentBreakSchedule[] = []
    const coverageCounts: Record<string, { in: number; hb1: number; b: number; hb2: number }> = {}

    for (const shift of shifts || []) {
      const user = shift.users as { id: string; name: string; department?: string } | null
      if (!user) continue

      const userBreaks = (breakSchedules || []).filter(
        (b: BreakSchedule) => b.user_id === user.id
      )

      const userWarning = (warnings || []).find(
        (w: BreakScheduleWarning) => w.user_id === user.id
      )

      const intervals = buildIntervalMap(userBreaks, shift.shift_type, shiftHours)
      const breakTimes = extractBreakTimes(intervals)

      agents.push({
        user_id: user.id,
        name: user.name,
        shift_type: shift.shift_type,
        department: user.department || '',
        has_warning: !!userWarning,
        warning_details: userWarning || null,
        breaks: breakTimes,
        intervals,
      })

      // Update coverage counts
      for (const [interval, breakType] of Object.entries(intervals)) {
        if (!coverageCounts[interval]) {
          coverageCounts[interval] = { in: 0, hb1: 0, b: 0, hb2: 0 }
        }

        if (breakType === 'IN') coverageCounts[interval].in++
        else if (breakType === 'HB1') coverageCounts[interval].hb1++
        else if (breakType === 'B') coverageCounts[interval].b++
        else if (breakType === 'HB2') coverageCounts[interval].hb2++
      }
    }

    return {
      agents,
      summary: coverageCounts,
    }
  },

  /**
   * Get coverage summary for a date
   */
  async getCoverageSummary(date: string): Promise<BreakScheduleSummary> {
    const response = await this.getScheduleForDate(date)
    return response.summary
  },

  /**
   * Get unresolved warnings for a date
   */
  async getWarnings(date: string): Promise<BreakScheduleWarning[]> {
    const { data, error } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.WARNINGS)
      .select('*')
      .eq('schedule_date', date)
      .eq('is_resolved', false)

    if (error) throw error
    return data as BreakScheduleWarning[]
  },

  /**
   * Update break schedule for a user
   */
  async updateBreakSchedule(
    request: BreakScheduleUpdateRequest
  ): Promise<BreakScheduleUpdateResponse> {
    const { user_id, schedule_date, intervals } = request

    // Validate input parameters
    if (!user_id || typeof user_id !== 'string' || user_id.trim() === '') {
      return {
        success: false,
        violations: [{
          rule_name: 'input_validation',
          message: 'user_id is required and must be a non-empty string',
          severity: 'error',
        }],
      }
    }

    if (!schedule_date || typeof schedule_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(schedule_date)) {
      return {
        success: false,
        violations: [{
          rule_name: 'input_validation',
          message: 'schedule_date must be a valid date string in YYYY-MM-DD format',
          severity: 'error',
        }],
      }
    }

    if (!Array.isArray(intervals) || intervals.length === 0) {
      return {
        success: false,
        violations: [{
          rule_name: 'input_validation',
          message: 'intervals must be a non-empty array',
          severity: 'error',
        }],
      }
    }

    // Validate each interval
    for (const interval of intervals) {
      if (!interval.interval_start || typeof interval.interval_start !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(interval.interval_start)) {
        return {
          success: false,
          violations: [{
            rule_name: 'input_validation',
            message: 'interval_start must be a valid time string in HH:MM or HH:MM:SS format',
            severity: 'error',
            affected_intervals: [interval.interval_start],
          }],
        }
      }

      if (!interval.break_type || !['IN', 'HB1', 'B', 'HB2'].includes(interval.break_type)) {
        return {
          success: false,
          violations: [{
            rule_name: 'input_validation',
            message: 'break_type must be one of: IN, HB1, B, HB2',
            severity: 'error',
            affected_intervals: [interval.interval_start],
          }],
        }
      }
    }

    // Get user's shift for the date
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('shift_type')
      .eq('user_id', user_id)
      .eq('date', schedule_date)
      .single()

    if (shiftError) throw shiftError

    // Process each interval update
    for (const interval of intervals) {
      const intervalStart = interval.interval_start
      const breakType = interval.break_type

      if (breakType === 'IN') {
        // If changing to 'IN', delete the break at this interval if it exists
        const { error: deleteError } = await supabase
          .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
          .delete()
          .eq('user_id', user_id)
          .eq('schedule_date', schedule_date)
          .eq('interval_start', intervalStart)

        if (deleteError) throw deleteError
      } else {
        // If setting a break type (HB1, B, HB2)
        // First, delete any existing break of the same type at any time
        const { error: deleteOldError } = await supabase
          .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
          .delete()
          .eq('user_id', user_id)
          .eq('schedule_date', schedule_date)
          .eq('break_type', breakType)

        if (deleteOldError) throw deleteOldError

        // Prepare intervals to insert
        // B (lunch) breaks span 2 consecutive 15-minute intervals (30 minutes)
        // HB1 and HB2 are single 15-minute intervals
        const intervalsToInsert: Array<{
          user_id: string
          schedule_date: string
          shift_type: ShiftType | null
          interval_start: string
          break_type: BreakType
        }> = []

        // Add the first interval
        intervalsToInsert.push({
          user_id,
          schedule_date,
          shift_type: shift.shift_type,
          interval_start: intervalStart,
          break_type: breakType,
        })

        // If it's a B (lunch) break, add the second consecutive interval
        if (breakType === 'B') {
          // Parse the time and add 15 minutes
          const [hours, minutes, seconds = '00'] = intervalStart.split(':').map(Number)
          const totalMinutes = hours * 60 + minutes + 15
          const newHours = Math.floor(totalMinutes / 60)
          const newMinutes = totalMinutes % 60
          const secondIntervalStart = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

          intervalsToInsert.push({
            user_id,
            schedule_date,
            shift_type: shift.shift_type,
            interval_start: secondIntervalStart,
            break_type: breakType,
          })
        }

        // Insert all intervals
        const { error: upsertError } = await supabase
          .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
          .upsert(intervalsToInsert, {
            onConflict: 'user_id,schedule_date,interval_start',
            ignoreDuplicates: false, // Update if exists
          })

        if (upsertError) throw upsertError
      }
    }

    // Validate against rules and return violations
    const violations = await validateBreakSchedule(user_id, schedule_date, intervals)
    const hasBlockingViolations = violations.some(v => v.severity === 'error')

    return {
      success: !hasBlockingViolations,
      violations,
    }
  },

  /**
   * Bulk update break schedules for multiple users
   */
  async bulkUpdateBreakSchedules(
    updates: BreakScheduleUpdateRequest[]
  ): Promise<BreakScheduleUpdateResponse> {
    const results = await Promise.all(
      updates.map((update) => this.updateBreakSchedule(update))
    )

    const allViolations = results.flatMap((r) => r.violations)

    return {
      success: results.every((r) => r.success),
      violations: allViolations,
    }
  },

  /**
   * Dismiss a warning
   */
  async dismissWarning(warningId: string): Promise<void> {
    const { error } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.WARNINGS)
      .update({ is_resolved: true })
      .eq('id', warningId)

    if (error) throw error
  },

  /**
   * Get break schedule by ID
   */
  async getBreakScheduleById(id: string): Promise<BreakSchedule> {
    const { data, error } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as BreakSchedule
  },

  /**
   * Delete all breaks for a user on a specific date
   */
  async deleteUserBreaks(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
      .delete()
      .eq('user_id', userId)
      .eq('schedule_date', date)

    if (error) throw error
  },

  /**
   * Clear all breaks for all users on a specific date
   */
  async clearAllBreaksForDate(date: string): Promise<void> {
    const { error } = await supabase
      .from(BREAK_SCHEDULES_TABLE_NAMES.SCHEDULES)
      .delete()
      .eq('schedule_date', date)

    if (error) throw error
  },

  /**
   * Auto-distribute breaks
   */
  async autoDistribute(request: AutoDistributeRequest): Promise<AutoDistributePreview> {
    const { generateDistributionPreview, applyDistribution } = await import('../lib/autoDistribution')
    
    // Generate preview
    const preview = await generateDistributionPreview(request)
    
    // Apply the distribution
    await applyDistribution(preview, request.schedule_date)
    
    return preview
  },
}
