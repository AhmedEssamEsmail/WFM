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
}

export interface Setting {
  id: string
  key: string
  value: string
  updated_at: string
}
