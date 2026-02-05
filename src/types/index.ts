export type UserRole = 'agent' | 'tl' | 'wfm'

export type ShiftType = 'AM' | 'PM' | 'BET' | 'OFF'

export type SwapRequestStatus = 'pending_acceptance' | 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected'

export type LeaveRequestStatus = 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected' | 'denied'

export type LeaveType = 'sick' | 'annual' | 'casual' | 'public_holiday' | 'bereavement'

export type RequestType = 'swap' | 'leave'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface Shift {
  id: string
  user_id: string
  date: string
  shift_type: ShiftType
  created_at: string
}

export interface SwapRequest {
  id: string
  requester_id: string
  target_user_id: string
  requester_shift_id: string
  target_shift_id: string
  status: SwapRequestStatus
  tl_approved_at: string | null
  wfm_approved_at: string | null
  created_at: string
  // Original shift info stored at request creation for display after swap
  // These store ALL 4 shift types involved in the swap
  requester_original_date?: string
  requester_original_shift_type?: ShiftType
  target_original_date?: string
  target_original_shift_type?: ShiftType
  // Additional fields for the other two shifts
  requester_original_shift_type_on_target_date?: ShiftType
  target_original_shift_type_on_requester_date?: ShiftType
}

export interface LeaveRequest {
  id: string
  user_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  notes: string | null
  status: LeaveRequestStatus
  tl_approved_at: string | null
  wfm_approved_at: string | null
  created_at: string
}

export interface Comment {
  id: string
  request_id: string
  request_type: RequestType
  user_id: string
  content: string
  created_at: string
}

export interface LeaveBalance {
  id: string
  user_id: string
  leave_type: LeaveType
  balance: number
  year: number
}

export interface LeaveTypeConfig {
  id: string
  label: string
  is_active: boolean
  created_at: string
}
// ADD THESE TYPES TO YOUR EXISTING types/index.ts FILE

// Extended User with headcount fields
export interface HeadcountUser extends User {
  employee_id?: string
  status: 'active' | 'inactive' | 'on_leave' | 'terminated' | 'suspended'
  department?: string
  hire_date?: string
  manager_id?: string
  fte_percentage: number
  // Joined fields from headcount_profiles
  job_title?: string
  job_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director'
  employment_type?: 'full_time' | 'part_time' | 'contractor' | 'intern'
  location?: string
  time_zone?: string
  phone?: string
  skills?: string[]
  certifications?: string[]
  max_weekly_hours?: number
  cost_center?: string
  budget_code?: string
  termination_date?: string
  onboarding_status?: 'pending' | 'in_progress' | 'completed' | 'n/a'
  last_active_at?: string
  // Joined fields
  manager_name?: string
  manager_email?: string
}

export interface Department {
  id: string
  name: string
  code?: string
  parent_department_id?: string
  head_id?: string
  cost_center?: string
  description?: string
  active: boolean
  created_at: string
}

export interface HeadcountAuditLog {
  id: string
  user_id: string
  action: string
  previous_values?: Record<string, any>
  new_values?: Record<string, any>
  performed_by?: string
  performed_at: string
  reason?: string
  effective_date: string
}

export interface HeadcountMetrics {
  total_active: number
  total_on_leave: number
  total_fte: number
  by_department: Record<string, number>
  by_role: Record<UserRole, number>
}
