// Swap requests service

import { supabase } from '../lib/supabase'
import type { SwapRequest, SwapRequestStatus, SwapExecutionResult } from '../types'
import { API_ENDPOINTS } from '../constants'
import {
  validateUUID,
  validateSwapRequestData,
} from '../utils/validation'
import {
  SwapExecutionError,
  ValidationError,
  ConcurrencyError,
  ResourceNotFoundError,
} from '../types/errors'

export const swapRequestsService = {
  /**
   * Execute an approved swap request atomically
   * Calls the database stored procedure to swap all 4 shifts in a single transaction
   */
  async executeSwap(swapRequest: SwapRequest): Promise<SwapExecutionResult> {
    // Validate swap request status
    if (swapRequest.status !== 'approved') {
      throw new ValidationError(
        'status',
        swapRequest.status,
        'Swap request must be approved before execution'
      )
    }

    // Get the shift details to extract dates
    const { data: requesterShift, error: requesterShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('date')
      .eq('id', swapRequest.requester_shift_id)
      .single()

    if (requesterShiftError || !requesterShift) {
      throw new SwapExecutionError(
        swapRequest.id,
        'Requester shift not found',
        { requester_shift_id: swapRequest.requester_shift_id }
      )
    }

    const { data: targetShift, error: targetShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('date')
      .eq('id', swapRequest.target_shift_id)
      .single()

    if (targetShiftError || !targetShift) {
      throw new SwapExecutionError(
        swapRequest.id,
        'Target shift not found',
        { target_shift_id: swapRequest.target_shift_id }
      )
    }

    // Call the stored procedure via Supabase RPC
    const { data, error } = await supabase.rpc('execute_shift_swap', {
      p_requester_id: swapRequest.requester_id,
      p_target_user_id: swapRequest.target_user_id,
      p_requester_date: requesterShift.date,
      p_target_date: targetShift.date,
    })

    if (error) {
      throw new SwapExecutionError(
        swapRequest.id,
        error.message,
        { error_code: error.code }
      )
    }

    const result = data as SwapExecutionResult

    // Check if the stored procedure returned an error
    if (!result.success) {
      throw new SwapExecutionError(
        swapRequest.id,
        result.error || 'Unknown error during swap execution',
        { error_code: result.error_code }
      )
    }

    return result
  },

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
   * Create a new swap request with validation
   */
  async createSwapRequest(request: Omit<SwapRequest, 'id' | 'created_at' | 'status' | 'tl_approved_at' | 'wfm_approved_at'>): Promise<SwapRequest> {
    // Input validation
    validateSwapRequestData({
      requesterId: request.requester_id,
      targetUserId: request.target_user_id,
      requesterShiftId: request.requester_shift_id,
      targetShiftId: request.target_shift_id,
    })

    // Validate that both shifts exist
    const { data: requesterShift, error: requesterShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('id, user_id, date, shift_type')
      .eq('id', request.requester_shift_id)
      .single()

    if (requesterShiftError || !requesterShift) {
      throw new ResourceNotFoundError('Shift', request.requester_shift_id)
    }

    const { data: targetShift, error: targetShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('id, user_id, date, shift_type')
      .eq('id', request.target_shift_id)
      .single()

    if (targetShiftError || !targetShift) {
      throw new ResourceNotFoundError('Shift', request.target_shift_id)
    }

    // Validate that requester owns the requester shift
    if (requesterShift.user_id !== request.requester_id) {
      throw new ValidationError(
        'requester_shift_id',
        request.requester_shift_id,
        'Requester shift must belong to the requester'
      )
    }

    // Validate that target owns the target shift
    if (targetShift.user_id !== request.target_user_id) {
      throw new ValidationError(
        'target_shift_id',
        request.target_shift_id,
        'Target shift must belong to the target user'
      )
    }

    // Create the swap request
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .insert(request)
      .select()
      .single()
    
    if (error) throw error
    return data as SwapRequest
  },

  /**
   * Clear approval timestamps (used when revoking)
   */
  async clearApprovalTimestamps(id: string): Promise<void> {
    validateUUID(id, 'id')

    const { error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .update({
        tl_approved_at: null,
        wfm_approved_at: null,
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Update swap request status with optimistic locking
   */
  async updateSwapRequestStatus(
    id: string,
    status: SwapRequestStatus,
    approvalField?: 'tl_approved_at' | 'wfm_approved_at',
    expectedStatus?: SwapRequestStatus
  ): Promise<SwapRequest> {
    // Validate input
    validateUUID(id, 'id')

    // If expectedStatus is provided, implement optimistic locking
    if (expectedStatus) {
      // Query current status
      const { data: currentRequest, error: fetchError } = await supabase
        .from(API_ENDPOINTS.SWAP_REQUESTS)
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new ResourceNotFoundError('SwapRequest', id)
        }
        throw fetchError
      }

      // Check if status matches expected
      if (currentRequest.status !== expectedStatus) {
        throw new ConcurrencyError(
          'SwapRequest',
          id,
          expectedStatus,
          currentRequest.status
        )
      }
    }

    const updates: Record<string, string> = { status }
    
    if (approvalField) {
      updates[approvalField] = new Date().toISOString()
    }
    
    // Update with WHERE clause checking status if expectedStatus provided
    let query = supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .update(updates)
      .eq('id', id)

    // Add status check to WHERE clause for optimistic locking
    if (expectedStatus) {
      query = query.eq('status', expectedStatus)
    }

    const { data, error } = await query
      .select()
      .single()
    
    if (error) {
      // If no rows were updated due to status mismatch, throw concurrency error
      if (error.code === 'PGRST116') {
        throw new ConcurrencyError(
          'SwapRequest',
          id,
          expectedStatus || 'unknown',
          'changed by another process'
        )
      }
      throw error
    }

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
