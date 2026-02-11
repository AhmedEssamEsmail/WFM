// Auto-Distribution Algorithms for Break Schedules

import type {
  AutoDistributeRequest,
  AutoDistributePreview,
  AgentBreakSchedule,
  BreakScheduleRule,
  ShiftType,
  BreakType,
} from '../types'
import { breakSchedulesService } from '../services/breakSchedulesService'
import { breakRulesService } from '../services/breakRulesService'
import { shiftConfigurationsService } from '../services/shiftConfigurationsService'
import { getRuleViolations } from './breakValidation'
import { timeToMinutes, minutesToTime } from './validations/breakSchedules'

/**
 * Get shift hours from database configuration
 */
async function getShiftHours(): Promise<Record<ShiftType, { start: string; end: string } | null>> {
  const shiftMap = await shiftConfigurationsService.getShiftHoursMap()
  return shiftMap as Record<ShiftType, { start: string; end: string } | null>
}

/**
 * Calculate shift thirds (early, middle, late)
 */
export async function calculateShiftThirds(shiftType: ShiftType): Promise<{
  early: { start: number; end: number }
  middle: { start: number; end: number }
  late: { start: number; end: number }
} | null> {
  const SHIFT_HOURS = await getShiftHours()
  const hours = SHIFT_HOURS[shiftType]
  if (!hours) return null

  const startMinutes = timeToMinutes(hours.start)
  const endMinutes = timeToMinutes(hours.end)
  const duration = endMinutes - startMinutes
  const thirdDuration = Math.floor(duration / 3)

  return {
    early: {
      start: startMinutes,
      end: startMinutes + thirdDuration,
    },
    middle: {
      start: startMinutes + thirdDuration,
      end: startMinutes + 2 * thirdDuration,
    },
    late: {
      start: startMinutes + 2 * thirdDuration,
      end: endMinutes,
    },
  }
}

/**
 * Find intervals with highest coverage in a time range
 */
export function findHighestCoverageIntervals(
  coverageSummary: Record<string, { in: number; hb1: number; b: number; hb2: number }>,
  startMinutes: number,
  endMinutes: number,
  count: number = 1
): string[] {
  const intervals: Array<{ time: string; coverage: number }> = []

  // Generate all 15-minute intervals in the range
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    
    // Get coverage from summary, default to 0 if not present
    const coverage = coverageSummary[timeStr]?.in || 0
    
    intervals.push({
      time: timeStr,
      coverage,
    })
  }

  // Sort by coverage (highest first), then by time (earliest first) for ties
  intervals.sort((a, b) => {
    if (b.coverage !== a.coverage) {
      return b.coverage - a.coverage
    }
    return a.time.localeCompare(b.time)
  })

  return intervals.slice(0, count).map((i) => i.time)
}

/**
 * Balanced Coverage Strategy
 * Distributes breaks to minimize variance in agent coverage
 */
export async function balancedCoverageStrategy(
  agents: AgentBreakSchedule[],
  scheduleDate: string,
  rules: BreakScheduleRule[]
): Promise<{
  schedules: AgentBreakSchedule[]
  failed: Array<{ user_id: string; name: string; reason: string }>
}> {
  const schedules: AgentBreakSchedule[] = []
  const failed: Array<{ user_id: string; name: string; reason: string }> = []

  // Get current coverage
  const response = await breakSchedulesService.getScheduleForDate(scheduleDate)
  const coverageSummary = response.summary

  for (const agent of agents) {
    if (!agent.shift_type || agent.shift_type === 'OFF') {
      continue
    }

    const thirds = await calculateShiftThirds(agent.shift_type)
    if (!thirds) {
      failed.push({
        user_id: agent.user_id,
        name: agent.name,
        reason: 'Invalid shift type',
      })
      continue
    }

    // Find highest coverage intervals in each third
    const hb1Intervals = findHighestCoverageIntervals(
      coverageSummary,
      thirds.early.start,
      thirds.early.end,
      1
    )
    const bIntervals = findHighestCoverageIntervals(
      coverageSummary,
      thirds.middle.start,
      thirds.middle.end,
      1
    )
    const hb2Intervals = findHighestCoverageIntervals(
      coverageSummary,
      thirds.late.start,
      thirds.late.end,
      1
    )

    if (hb1Intervals.length === 0 || bIntervals.length === 0 || hb2Intervals.length === 0) {
      failed.push({
        user_id: agent.user_id,
        name: agent.name,
        reason: 'Could not find suitable intervals in shift thirds',
      })
      continue
    }

    // Build intervals array
    const intervals = [
      { interval_start: hb1Intervals[0] + ':00', break_type: 'HB1' as BreakType },
      { interval_start: bIntervals[0] + ':00', break_type: 'B' as BreakType },
      // Add second B interval (15 minutes later)
      {
        interval_start: minutesToTime(timeToMinutes(bIntervals[0] + ':00') + 15),
        break_type: 'B' as BreakType,
      },
      { interval_start: hb2Intervals[0] + ':00', break_type: 'HB2' as BreakType },
    ]

    // Validate against rules
    const validation = await getRuleViolations(
      {
        user_id: agent.user_id,
        schedule_date: scheduleDate,
        intervals,
      },
      rules,
      agent.shift_type
    )

    if (validation.hasBlockingViolations) {
      const errorMessages = validation.violations
        .filter((v) => v.severity === 'error')
        .map((v) => v.message)
        .join('; ')
      
      failed.push({
        user_id: agent.user_id,
        name: agent.name,
        reason: errorMessages || 'Validation failed',
      })
      continue
    }

    // Build interval map
    const intervalMap: Record<string, BreakType> = {}
    for (const interval of intervals) {
      const time = interval.interval_start.substring(0, 5)
      intervalMap[time] = interval.break_type
    }

    schedules.push({
      ...agent,
      breaks: {
        HB1: hb1Intervals[0],
        B: bIntervals[0],
        HB2: hb2Intervals[0],
      },
      intervals: intervalMap,
    })

    // Update coverage summary for next agent
    for (const interval of intervals) {
      const time = interval.interval_start.substring(0, 5)
      if (!coverageSummary[time]) {
        coverageSummary[time] = { in: 0, hb1: 0, b: 0, hb2: 0 }
      }
      
      coverageSummary[time].in = Math.max(0, coverageSummary[time].in - 1)
      if (interval.break_type === 'HB1') coverageSummary[time].hb1++
      else if (interval.break_type === 'B') coverageSummary[time].b++
      else if (interval.break_type === 'HB2') coverageSummary[time].hb2++
    }
  }

  return { schedules, failed }
}

/**
 * Staggered Timing Strategy
 * Spreads breaks evenly across time to avoid clustering
 */
export async function staggeredTimingStrategy(
  agents: AgentBreakSchedule[],
  scheduleDate: string,
  rules: BreakScheduleRule[]
): Promise<{
  schedules: AgentBreakSchedule[]
  failed: Array<{ user_id: string; name: string; reason: string }>
}> {
  const schedules: AgentBreakSchedule[] = []
  const failed: Array<{ user_id: string; name: string; reason: string }> = []
  const SHIFT_HOURS = await getShiftHours()

  for (const agent of agents) {
    if (!agent.shift_type || agent.shift_type === 'OFF') {
      continue
    }

    const thirds = await calculateShiftThirds(agent.shift_type)
    if (!thirds) {
      failed.push({
        user_id: agent.user_id,
        name: agent.name,
        reason: 'Invalid shift type',
      })
      continue
    }

    // Calculate ideal spacing: place breaks at 1/4, 1/2, and 3/4 points
    const hours = SHIFT_HOURS[agent.shift_type]!
    const startMinutes = timeToMinutes(hours.start)
    const endMinutes = timeToMinutes(hours.end)
    const duration = endMinutes - startMinutes

    const hb1Time = startMinutes + Math.floor(duration / 4)
    const bTime = startMinutes + Math.floor(duration / 2)
    const hb2Time = startMinutes + Math.floor((3 * duration) / 4)

    // Round to nearest 15-minute interval
    const roundTo15 = (minutes: number) => Math.floor(minutes / 15) * 15

    const hb1Minutes = roundTo15(hb1Time)
    const bMinutes = roundTo15(bTime)
    const hb2Minutes = roundTo15(hb2Time)

    // Build intervals array
    const intervals = [
      { interval_start: minutesToTime(hb1Minutes), break_type: 'HB1' as BreakType },
      { interval_start: minutesToTime(bMinutes), break_type: 'B' as BreakType },
      { interval_start: minutesToTime(bMinutes + 15), break_type: 'B' as BreakType },
      { interval_start: minutesToTime(hb2Minutes), break_type: 'HB2' as BreakType },
    ]

    // Validate against rules
    const validation = await getRuleViolations(
      {
        user_id: agent.user_id,
        schedule_date: scheduleDate,
        intervals,
      },
      rules,
      agent.shift_type
    )

    if (validation.hasBlockingViolations) {
      failed.push({
        user_id: agent.user_id,
        name: agent.name,
        reason: validation.violations
          .filter((v) => v.severity === 'error')
          .map((v) => v.message)
          .join('; '),
      })
      continue
    }

    // Build interval map
    const intervalMap: Record<string, BreakType> = {}
    for (const interval of intervals) {
      const time = interval.interval_start.substring(0, 5)
      intervalMap[time] = interval.break_type
    }

    schedules.push({
      ...agent,
      breaks: {
        HB1: minutesToTime(hb1Minutes).substring(0, 5),
        B: minutesToTime(bMinutes).substring(0, 5),
        HB2: minutesToTime(hb2Minutes).substring(0, 5),
      },
      intervals: intervalMap,
    })
  }

  return { schedules, failed }
}

/**
 * Generate distribution preview
 */
export async function generateDistributionPreview(
  request: AutoDistributeRequest
): Promise<AutoDistributePreview> {
  // Get current schedule
  const response = await breakSchedulesService.getScheduleForDate(
    request.schedule_date,
    request.department
  )

  // Get active rules
  const rules = await breakRulesService.getActiveRules()

  // Filter agents based on apply mode
  let agentsToSchedule = response.agents

  if (request.apply_mode === 'only_unscheduled') {
    // Only schedule agents without breaks
    agentsToSchedule = agentsToSchedule.filter(
      (agent) => !agent.breaks.HB1 && !agent.breaks.B && !agent.breaks.HB2
    )
  }

  // Apply distribution strategy
  let result: {
    schedules: AgentBreakSchedule[]
    failed: Array<{ user_id: string; name: string; reason: string }>
  }

  if (request.strategy === 'balanced_coverage') {
    result = await balancedCoverageStrategy(agentsToSchedule, request.schedule_date, rules)
  } else {
    result = await staggeredTimingStrategy(agentsToSchedule, request.schedule_date, rules)
  }

  // Calculate coverage statistics
  const coverageCounts: number[] = []
  const newSummary: Record<string, { in: number; hb1: number; b: number; hb2: number }> = {}

  for (const agent of result.schedules) {
    for (const [interval, breakType] of Object.entries(agent.intervals)) {
      if (!newSummary[interval]) {
        newSummary[interval] = { in: 0, hb1: 0, b: 0, hb2: 0 }
      }

      if (breakType === 'IN') newSummary[interval].in++
      else if (breakType === 'HB1') newSummary[interval].hb1++
      else if (breakType === 'B') newSummary[interval].b++
      else if (breakType === 'HB2') newSummary[interval].hb2++
    }
  }

  for (const counts of Object.values(newSummary)) {
    coverageCounts.push(counts.in)
  }

  const minCoverage = Math.min(...coverageCounts, 0)
  const maxCoverage = Math.max(...coverageCounts, 0)
  const avgCoverage = coverageCounts.length > 0
    ? coverageCounts.reduce((a, b) => a + b, 0) / coverageCounts.length
    : 0
  const variance = coverageCounts.length > 0
    ? coverageCounts.reduce((sum, val) => sum + Math.pow(val - avgCoverage, 2), 0) /
      coverageCounts.length
    : 0

  // Count violations
  let totalViolations = 0
  let blockingViolations = 0
  let warningViolations = 0

  for (const agent of result.schedules) {
    const intervals = Object.entries(agent.intervals)
      .filter(([_, breakType]) => breakType !== 'IN')
      .map(([time, breakType]) => ({
        interval_start: time + ':00',
        break_type: breakType,
      }))

    const validation = await getRuleViolations(
      {
        user_id: agent.user_id,
        schedule_date: request.schedule_date,
        intervals,
      },
      rules,
      agent.shift_type!
    )

    totalViolations += validation.violations.length
    blockingViolations += validation.violations.filter((v) => v.severity === 'error').length
    warningViolations += validation.violations.filter((v) => v.severity === 'warning').length
  }

  return {
    proposed_schedules: result.schedules,
    coverage_stats: {
      min_coverage: minCoverage,
      max_coverage: maxCoverage,
      avg_coverage: avgCoverage,
      variance,
    },
    rule_compliance: {
      total_violations: totalViolations,
      blocking_violations: blockingViolations,
      warning_violations: warningViolations,
    },
    failed_agents: result.failed,
  }
}

/**
 * Apply distribution (save to database)
 */
export async function applyDistribution(
  preview: AutoDistributePreview,
  scheduleDate: string
): Promise<void> {
  for (const agent of preview.proposed_schedules) {
    const intervals = Object.entries(agent.intervals)
      .filter(([_, breakType]) => breakType !== 'IN')
      .map(([time, breakType]) => ({
        interval_start: time + ':00',
        break_type: breakType,
      }))

    if (intervals.length > 0) {
      await breakSchedulesService.updateBreakSchedule({
        user_id: agent.user_id,
        schedule_date: scheduleDate,
        intervals,
      })
    }
  }
}
