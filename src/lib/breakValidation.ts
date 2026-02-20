// Break Schedule Validation Logic

import type {
  BreakScheduleRule,
  BreakScheduleUpdateRequest,
  ValidationViolation,
  BreakType,
  ShiftType,
} from '../types';
import { timeToMinutes, calculateBreakGap } from '../validation';
import { shiftConfigurationsService } from '../services/shiftConfigurationsService';

/**
 * Get shift hours from database configuration
 */
async function getShiftHours(): Promise<Record<ShiftType, { start: string; end: string } | null>> {
  const shiftMap = await shiftConfigurationsService.getShiftHoursMap();
  // Convert HH:MM:SS to HH:MM for validation
  const result: Record<string, { start: string; end: string } | null> = {};
  for (const [key, value] of Object.entries(shiftMap)) {
    if (value) {
      result[key] = {
        start: value.start.substring(0, 5),
        end: value.end.substring(0, 5),
      };
    } else {
      result[key] = null;
    }
  }
  return result as Record<ShiftType, { start: string; end: string } | null>;
}

/**
 * Extract break times from intervals
 */
function extractBreakTimes(intervals: Array<{ interval_start: string; break_type: BreakType }>): {
  HB1: string | null;
  B: string | null;
  HB2: string | null;
} {
  const breaks = {
    HB1: null as string | null,
    B: null as string | null,
    HB2: null as string | null,
  };

  for (const interval of intervals) {
    const time = interval.interval_start.substring(0, 5); // HH:MM:SS -> HH:MM

    if (interval.break_type === 'HB1' && !breaks.HB1) {
      breaks.HB1 = time;
    } else if (interval.break_type === 'B' && !breaks.B) {
      breaks.B = time;
    } else if (interval.break_type === 'HB2' && !breaks.HB2) {
      breaks.HB2 = time;
    }
  }

  return breaks;
}

/**
 * Validate break ordering: HB1 → B → HB2
 */
export function validateBreakOrdering(
  intervals: Array<{ interval_start: string; break_type: BreakType }>
): ValidationViolation | null {
  const breaks = extractBreakTimes(intervals);

  if (breaks.HB1 && breaks.B) {
    const hb1Minutes = timeToMinutes(breaks.HB1 + ':00');
    const bMinutes = timeToMinutes(breaks.B + ':00');

    if (hb1Minutes >= bMinutes) {
      return {
        rule_name: 'break_ordering',
        message: 'HB1 must come before B',
        severity: 'error',
        affected_intervals: [breaks.HB1, breaks.B],
      };
    }
  }

  if (breaks.B && breaks.HB2) {
    const bMinutes = timeToMinutes(breaks.B + ':00');
    const hb2Minutes = timeToMinutes(breaks.HB2 + ':00');

    if (bMinutes >= hb2Minutes) {
      return {
        rule_name: 'break_ordering',
        message: 'B must come before HB2',
        severity: 'error',
        affected_intervals: [breaks.B, breaks.HB2],
      };
    }
  }

  if (breaks.HB1 && breaks.HB2) {
    const hb1Minutes = timeToMinutes(breaks.HB1 + ':00');
    const hb2Minutes = timeToMinutes(breaks.HB2 + ':00');

    if (hb1Minutes >= hb2Minutes) {
      return {
        rule_name: 'break_ordering',
        message: 'HB1 must come before HB2',
        severity: 'error',
        affected_intervals: [breaks.HB1, breaks.HB2],
      };
    }
  }

  return null;
}

/**
 * Validate break timing: gaps between breaks
 */
export function validateBreakTiming(
  intervals: Array<{ interval_start: string; break_type: BreakType }>,
  minMinutes: number = 90,
  maxMinutes: number = 270
): ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  const breaks = extractBreakTimes(intervals);

  // Check HB1 to B gap
  if (breaks.HB1 && breaks.B) {
    const gap = calculateBreakGap(breaks.HB1 + ':00', breaks.B + ':00');

    if (gap < minMinutes) {
      violations.push({
        rule_name: 'minimum_gap',
        message: `Gap between HB1 and B is ${gap} minutes (minimum ${minMinutes} required)`,
        severity: 'error',
        affected_intervals: [breaks.HB1, breaks.B],
      });
    }

    if (gap > maxMinutes) {
      violations.push({
        rule_name: 'maximum_gap',
        message: `Gap between HB1 and B is ${gap} minutes (maximum ${maxMinutes} allowed)`,
        severity: 'warning',
        affected_intervals: [breaks.HB1, breaks.B],
      });
    }
  }

  // Check B to HB2 gap
  if (breaks.B && breaks.HB2) {
    const gap = calculateBreakGap(breaks.B + ':00', breaks.HB2 + ':00');

    if (gap < minMinutes) {
      violations.push({
        rule_name: 'minimum_gap',
        message: `Gap between B and HB2 is ${gap} minutes (minimum ${minMinutes} required)`,
        severity: 'error',
        affected_intervals: [breaks.B, breaks.HB2],
      });
    }

    if (gap > maxMinutes) {
      violations.push({
        rule_name: 'maximum_gap',
        message: `Gap between B and HB2 is ${gap} minutes (maximum ${maxMinutes} allowed)`,
        severity: 'warning',
        affected_intervals: [breaks.B, breaks.HB2],
      });
    }
  }

  return violations;
}

/**
 * Validate shift boundary: breaks must be within shift hours
 */
export async function validateShiftBoundary(
  intervals: Array<{ interval_start: string; break_type: BreakType }>,
  shiftType: ShiftType
): Promise<ValidationViolation[]> {
  const violations: ValidationViolation[] = [];
  const SHIFT_HOURS = await getShiftHours();
  const shiftHours = SHIFT_HOURS[shiftType];

  if (!shiftHours) {
    return violations;
  }

  const shiftStartMinutes = timeToMinutes(shiftHours.start + ':00');
  const shiftEndMinutes = timeToMinutes(shiftHours.end + ':00');

  for (const interval of intervals) {
    if (interval.break_type === 'IN') continue;

    const intervalMinutes = timeToMinutes(interval.interval_start);

    if (intervalMinutes < shiftStartMinutes || intervalMinutes >= shiftEndMinutes) {
      violations.push({
        rule_name: 'shift_boundary',
        message: `Break at ${interval.interval_start.substring(0, 5)} is outside shift hours (${shiftHours.start}-${shiftHours.end})`,
        severity: 'error',
        affected_intervals: [interval.interval_start.substring(0, 5)],
      });
    }
  }

  return violations;
}

/**
 * Validate against a specific rule
 */
async function validateAgainstRule(
  request: BreakScheduleUpdateRequest,
  rule: BreakScheduleRule,
  shiftType: ShiftType,
  existingSchedules?: Array<{ user_id: string; intervals: Record<string, BreakType> }>
): Promise<ValidationViolation[]> {
  const violations: ValidationViolation[] = [];

  switch (rule.rule_type) {
    case 'ordering': {
      const violation = validateBreakOrdering(request.intervals);
      if (violation) {
        violation.severity = rule.is_blocking ? 'error' : 'warning';
        violations.push(violation);
      }
      break;
    }

    case 'timing': {
      if (rule.rule_name === 'minimum_gap' || rule.rule_name === 'maximum_gap') {
        const minMinutes = (rule.parameters.min_minutes as number | undefined) || 90;
        const maxMinutes = (rule.parameters.max_minutes as number | undefined) || 270;
        const timingViolations = validateBreakTiming(request.intervals, minMinutes, maxMinutes);

        for (const violation of timingViolations) {
          if (violation.rule_name === rule.rule_name) {
            violation.severity = rule.is_blocking ? 'error' : 'warning';
            violations.push(violation);
          }
        }
      } else if (rule.rule_name === 'shift_boundary') {
        const boundaryViolations = await validateShiftBoundary(request.intervals, shiftType);
        for (const violation of boundaryViolations) {
          violation.severity = rule.is_blocking ? 'error' : 'warning';
          violations.push(violation);
        }
      }
      break;
    }

    case 'coverage': {
      if (rule.rule_name === 'minimum_break_spacing' && existingSchedules) {
        const minIntervals = (rule.parameters.min_intervals as number | undefined) || 10;
        const appliesTo = (rule.parameters.applies_to as
          | Array<'HB1' | 'B' | 'HB2'>
          | undefined) || ['HB1', 'B', 'HB2'];
        const spacingViolations = await validateMinimumBreakSpacing(
          request,
          existingSchedules,
          minIntervals,
          appliesTo
        );
        for (const violation of spacingViolations) {
          violation.severity = rule.is_blocking ? 'error' : 'warning';
          violations.push(violation);
        }
      }
      break;
    }

    case 'distribution':
      // Distribution rules are for auto-distribution, not validation
      break;
  }

  return violations;
}

/**
 * Validate against all active rules
 */
export async function validateAgainstRules(
  request: BreakScheduleUpdateRequest,
  rules: BreakScheduleRule[],
  shiftType: ShiftType,
  existingSchedules?: Array<{ user_id: string; intervals: Record<string, BreakType> }>
): Promise<ValidationViolation[]> {
  const violations: ValidationViolation[] = [];

  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...rules].filter((r) => r.is_active).sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const ruleViolations = await validateAgainstRule(request, rule, shiftType, existingSchedules);
    violations.push(...ruleViolations);
  }

  return violations;
}

/**
 * Get rule violations with priority resolution
 */
export async function getRuleViolations(
  request: BreakScheduleUpdateRequest,
  rules: BreakScheduleRule[],
  shiftType: ShiftType,
  existingSchedules?: Array<{ user_id: string; intervals: Record<string, BreakType> }>
): Promise<{
  violations: ValidationViolation[];
  hasBlockingViolations: boolean;
}> {
  const violations = await validateAgainstRules(request, rules, shiftType, existingSchedules);

  // Remove duplicate violations (keep highest priority)
  const uniqueViolations = violations.reduce((acc, violation) => {
    const existing = acc.find(
      (v) => v.rule_name === violation.rule_name && v.message === violation.message
    );

    if (!existing) {
      acc.push(violation);
    }

    return acc;
  }, [] as ValidationViolation[]);

  const hasBlockingViolations = uniqueViolations.some((v) => v.severity === 'error');

  return {
    violations: uniqueViolations,
    hasBlockingViolations,
  };
}

/**
 * Validate full break duration (B must span 2 consecutive intervals)
 */
export function validateFullBreakDuration(
  intervals: Array<{ interval_start: string; break_type: BreakType }>
): ValidationViolation | null {
  const bIntervals = intervals.filter((i) => i.break_type === 'B');

  if (bIntervals.length === 0) return null;

  // Check if B intervals are consecutive
  const bTimes = bIntervals.map((i) => timeToMinutes(i.interval_start)).sort((a, b) => a - b);

  for (let i = 0; i < bTimes.length - 1; i++) {
    if (bTimes[i + 1] - bTimes[i] !== 15) {
      return {
        rule_name: 'full_break_duration',
        message: 'Full break (B) must span 2 consecutive 15-minute intervals (30 minutes total)',
        severity: 'error',
      };
    }
  }

  if (bIntervals.length !== 2) {
    return {
      rule_name: 'full_break_duration',
      message: 'Full break (B) must be exactly 30 minutes (2 intervals)',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate minimum break spacing between agents
 * Checks if breaks of the same type are too close together across different agents
 */
export async function validateMinimumBreakSpacing(
  request: BreakScheduleUpdateRequest,
  existingSchedules: Array<{ user_id: string; intervals: Record<string, BreakType> }>,
  minIntervals: number = 10,
  appliesTo: Array<'HB1' | 'B' | 'HB2'> = ['HB1', 'B', 'HB2']
): Promise<ValidationViolation[]> {
  const violations: ValidationViolation[] = [];

  // Extract break times from the request
  const requestBreaks = extractBreakTimes(request.intervals);

  // Check each break type
  for (const breakType of appliesTo) {
    const requestBreakTime = requestBreaks[breakType];
    if (!requestBreakTime) continue;

    const requestMinutes = timeToMinutes(requestBreakTime + ':00');

    // Check against all existing schedules (excluding the current user)
    for (const schedule of existingSchedules) {
      if (schedule.user_id === request.user_id) continue;

      // Find breaks of the same type in this schedule
      for (const [time, type] of Object.entries(schedule.intervals)) {
        if (type !== breakType) continue;

        const existingMinutes = timeToMinutes(time + ':00');
        const intervalsDiff = Math.abs(requestMinutes - existingMinutes) / 15;

        if (intervalsDiff < minIntervals && intervalsDiff > 0) {
          violations.push({
            rule_name: 'minimum_break_spacing',
            message: `${breakType} break is only ${intervalsDiff} intervals away from another agent (minimum ${minIntervals} required)`,
            severity: 'warning',
            affected_intervals: [requestBreakTime],
          });
          break; // Only report once per break type
        }
      }
    }
  }

  return violations;
}
