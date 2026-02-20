/**
 * Overtime Validation Utilities
 *
 * Client-side validation logic for overtime requests.
 * Validates date ranges, time ranges, daily/weekly limits, and overlaps.
 */

import type {
  CreateOvertimeRequestInput,
  OvertimeRequest,
  OvertimeSettings,
} from '../types/overtime';

/**
 * Validation result containing errors and warnings
 */
export interface ValidationResult {
  /** Whether the validation passed (no errors) */
  valid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Array of validation warning messages */
  warnings: string[];
}

/**
 * Calculate hours between two time strings
 *
 * @param startTime - Start time in HH:mm:ss format
 * @param endTime - End time in HH:mm:ss format
 * @returns Total hours as a decimal number (e.g., 2.5 for 2 hours 30 minutes)
 */
export function calculateHours(startTime: string, endTime: string): number {
  const [startHours, startMinutes, startSeconds = 0] = startTime.split(':').map(Number);
  const [endHours, endMinutes, endSeconds = 0] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes + startSeconds / 60;
  const endTotalMinutes = endHours * 60 + endMinutes + endSeconds / 60;

  const totalMinutes = endTotalMinutes - startTotalMinutes;
  const totalHours = totalMinutes / 60;

  // Round to 2 decimal places
  return Math.round(totalHours * 100) / 100;
}

/**
 * Check if two time ranges overlap
 *
 * @param start1 - Start time of first range (HH:mm:ss)
 * @param end1 - End time of first range (HH:mm:ss)
 * @param start2 - Start time of second range (HH:mm:ss)
 * @param end2 - End time of second range (HH:mm:ss)
 * @returns True if the time ranges overlap
 */
export function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  // Convert times to minutes for easier comparison
  const toMinutes = (time: string): number => {
    const [hours, minutes, seconds = 0] = time.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  // Two ranges overlap if one starts before the other ends
  // and the other starts before the first ends
  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Get the start of the week (Monday) for a given date
 *
 * @param date - The date to get the week start for
 * @returns Date object representing Monday of that week
 */
function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the week (Sunday) for a given date
 *
 * @param date - The date to get the week end for
 * @returns Date object representing Sunday of that week
 */
function getWeekEnd(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Check if a request would exceed the daily limit
 *
 * @param input - The overtime request input
 * @param settings - Current overtime settings
 * @param existingRequests - Existing overtime requests for the agent
 * @returns Object with exceeded flag and remaining hours
 */
export function checkDailyLimit(
  input: CreateOvertimeRequestInput,
  settings: OvertimeSettings,
  existingRequests: OvertimeRequest[]
): { exceeded: boolean; remaining: number; used: number } {
  const totalHours = calculateHours(input.start_time, input.end_time);

  // Filter requests for the same date and overtime type with active status
  const dailyRequests = existingRequests.filter(
    (r) =>
      r.request_date === input.request_date &&
      r.overtime_type === input.overtime_type &&
      ['pending_tl', 'pending_wfm', 'approved'].includes(r.status)
  );

  const dailyHours = dailyRequests.reduce((sum, r) => sum + r.total_hours, 0);
  const maxDaily =
    input.overtime_type === 'regular'
      ? settings.max_daily_hours.regular
      : settings.max_daily_hours.double;

  const remaining = maxDaily - dailyHours;
  const exceeded = dailyHours + totalHours > maxDaily;

  return { exceeded, remaining, used: dailyHours };
}

/**
 * Check if a request would exceed the weekly limit
 *
 * @param input - The overtime request input
 * @param settings - Current overtime settings
 * @param existingRequests - Existing overtime requests for the agent
 * @returns Object with exceeded flag and remaining hours
 */
export function checkWeeklyLimit(
  input: CreateOvertimeRequestInput,
  settings: OvertimeSettings,
  existingRequests: OvertimeRequest[]
): { exceeded: boolean; remaining: number; used: number } {
  const totalHours = calculateHours(input.start_time, input.end_time);
  const requestDate = new Date(input.request_date);

  const weekStart = getWeekStart(requestDate);
  const weekEnd = getWeekEnd(requestDate);

  // Filter requests for the same week and overtime type with active status
  const weeklyRequests = existingRequests.filter((r) => {
    const rDate = new Date(r.request_date);
    return (
      rDate >= weekStart &&
      rDate <= weekEnd &&
      r.overtime_type === input.overtime_type &&
      ['pending_tl', 'pending_wfm', 'approved'].includes(r.status)
    );
  });

  const weeklyHours = weeklyRequests.reduce((sum, r) => sum + r.total_hours, 0);
  const maxWeekly =
    input.overtime_type === 'regular'
      ? settings.max_weekly_hours.regular
      : settings.max_weekly_hours.double;

  const remaining = maxWeekly - weeklyHours;
  const exceeded = weeklyHours + totalHours > maxWeekly;

  return { exceeded, remaining, used: weeklyHours };
}

/**
 * Check if a request overlaps with existing requests
 *
 * @param input - The overtime request input
 * @param existingRequests - Existing overtime requests for the agent
 * @returns Object with overlapping flag and overlapping request if found
 */
export function checkOverlap(
  input: CreateOvertimeRequestInput,
  existingRequests: OvertimeRequest[]
): { overlapping: boolean; overlappingRequest?: OvertimeRequest } {
  const overlapping = existingRequests.find(
    (r) =>
      r.request_date === input.request_date &&
      ['pending_tl', 'pending_wfm', 'approved'].includes(r.status) &&
      timesOverlap(input.start_time, input.end_time, r.start_time, r.end_time)
  );

  return {
    overlapping: !!overlapping,
    overlappingRequest: overlapping,
  };
}

/**
 * Validate an overtime request against all validation rules
 *
 * @param input - The overtime request input to validate
 * @param settings - Current overtime settings
 * @param existingRequests - Existing overtime requests for the agent
 * @returns ValidationResult with errors and warnings
 */
export function validateOvertimeRequest(
  input: CreateOvertimeRequestInput,
  settings: OvertimeSettings,
  existingRequests: OvertimeRequest[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Date validations
  const requestDate = new Date(input.request_date + 'T00:00:00'); // Force local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDays = settings.approval_deadline_days.days;
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() - deadlineDays);

  if (requestDate > today) {
    errors.push('Work date cannot be in the future');
  }

  if (requestDate < minDate) {
    errors.push(`Work date cannot be more than ${deadlineDays} days in the past`);
  }

  // Time validations
  const totalHours = calculateHours(input.start_time, input.end_time);

  if (totalHours <= 0) {
    errors.push('End time must be after start time');
  }

  if (totalHours > 24) {
    errors.push('Total hours must not exceed 24');
  }

  // Reason validation
  if (input.reason.length < 10) {
    errors.push('Reason must be at least 10 characters');
  }

  if (input.reason.length > 250) {
    errors.push('Reason must not exceed 250 characters');
  }

  // Daily limit check
  const dailyCheck = checkDailyLimit(input, settings, existingRequests);
  if (dailyCheck.exceeded) {
    const maxDaily =
      input.overtime_type === 'regular'
        ? settings.max_daily_hours.regular
        : settings.max_daily_hours.double;
    errors.push(
      `This request would exceed the daily ${input.overtime_type} overtime limit of ${maxDaily} hours`
    );
  } else if (dailyCheck.remaining > 0 && dailyCheck.remaining <= dailyCheck.used * 0.25) {
    // Warning when less than 25% remaining (approaching limit)
    warnings.push(
      `You have ${dailyCheck.remaining.toFixed(2)} hours of ${input.overtime_type} overtime remaining for today`
    );
  }

  // Weekly limit check
  const weeklyCheck = checkWeeklyLimit(input, settings, existingRequests);
  if (weeklyCheck.exceeded) {
    const maxWeekly =
      input.overtime_type === 'regular'
        ? settings.max_weekly_hours.regular
        : settings.max_weekly_hours.double;
    errors.push(
      `This request would exceed the weekly ${input.overtime_type} overtime limit of ${maxWeekly} hours`
    );
  } else if (weeklyCheck.remaining > 0 && weeklyCheck.remaining <= weeklyCheck.used * 0.25) {
    // Warning when less than 25% remaining (approaching limit)
    warnings.push(
      `You have ${weeklyCheck.remaining.toFixed(2)} hours of ${input.overtime_type} overtime remaining for this week`
    );
  }

  // Overlap check
  const overlapCheck = checkOverlap(input, existingRequests);
  if (overlapCheck.overlapping) {
    errors.push('This time period overlaps with an existing overtime request');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Shift information for validation
 */
export interface ShiftInfo {
  shift_type: string;
  start_time: string;
  end_time: string;
  date: string;
}

/**
 * Check if overtime is during or outside scheduled shift
 *
 * @param input - The overtime request input
 * @param shift - The agent's shift for that date (if any)
 * @param settings - Current overtime settings
 * @returns Object with shift verification result
 */
export function checkShiftVerification(
  input: CreateOvertimeRequestInput,
  shift: ShiftInfo | null,
  settings: OvertimeSettings
): {
  hasShift: boolean;
  outsideShift: boolean;
  shiftInfo?: string;
  warning?: string;
} {
  // If shift verification is not required, skip check
  if (!settings.require_shift_verification.enabled) {
    return { hasShift: !!shift, outsideShift: false };
  }

  // No shift found
  if (!shift) {
    return {
      hasShift: false,
      outsideShift: false,
      warning: 'No scheduled shift found for this date',
    };
  }

  // Check if overtime is outside shift hours
  const overtimeStart = toMinutes(input.start_time);
  const overtimeEnd = toMinutes(input.end_time);
  const shiftStart = toMinutes(shift.start_time);
  const shiftEnd = toMinutes(shift.end_time);

  const beforeShift = overtimeEnd <= shiftStart;
  const afterShift = overtimeStart >= shiftEnd;
  const outsideShift = beforeShift || afterShift;

  const shiftInfo = `Scheduled shift: ${shift.shift_type} (${shift.start_time} - ${shift.end_time})`;

  if (outsideShift) {
    return {
      hasShift: true,
      outsideShift: true,
      shiftInfo,
      warning: 'Overtime is outside your scheduled shift hours',
    };
  }

  return {
    hasShift: true,
    outsideShift: false,
    shiftInfo,
  };
}

/**
 * Helper to convert time string to minutes
 */
function toMinutes(time: string): number {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number);
  return hours * 60 + minutes + seconds / 60;
}
