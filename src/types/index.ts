export type UserRole = 'agent' | 'tl' | 'wfm'

export type ShiftType = 'AM' | 'PM' | 'BET' | 'OFF'

export type SwapRequestStatus = 'pending_acceptance' | 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected'

export type LeaveRequestStatus = 'pending_tl' | 'pending_wfm' | 'approved' | 'rejected'

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
  user?: User
  is_system?: boolean
}

export interface Setting {
  id: string
  key: string
  value: string
  updated_at: string
}

export interface LeaveTypeConfig {
  id: string
  label: string
  is_active: boolean
  created_at: string
}
