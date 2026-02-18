import type { OvertimeRequest, OvertimeSettings, OvertimeCSVRow } from '../types/overtime'
import { format } from 'date-fns'

/**
 * Generate CSV content from overtime requests
 * @param requests - Array of approved overtime requests
 * @param settings - Overtime settings for pay multipliers
 * @returns CSV string ready for download
 */
export function generateOvertimeCSV(
  requests: OvertimeRequest[],
  settings: OvertimeSettings
): string {
  // Sort by employee name, then date
  const sortedRequests = [...requests].sort((a, b) => {
    const nameCompare = (a.requester?.name || '').localeCompare(b.requester?.name || '')
    if (nameCompare !== 0) return nameCompare
    return a.request_date.localeCompare(b.request_date)
  })

  // Generate CSV rows
  const rows: OvertimeCSVRow[] = sortedRequests.map(req => {
    const payMultiplier = req.overtime_type === 'regular' 
      ? settings.pay_multipliers.regular 
      : settings.pay_multipliers.double
    
    const equivalentHours = Number((req.total_hours * payMultiplier).toFixed(2))

    return {
      employee_id: req.requester?.employee_id || '',
      employee_name: req.requester?.name || '',
      department: req.requester?.department || '',
      date_worked: req.request_date,
      start_time: req.start_time,
      end_time: req.end_time,
      total_hours: req.total_hours,
      overtime_type: req.overtime_type,
      pay_multiplier: payMultiplier,
      equivalent_hours: equivalentHours,
      status: req.status,
      approved_by_tl: req.tl_reviewed_by || '',
      approved_by_wfm: req.wfm_reviewed_by || '',
      reason: req.reason,
    }
  })

  // Generate CSV header
  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Date Worked',
    'Start Time',
    'End Time',
    'Total Hours',
    'Overtime Type',
    'Pay Multiplier',
    'Equivalent Hours',
    'Status',
    'Approved By TL',
    'Approved By WFM',
    'Reason'
  ]

  // Generate CSV content
  const csvLines = [
    headers.join(','),
    ...rows.map(row => [
      escapeCSVField(row.employee_id),
      escapeCSVField(row.employee_name),
      escapeCSVField(row.department),
      escapeCSVField(row.date_worked),
      escapeCSVField(row.start_time),
      escapeCSVField(row.end_time),
      row.total_hours,
      escapeCSVField(row.overtime_type),
      row.pay_multiplier,
      row.equivalent_hours,
      escapeCSVField(row.status),
      escapeCSVField(row.approved_by_tl),
      escapeCSVField(row.approved_by_wfm),
      escapeCSVField(row.reason)
    ].join(','))
  ]

  return csvLines.join('\n')
}

/**
 * Generate filename for CSV export
 * @param startDate - Start date of the date range
 * @param endDate - End date of the date range
 * @returns Filename string
 */
export function generateOvertimeCSVFilename(startDate?: string, endDate?: string): string {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  if (startDate && endDate) {
    return `overtime-export-${startDate}-to-${endDate}.csv`
  } else if (startDate) {
    return `overtime-export-from-${startDate}.csv`
  } else if (endDate) {
    return `overtime-export-until-${endDate}.csv`
  }
  
  return `overtime-export-${today}.csv`
}

/**
 * Escape CSV field to handle commas, quotes, and newlines
 * @param field - Field value to escape
 * @returns Escaped field value
 */
function escapeCSVField(field: string | number): string {
  if (typeof field === 'number') {
    return field.toString()
  }
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  
  return field
}
