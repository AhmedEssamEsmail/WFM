/**
 * Overtime Management System Types
 * 
 * Type definitions for the overtime request and approval system.
 * Supports regular overtime (1.5x) and double-time (2.0x) compensation.
 */

/**
 * Type of overtime compensation
 * - regular: 1.5x pay rate
 * - double: 2.0x pay rate (typically for holidays or extended hours)
 */
export type OvertimeType = 'regular' | 'double'

/**
 * Status of an overtime request in the approval workflow
 * - pending_tl: Awaiting Team Lead approval
 * - pending_wfm: Awaiting WFM Administrator approval
 * - approved: Fully approved and ready for payroll
 * - rejected: Rejected by Team Lead or WFM Administrator
 * - cancelled: Cancelled by the requesting agent
 */
export type OvertimeStatus = 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected' | 'cancelled'

/**
 * Approval decision made by a reviewer
 */
export type ApprovalDecision = 'approved' | 'rejected'

/**
 * Overtime request record
 * Represents a request for compensation for hours worked beyond scheduled shift
 */
export interface OvertimeRequest {
  /** Unique identifier for the request */
  id: string
  /** ID of the agent who submitted the request */
  requester_id: string
  /** Optional requester details (populated via join) */
  requester?: {
    id: string
    name: string
    department: string
    employee_id: string
  }
  /** Date the overtime work was performed (ISO date string) */
  request_date: string
  /** Start time of overtime work (HH:mm:ss format) */
  start_time: string
  /** End time of overtime work (HH:mm:ss format) */
  end_time: string
  /** Total hours worked (calculated from start/end times) */
  total_hours: number
  /** Type of overtime compensation */
  overtime_type: OvertimeType
  /** Reason for the overtime work (10-250 characters) */
  reason: string
  /** Current status in the approval workflow */
  status: OvertimeStatus
  
  // Team Lead approval tracking
  /** ID of Team Lead who reviewed the request */
  tl_reviewed_by?: string
  /** Timestamp when Team Lead reviewed (ISO datetime string) */
  tl_reviewed_at?: string
  /** Team Lead's approval decision */
  tl_decision?: ApprovalDecision
  /** Team Lead's notes or comments */
  tl_notes?: string
  
  // WFM Administrator approval tracking
  /** ID of WFM Administrator who reviewed the request */
  wfm_reviewed_by?: string
  /** Timestamp when WFM Administrator reviewed (ISO datetime string) */
  wfm_reviewed_at?: string
  /** WFM Administrator's approval decision */
  wfm_decision?: ApprovalDecision
  /** WFM Administrator's notes or comments */
  wfm_notes?: string
  
  // Metadata
  /** Timestamp when request was created (ISO datetime string) */
  created_at: string
  /** Timestamp when request was last updated (ISO datetime string) */
  updated_at: string
}

/**
 * Overtime system settings
 * Configurable parameters that control validation and approval behavior
 */
export interface OvertimeSettings {
  /** Auto-approve configuration */
  auto_approve: {
    /** Whether to skip WFM approval after TL approval */
    enabled: boolean
  }
  /** Maximum overtime hours per day by type */
  max_daily_hours: {
    regular: number
    double: number
  }
  /** Maximum overtime hours per week by type */
  max_weekly_hours: {
    regular: number
    double: number
  }
  /** Shift verification configuration */
  require_shift_verification: {
    /** Whether to verify overtime against scheduled shifts */
    enabled: boolean
  }
  /** Submission deadline configuration */
  approval_deadline_days: {
    /** Maximum days after work date to submit request */
    days: number
  }
  /** Pay rate multipliers for reporting and payroll */
  pay_multipliers: {
    regular: number
    double: number
  }
}

export type OvertimeSettingKey = keyof OvertimeSettings
export type OvertimeSettingValue<K extends OvertimeSettingKey> = OvertimeSettings[K]

export interface OvertimeSettingRow {
  setting_key: OvertimeSettingKey
  setting_value: unknown
}

/**
 * Input data for creating a new overtime request
 */
export interface CreateOvertimeRequestInput {
  /** Date the overtime work was performed (ISO date string) */
  request_date: string
  /** Start time of overtime work (HH:mm:ss format) */
  start_time: string
  /** End time of overtime work (HH:mm:ss format) */
  end_time: string
  /** Type of overtime compensation */
  overtime_type: OvertimeType
  /** Reason for the overtime work (10-250 characters) */
  reason: string
}

/**
 * Filter parameters for querying overtime requests
 */
export interface OvertimeRequestFilters {
  /** Filter by status ('all' or specific status) */
  status?: string
  /** Filter by date range start (ISO date string) */
  date_from?: string
  /** Filter by date range end (ISO date string) */
  date_to?: string
  /** Filter by agent name (partial match) */
  agent_name?: string
  /** Filter by department */
  department?: string
  /** Page number for pagination */
  page?: number
  /** Items per page (default: 50) */
  per_page?: number
}

/**
 * Summary statistics for overtime requests
 */
export interface OvertimeSummary {
  /** Total number of requests */
  total_requests: number
  /** Number of approved requests */
  approved: number
  /** Number of rejected requests */
  rejected: number
  /** Number of pending requests (pending_tl + pending_wfm) */
  pending: number
  /** Approval rate as percentage (approved / total) */
  approval_rate: number
}

/**
 * Overtime hours breakdown by type
 */
export interface OvertimeHours {
  /** Total overtime hours across all types */
  total_hours: number
  /** Total regular overtime hours */
  regular_hours: number
  /** Total double-time overtime hours */
  double_hours: number
  /** Total equivalent hours for payroll (hours × multiplier) */
  equivalent_hours: number
}

/**
 * Overtime statistics for a single agent
 */
export interface AgentOvertimeStats {
  /** Agent's user ID */
  user_id: string
  /** Agent's full name */
  name: string
  /** Agent's department */
  department: string
  /** Total overtime hours across all types */
  total_hours: number
  /** Total regular overtime hours */
  regular_hours: number
  /** Total double-time overtime hours */
  double_hours: number
  /** Total equivalent hours for payroll */
  equivalent_hours: number
  /** Number of overtime requests */
  request_count: number
}

/**
 * Overtime trend data point for a specific week
 */
export interface OvertimeTrend {
  /** Week identifier in ISO format (e.g., "2026-W06") */
  week: string
  /** Total overtime hours for the week */
  hours: number
}

/**
 * Complete overtime statistics for reporting
 */
export interface OvertimeStatistics {
  /** Summary statistics */
  summary: OvertimeSummary
  /** Hours breakdown by type */
  hours: OvertimeHours
  /** Top agents by overtime hours */
  by_agent: AgentOvertimeStats[]
  /** Overtime distribution by type */
  by_type: {
    regular: {
      count: number
      hours: number
    }
    double: {
      count: number
      hours: number
    }
  }
  /** Weekly trend data */
  trend: OvertimeTrend[]
}

/**
 * CSV export row format for payroll processing
 */
export interface OvertimeCSVRow {
  /** Employee ID */
  employee_id: string
  /** Employee full name */
  employee_name: string
  /** Employee department */
  department: string
  /** Date overtime was worked (ISO date string) */
  date_worked: string
  /** Start time (HH:mm:ss format) */
  start_time: string
  /** End time (HH:mm:ss format) */
  end_time: string
  /** Total hours worked */
  total_hours: number
  /** Overtime type (regular or double) */
  overtime_type: string
  /** Pay rate multiplier (1.5 or 2.0) */
  pay_multiplier: number
  /** Equivalent hours for payroll (total_hours × pay_multiplier) */
  equivalent_hours: number
  /** Request status */
  status: string
  /** Name of Team Lead who approved */
  approved_by_tl: string
  /** Name of WFM Administrator who approved */
  approved_by_wfm: string
  /** Reason for overtime */
  reason: string
}

/**
 * UI filter state for overtime requests
 */
export interface OvertimeFilters {
  /** Status filter ('all' or specific status) */
  status: string
  /** Date range preset or custom */
  dateRange: 'this_week' | 'last_30_days' | 'custom'
  /** Custom date range start (ISO date string) */
  dateFrom?: string
  /** Custom date range end (ISO date string) */
  dateTo?: string
  /** Agent name search term */
  agentName?: string
  /** Department filter */
  department?: string
}
