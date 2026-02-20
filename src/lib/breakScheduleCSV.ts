// Break Schedule CSV Import/Export

import type { BreakScheduleCSVRow, ImportResult, AgentBreakSchedule, ShiftType } from '../types';
import { breakSchedulesService } from '../services/breakSchedulesService';
import { supabase } from './supabase';

/**
 * Export break schedules to CSV format
 */
export async function exportToCSV(agents: AgentBreakSchedule[], date: string): Promise<Blob> {
  // CSV header
  const headers = ['Agent Name', 'Date', 'Shift', 'HB1 Start', 'B Start', 'HB2 Start'];
  const rows: string[][] = [headers];

  // Add data rows
  for (const agent of agents) {
    rows.push([
      agent.name,
      date,
      agent.shift_type || 'OFF',
      agent.breaks.HB1 || '',
      agent.breaks.B || '',
      agent.breaks.HB2 || '',
    ]);
  }

  // Convert to CSV string
  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  // Create blob
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Parse CSV file content
 */
export function parseCSV(csvContent: string): BreakScheduleCSVRow[] {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 1) {
    throw new Error('CSV file is empty');
  }

  // Skip header row if it exists
  const dataLines = lines.length > 1 ? lines.slice(1) : [];

  // Return empty array if no data rows (this is valid for empty schedules)
  if (dataLines.length === 0) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const rows: BreakScheduleCSVRow[] = [];

  for (const line of dataLines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Handle quoted fields
    const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const cleanFields = fields.map((field) => field.replace(/^"|"$/g, '').trim());

    if (cleanFields.length < 3) {
      continue; // Skip invalid rows
    }

    const [agentName, date, shift, hb1Start, bStart, hb2Start] = cleanFields;

    rows.push({
      agent_name: agentName,
      date,
      shift: shift as ShiftType,
      hb1_start: hb1Start || null,
      b_start: bStart || null,
      hb2_start: hb2Start || null,
    });
  }

  return rows;
}

/**
 * Validate CSV format
 */
export async function validateCSVFormat(rows: BreakScheduleCSVRow[]): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (rows.length === 0) {
    errors.push('No data rows found in CSV');
    return { valid: false, errors };
  }

  // Get valid shift types from database
  const { shiftConfigurationsService } = await import('../services/shiftConfigurationsService');
  let validShiftTypes: string[];
  try {
    const shifts = await shiftConfigurationsService.getActiveShiftConfigurations();
    validShiftTypes = shifts.map((s) => s.shift_code);
  } catch {
    // Fallback to defaults if database fails
    validShiftTypes = ['AM', 'PM', 'BET', 'OFF'];
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because of header and 0-index

    if (!row.agent_name) {
      errors.push(`Row ${rowNum}: Agent name is required`);
    }

    if (!row.date) {
      errors.push(`Row ${rowNum}: Date is required`);
    } else if (!dateRegex.test(row.date)) {
      errors.push(`Row ${rowNum}: Date must be in YYYY-MM-DD format`);
    }

    if (!row.shift) {
      errors.push(`Row ${rowNum}: Shift is required`);
    } else if (!validShiftTypes.includes(row.shift)) {
      errors.push(`Row ${rowNum}: Shift must be one of: ${validShiftTypes.join(', ')}`);
    }

    // Validate time formats if provided
    if (row.hb1_start && !timeRegex.test(row.hb1_start)) {
      errors.push(`Row ${rowNum}: HB1 Start must be in HH:MM format`);
    }

    if (row.b_start && !timeRegex.test(row.b_start)) {
      errors.push(`Row ${rowNum}: B Start must be in HH:MM format`);
    }

    if (row.hb2_start && !timeRegex.test(row.hb2_start)) {
      errors.push(`Row ${rowNum}: HB2 Start must be in HH:MM format`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert time HH:MM to HH:MM:SS
 */
function timeWithSeconds(time: string | null): string | null {
  if (!time) return null;
  return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
}

/**
 * Import break schedules from CSV
 */
export async function importFromCSV(file: File): Promise<ImportResult> {
  try {
    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    const rows = parseCSV(csvContent);

    // Validate format
    const validation = await validateCSVFormat(rows);
    if (!validation.valid) {
      return {
        success: false,
        imported: 0,
        errors: validation.errors.map((error: string, index: number) => ({
          row: index + 2,
          agent: '',
          error,
        })),
      };
    }

    // Process each row
    const errors: Array<{ row: number; agent: string; error: string }> = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        // Find user by name
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('name', row.agent_name)
          .limit(1);

        if (userError) throw userError;

        if (!users || users.length === 0) {
          errors.push({
            row: rowNum,
            agent: row.agent_name,
            error: 'Agent not found',
          });
          continue;
        }

        const userId = users[0].id;

        // Check if shift exists for this date
        const { data: shift, error: shiftError } = await supabase
          .from('shifts')
          .select('shift_type')
          .eq('user_id', userId)
          .eq('date', row.date)
          .maybeSingle();

        if (shiftError) throw shiftError;

        if (!shift) {
          errors.push({
            row: rowNum,
            agent: row.agent_name,
            error: 'No shift found for this date',
          });
          continue;
        }

        // Build intervals array
        const intervals: Array<{ interval_start: string; break_type: string }> = [];

        if (row.hb1_start) {
          intervals.push({
            interval_start: timeWithSeconds(row.hb1_start)!,
            break_type: 'HB1',
          });
        }

        if (row.b_start) {
          // Full break spans 2 intervals (30 minutes)
          const bTime = timeWithSeconds(row.b_start)!;
          intervals.push({ interval_start: bTime, break_type: 'B' });

          // Add second interval (15 minutes later)
          const [hours, minutes] = bTime.split(':').map(Number);
          const nextMinutes = minutes + 15;
          const nextHours = nextMinutes >= 60 ? hours + 1 : hours;
          const nextMins = nextMinutes >= 60 ? nextMinutes - 60 : nextMinutes;
          const nextTime = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}:00`;
          intervals.push({ interval_start: nextTime, break_type: 'B' });
        }

        if (row.hb2_start) {
          intervals.push({
            interval_start: timeWithSeconds(row.hb2_start)!,
            break_type: 'HB2',
          });
        }

        // Update break schedule
        if (intervals.length > 0) {
          await breakSchedulesService.updateBreakSchedule({
            user_id: userId,
            schedule_date: row.date,
            intervals: intervals as Array<{
              interval_start: string;
              break_type: 'HB1' | 'B' | 'HB2';
            }>,
          });
        }

        imported++;
      } catch (error) {
        errors.push({
          row: rowNum,
          agent: row.agent_name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      imported,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [
        {
          row: 0,
          agent: '',
          error: error instanceof Error ? error.message : 'Failed to process CSV file',
        },
      ],
    };
  }
}

/**
 * Download CSV file
 */
export function downloadCSV(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
