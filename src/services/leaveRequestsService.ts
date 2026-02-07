// Leave requests service

import { supabase } from '../lib/supabase'
import type { LeaveRequest, LeaveRequestStatus } from '../types'
import { API_ENDPOINTS } from '../constants'

export const leaveRequestsService = {
  /**
   * Get all leave requests
   */
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as LeaveRequest[]
  },

  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as LeaveRequest
  },

  /**
   * Create a new leave request
   */
  async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'created_at' | 'status' | 'tl_approved_at' | 'wfm_approved_at'>): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .insert(request)
      .select()
      .single()
    
    if (error) throw error
    return data as LeaveRequest
  },

  /**
   * Update leave request status
   */
  async updateLeaveRequestStatus(id: string, status: LeaveRequestStatus, approvalField?: 'tl_approved_at' | 'wfm_approved_at'): Promise<LeaveRequest> {
    const updates: Record<string, string> = { status }
    
    if (approvalField) {
      updates[approvalField] = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as LeaveRequest
  },

  /**
   * Delete leave request
   */
  async deleteLeaveRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Get user's leave requests
   */
  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as LeaveRequest[]
  },

  /**
   * Get pending leave requests for approval
   */
  async getPendingLeaveRequests(status?: LeaveRequestStatus): Promise<LeaveRequest[]> {
    let query = supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
    
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.in('status', ['pending_tl', 'pending_wfm'])
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as LeaveRequest[]
  },

  /**
   * Get leave requests by date range
   */
  async getLeaveRequestsByDateRange(startDate: string, endDate: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('start_date', { ascending: true })
    
    if (error) throw error
    return data as LeaveRequest[]
  },
}
