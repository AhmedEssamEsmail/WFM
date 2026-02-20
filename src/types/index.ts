import type { JsonObject } from './json';

export type UserRole = 'agent' | 'tl' | 'wfm';

export type ShiftType = 'AM' | 'PM' | 'BET' | 'OFF';

export type SwapRequestStatus =
  | 'pending_acceptance'
  | 'pending_tl'
  | 'pending_wfm'
  | 'approved'
  | 'rejected';

export type LeaveRequestStatus = 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected' | 'denied';

export type LeaveType = string;

export type RequestType = 'swap' | 'leave' | 'overtime_request';

// JSON types for strongly-typed JSONB payloads used across services/models
export type { JsonPrimitive, JsonValue, JsonObject, JsonArray } from './json';

// Export error types
export * from './errors';

// Export overtime types
export * from './overtime';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  department?: string;
}

export interface Shift {
  id: string;
  user_id: string;
  date: string;
  shift_type: ShiftType;
  created_at: string;
}

export interface ShiftConfiguration {
  id: string;
  shift_code: string;
  shift_label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  display_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  requester_shift_id: string;
  target_shift_id: string;
  status: SwapRequestStatus;
  tl_approved_at: string | null;
  wfm_approved_at: string | null;
  created_at: string;
  // Original shift info stored at request creation for display after swap
  // These store ALL 4 shift types involved in the swap
  requester_original_date?: string;
  requester_original_shift_type?: ShiftType;
  target_original_date?: string;
  target_original_shift_type?: ShiftType;
  // Additional fields for the other two shifts
  requester_original_shift_type_on_target_date?: ShiftType;
  target_original_shift_type_on_requester_date?: ShiftType;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  notes: string | null;
  status: LeaveRequestStatus;
  tl_approved_at: string | null;
  wfm_approved_at: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  request_id: string;
  request_type: RequestType;
  user_id: string;
  content: string;
  is_system?: boolean;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  balance: number;
  year: number;
}

export interface LeaveBalanceHistory {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  previous_balance: number;
  new_balance: number;
  change_reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface LeaveTypeConfig {
  id: string;
  code: LeaveType;
  label: string;
  description: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Swap execution result types
export interface SwapExecutionShiftUpdate {
  id: string;
  user_id: string;
  date: string;
  old_shift_type: ShiftType;
  new_shift_type: ShiftType;
}

export interface SwapExecutionResult {
  success: boolean;
  message: string;
  updated_shifts?: {
    requester_on_requester_date: SwapExecutionShiftUpdate;
    target_on_requester_date: SwapExecutionShiftUpdate;
    requester_on_target_date: SwapExecutionShiftUpdate;
    target_on_target_date: SwapExecutionShiftUpdate;
  };
  error?: string;
  error_code?: string;
}

// Skills Management Types
export interface Skill {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  user_id: string;
  skill_id: string;
  created_at: string;
}

// Extended User with headcount fields
export interface HeadcountUser extends User {
  employee_id?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated' | 'suspended';
  department?: string;
  hire_date?: string;
  manager_id?: string;
  // Joined fields from headcount_profiles
  job_title?: string;
  job_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
  employment_type?: 'full_time' | 'part_time' | 'contractor' | 'intern';
  location?: string;
  time_zone?: string;
  phone?: string;
  skills?: string[];
  certifications?: string[];
  max_weekly_hours?: number;
  cost_center?: string;
  budget_code?: string;
  termination_date?: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed' | 'n/a';
  last_active_at?: string;
  // Joined fields
  manager_name?: string;
  manager_email?: string;
  // Skills from user_skills junction table
  assigned_skills?: Skill[];
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  parent_department_id?: string;
  head_id?: string;
  cost_center?: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface HeadcountAuditLog {
  id: string;
  user_id: string;
  action: string;
  previous_values?: JsonObject;
  new_values?: JsonObject;
  performed_by?: string;
  performed_at: string;
  reason?: string;
  effective_date: string;
}

export interface HeadcountDepartmentSummary {
  department: string | null;
  total_headcount: number;
  active_count: number;
  on_leave_count: number;
  agents_count: number;
  tls_count: number;
  wfm_count: number;
  contractors_count: number;
}

export interface HeadcountMetrics {
  total_active: number;
  total_on_leave: number;
  by_department: Record<string, number>;
  by_role: Record<UserRole, number>;
}

export interface HeadcountMetricRow {
  metric_name: keyof HeadcountMetrics;
  metric_value: string;
}

// ============================================
// Break Schedule Management Types
// ============================================

export type BreakType = 'IN' | 'HB1' | 'B' | 'HB2';

export interface BreakSchedule {
  id: string;
  user_id: string;
  schedule_date: string; // ISO date string
  shift_type: ShiftType | null;
  interval_start: string; // Time string 'HH:MM:SS'
  break_type: BreakType;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreakScheduleRule {
  id: string;
  rule_name: string;
  rule_type: 'distribution' | 'ordering' | 'timing' | 'coverage';
  description: string | null;
  parameters: JsonObject;
  is_active: boolean;
  is_blocking: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface BreakScheduleWarning {
  id: string;
  user_id: string;
  schedule_date: string;
  warning_type: 'shift_changed' | 'breaks_cleared' | 'swap_pending';
  old_shift_type: ShiftType | null;
  new_shift_type: ShiftType | null;
  is_resolved: boolean;
  created_at: string;
}

// API Response Types
export interface AgentBreakSchedule {
  user_id: string;
  name: string;
  shift_type: ShiftType | null;
  department: string;
  has_warning: boolean;
  warning_details: BreakScheduleWarning | null;
  auto_distribution_failure?: string; // Optional field for auto-distribution failure reason
  breaks: {
    HB1: string | null; // Start time 'HH:MM:SS'
    B: string | null;
    HB2: string | null;
  };
  intervals: Record<string, BreakType>; // Key: 'HH:MM', Value: BreakType
}

export interface BreakScheduleSummary {
  [interval: string]: {
    in: number;
    hb1: number;
    b: number;
    hb2: number;
  };
}

export interface BreakScheduleResponse {
  agents: AgentBreakSchedule[];
  summary: BreakScheduleSummary;
}

export interface ValidationViolation {
  rule_name: string;
  message: string;
  severity: 'error' | 'warning';
  affected_intervals?: string[];
}

export interface BreakScheduleUpdateRequest {
  user_id: string;
  schedule_date: string;
  intervals: Array<{
    interval_start: string;
    break_type: BreakType;
  }>;
}

export interface BreakScheduleUpdateResponse {
  success: boolean;
  violations: ValidationViolation[];
}

// CSV Import/Export Types
export interface BreakScheduleCSVRow {
  agent_name: string;
  date: string;
  shift: ShiftType;
  hb1_start: string | null;
  b_start: string | null;
  hb2_start: string | null;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    agent: string;
    error: string;
  }>;
}

// Auto-Distribution Types
export type DistributionStrategy = 'balanced_coverage' | 'staggered_timing' | 'ladder';
export type ApplyMode = 'only_unscheduled' | 'all_agents';

// Distribution Settings Types
export interface DistributionSettings {
  id: string;
  shift_type: ShiftType;
  hb1_start_column: number;
  b_offset_minutes: number;
  hb2_offset_minutes: number;
  ladder_increment: number;
  max_agents_per_cycle: number;
  created_at: string;
  updated_at: string;
}

export interface DistributionSettingsUpdate {
  shift_type: ShiftType;
  hb1_start_column: number;
  b_offset_minutes: number;
  hb2_offset_minutes: number;
  ladder_increment: number;
  max_agents_per_cycle: number;
}

export interface AutoDistributeRequest {
  schedule_date: string;
  strategy: DistributionStrategy;
  apply_mode: ApplyMode;
  department?: string;
}

export interface AutoDistributePreview {
  proposed_schedules: AgentBreakSchedule[];
  coverage_stats: {
    min_coverage: number;
    max_coverage: number;
    avg_coverage: number;
    variance: number;
  };
  rule_compliance: {
    total_violations: number;
    blocking_violations: number;
    warning_violations: number;
  };
  failed_agents: Array<{
    user_id: string;
    name: string;
    reason: string;
    blockedBy?: string[];
  }>;
}
