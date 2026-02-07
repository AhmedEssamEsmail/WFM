// Swap requests service

import { supabase } from '../lib/supabase'
import type { SwapRequest, SwapRequestStatus } from '../types'
import { API_ENDPOINTS } from '../constants'

export const swapRequestsService = {
  /**
   * Get all swap requests
   */
  async getSwapRequests(): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(`
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as SwapRequest[]
  },

  /**
   * Get swap request by ID
   */
  async getSwapRequestById(id: string): Promise<SwapRequest> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(`
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email, role),
        target:users!swap_requests_target_user_id_fkey(id, name, email, role),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as SwapRequest
  },

  /**
   * Create a new swap request
   */
  async createSwapRequest(request: Omit<SwapRequest, 'id' | 'created_at' | 'status' | 'tl_approved_at' | 'wfm_approved_at'>): Promise<SwapRequest> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .insert(request)
      .select()
      .single()
    
    if (error) throw error
    return data as SwapRequest
  },

  /**
   * Update swap request status
   */
  async updateSwapRequestStatus(id: string, status: SwapRequestStatus, approvalField?: 'tl_approved_at' | 'wfm_approved_at'): Promise<SwapRequest> {
    const updates: Record<string, string> = { status }
    
    if (approvalField) {
      updates[approvalField] = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as SwapRequest
  },

  /**
   * Delete swap request
   */
  async deleteSwapRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Get user's swap requests (as requester or target)
   */
  async getUserSwapRequests(userId: string): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(`
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `)
      .or(`requester_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as SwapRequest[]
  },

  /**
   * Get pending swap requests for approval
   */
  async getPendingSwapRequests(status?: SwapRequestStatus): Promise<SwapRequest[]> {
    let query = supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(`
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `)
    
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.in('status', ['pending_acceptance', 'pending_tl', 'pending_wfm'])
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as SwapRequest[]
  },
}
