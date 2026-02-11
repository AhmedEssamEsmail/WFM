// Break Schedules Service

import { supabase } from '../lib/supabase'
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
} from '../types'

const BREAK_SCHEDULES_TABLE = 'break_schedules'
const BREAK_WARNINGS_TABLE = 'break_schedule_warnings'

/**
 * Shift hours configuration
 */
const SHIFT_HOURS: Record<ShiftType, { start: string; end: string } | null> = {
  AM: { start: '09:00:00', end: '17:00:00' },
  PM: { start: '13:00:00', end: '21:00:00' },
  BET: { start: '11:00:00', end: '19:00:00' },
  OFF: null,
}

/**
 * Convert break schedules to interval map
 */
function buildIntervalMap(
  schedules: BreakSchedule[],
  shiftType: ShiftType
): Record<string, BreakType> {
  const intervals: Record<string, BreakType> = {}

  // Initialize all intervals from 9:00 AM to 9:00 PM as 'IN' for agents with shifts
  if (shiftType && shiftType !== 'OFF') {
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Check if this interval is within the agent's shift hours
        const shiftHours = SHIFT_HOURS[shiftType]
        if (shiftHours) {
          const [shiftStartHour, shiftStartMin] = shiftHours.start.split(':').map(Number)
          const [shiftEndHour, shiftEndMin] = shiftHours.end.split(':').map(Number)
          
          const intervalMinutes = hour * 60 + minute
          const shiftStartMinutes = shiftStartHour * 60 + shiftStartMin
          const shiftEndMinutes = shiftEndHour * 60 + shiftEndMin
          
          // Only mark as 'IN' if within shift hours, otherwise leave undefined
          if (intervalMinutes >= shiftStartMinutes && intervalMinutes < shiftEndMinutes) {
            intervals[timeStr] = 'IN'
          }
        }
      }
    }
  }

  // Override with actual break schedules
  for (const schedule of schedules) {
    const time = schedule.interval_start.substring(0, 5) // Convert HH:MM:SS to HH:MM
    intervals[time] = schedule.break_type
  }

  return intervals
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
      .from(BREAK_SCHEDULES_TABLE)
      .select('*')
      .eq('schedule_date', date)

    if (breaksError) throw breaksError

    // Fetch warnings for the date
    const { data: warnings, error: warningsError } = await supabase
      .from(BREAK_WARNINGS_TABLE)
      .select('*')
      .eq('schedule_date', date)
      .eq('is_resolved', false)

    if (warningsError) throw warningsError

    // Build agent schedules
    const agents: AgentBreakSchedule[] = []
    const coverageCounts: Record<string, { in: number; hb1: number; b: number; hb2: number }> = {}

    for (const shift of shifts || []) {
      const user = shift.users as any
      if (!user) continue

      const userBreaks = (breakSchedules || []).filter(
        (b: BreakSchedule) => b.user_id === user.id
      )

      const userWarning = (warnings || []).find(
        (w: BreakScheduleWarning) => w.user_id === user.id
      )

      const intervals = buildIntervalMap(userBreaks, shift.shift_type)
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
      .from(BREAK_WARNINGS_TABLE)
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

    // Get user's shift for the date
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('shift_type')
      .eq('user_id', user_id)
      .eq('date', schedule_date)
      .single()

    if (shiftError) throw shiftError

    // Delete existing breaks for this user/date
    const { error: deleteError } = await supabase
      .from(BREAK_SCHEDULES_TABLE)
      .delete()
      .eq('user_id', user_id)
      .eq('schedule_date', schedule_date)

    if (deleteError) throw deleteError

    // Insert new breaks
    const breaksToInsert = intervals.map((interval) => ({
      user_id,
      schedule_date,
      shift_type: shift.shift_type,
      interval_start: interval.interval_start,
      break_type: interval.break_type,
    }))

    const { error: insertError } = await supabase
      .from(BREAK_SCHEDULES_TABLE)
      .insert(breaksToInsert)

    if (insertError) throw insertError

    // TODO: Validate against rules and return violations
    return {
      success: true,
      violations: [],
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
      .from(BREAK_WARNINGS_TABLE)
      .update({ is_resolved: true })
      .eq('id', warningId)

    if (error) throw error
  },

  /**
   * Get break schedule by ID
   */
  async getBreakScheduleById(id: string): Promise<BreakSchedule> {
    const { data, error } = await supabase
      .from(BREAK_SCHEDULES_TABLE)
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
      .from(BREAK_SCHEDULES_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('schedule_date', date)

    if (error) throw error
  },

  /**
   * Auto-distribute breaks
   */
  async autoDistribute(request: any): Promise<any> {
    const { generateDistributionPreview, applyDistribution } = await import('../lib/autoDistribution')
    
    // Generate preview
    const preview = await generateDistributionPreview(request)
    
    // Apply the distribution
    await applyDistribution(preview, request.schedule_date)
    
    return preview
  },
}
