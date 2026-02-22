// Swap requests service

import { supabase } from '../lib/supabase';
import type { SwapRequest, SwapRequestStatus, SwapExecutionResult } from '../types';
import { API_ENDPOINTS, PAGINATION } from '../constants';
import { validateUUID, validateSwapRequestData } from '../validation';
import {
  SwapExecutionError,
  ValidationError,
  ConcurrencyError,
  ResourceNotFoundError,
} from '../types/errors';
import type { PaginatedResponse } from '../hooks/usePaginatedQuery';

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
      );
    }

    // Get the shift details to extract dates
    const { data: requesterShift, error: requesterShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('date')
      .eq('id', swapRequest.requester_shift_id)
      .single();

    if (requesterShiftError || !requesterShift) {
      throw new SwapExecutionError(swapRequest.id, 'Requester shift not found', {
        requester_shift_id: swapRequest.requester_shift_id,
      });
    }

    const { data: targetShift, error: targetShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('date')
      .eq('id', swapRequest.target_shift_id)
      .single();

    if (targetShiftError || !targetShift) {
      throw new SwapExecutionError(swapRequest.id, 'Target shift not found', {
        target_shift_id: swapRequest.target_shift_id,
      });
    }

    // Call the stored procedure via Supabase RPC
    const { data, error } = await supabase.rpc('execute_shift_swap', {
      p_requester_id: swapRequest.requester_id,
      p_target_user_id: swapRequest.target_user_id,
      p_requester_date: requesterShift.date,
      p_target_date: targetShift.date,
    });

    if (error) {
      throw new SwapExecutionError(swapRequest.id, error.message, { error_code: error.code });
    }

    const result = data as SwapExecutionResult;

    // Check if the stored procedure returned an error
    if (!result.success) {
      const errorDetails = result.error_code ? { error_code: result.error_code } : undefined;
      throw new SwapExecutionError(
        swapRequest.id,
        result.error || 'Unknown error during swap execution',
        errorDetails
      );
    }

    return result;
  },

  /**
   * Get all swap requests with pagination support
   * @param cursor - Cursor for pagination (created_at timestamp)
   * @param limit - Number of items per page
   */
  async getSwapRequestsPaginated(
    cursor?: string,
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<SwapRequest>> {
    // Validate and cap limit
    const validatedLimit = Math.min(Math.max(1, limit), PAGINATION.MAX_PAGE_SIZE);

    // Build query
    let query = supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(
        `
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `
      )
      .order('created_at', { ascending: false })
      .limit(validatedLimit + 1); // Fetch one extra to check if there are more

    // Apply cursor if provided
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Check if there are more results
    const hasMore = data.length > validatedLimit;
    const items = hasMore ? data.slice(0, validatedLimit) : data;

    // Get next cursor from last item
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at : undefined;

    return {
      data: items as SwapRequest[],
      nextCursor,
      hasMore,
    };
  },

  /**
   * Get all swap requests (non-paginated - for backward compatibility)
   */
  async getSwapRequests(): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(
        `
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SwapRequest[];
  },

  /**
   * Get swap request by ID
   */
  async getSwapRequestById(id: string): Promise<SwapRequest> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(
        `
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email, role),
        target:users!swap_requests_target_user_id_fkey(id, name, email, role),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as SwapRequest;
  },

  /**
   * Create a new swap request with validation
   * Supports all original shift type fields and complex swap request data structure
   */
  async createSwapRequest(
    request: Omit<
      SwapRequest,
      'id' | 'created_at' | 'status' | 'tl_approved_at' | 'wfm_approved_at'
    >
  ): Promise<SwapRequest> {
    // Input validation
    validateSwapRequestData({
      requesterId: request.requester_id,
      targetUserId: request.target_user_id,
      requesterShiftId: request.requester_shift_id,
      targetShiftId: request.target_shift_id,
    });

    // Validate that both shifts exist
    const { data: requesterShift, error: requesterShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('id, user_id, date, shift_type')
      .eq('id', request.requester_shift_id)
      .single();

    if (requesterShiftError || !requesterShift) {
      throw new ResourceNotFoundError('Shift', request.requester_shift_id);
    }

    const { data: targetShift, error: targetShiftError } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('id, user_id, date, shift_type')
      .eq('id', request.target_shift_id)
      .single();

    if (targetShiftError || !targetShift) {
      throw new ResourceNotFoundError('Shift', request.target_shift_id);
    }

    // Validate that requester owns the requester shift
    if (requesterShift.user_id !== request.requester_id) {
      throw new ValidationError(
        'requester_shift_id',
        request.requester_shift_id,
        'Requester shift must belong to the requester'
      );
    }

    // Validate that target owns the target shift
    if (targetShift.user_id !== request.target_user_id) {
      throw new ValidationError(
        'target_shift_id',
        request.target_shift_id,
        'Target shift must belong to the target user'
      );
    }

    // Create the swap request with all fields including original shift types
    const swapRequestData = {
      requester_id: request.requester_id,
      target_user_id: request.target_user_id,
      requester_shift_id: request.requester_shift_id,
      target_shift_id: request.target_shift_id,
      status: 'pending_acceptance' as SwapRequestStatus,
      // Include all original shift type fields if provided
      ...(request.requester_original_date && {
        requester_original_date: request.requester_original_date,
      }),
      ...(request.requester_original_shift_type && {
        requester_original_shift_type: request.requester_original_shift_type,
      }),
      ...(request.target_original_date && { target_original_date: request.target_original_date }),
      ...(request.target_original_shift_type && {
        target_original_shift_type: request.target_original_shift_type,
      }),
      ...(request.requester_original_shift_type_on_target_date && {
        requester_original_shift_type_on_target_date:
          request.requester_original_shift_type_on_target_date,
      }),
      ...(request.target_original_shift_type_on_requester_date && {
        target_original_shift_type_on_requester_date:
          request.target_original_shift_type_on_requester_date,
      }),
    };

    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .insert(swapRequestData)
      .select()
      .single();

    if (error) throw error;
    return data as SwapRequest;
  },
  /**
   * Clear approval timestamps (used when revoking)
   */
  async clearApprovalTimestamps(id: string): Promise<void> {
    validateUUID(id, 'id');

    const { error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .update({
        tl_approved_at: null,
        wfm_approved_at: null,
      })
      .eq('id', id);

    if (error) throw error;
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
    validateUUID(id, 'id');

    // If expectedStatus is provided, implement optimistic locking
    if (expectedStatus) {
      // Query current status
      const { data: currentRequest, error: fetchError } = await supabase
        .from(API_ENDPOINTS.SWAP_REQUESTS)
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new ResourceNotFoundError('SwapRequest', id);
        }
        throw fetchError;
      }

      // Check if status matches expected
      if (currentRequest.status !== expectedStatus) {
        throw new ConcurrencyError('SwapRequest', id, expectedStatus, currentRequest.status);
      }
    }

    const updates: Record<string, string> = { status };

    if (approvalField) {
      updates[approvalField] = new Date().toISOString();
    }

    // Update with WHERE clause checking status if expectedStatus provided
    let query = supabase.from(API_ENDPOINTS.SWAP_REQUESTS).update(updates).eq('id', id);

    // Add status check to WHERE clause for optimistic locking
    if (expectedStatus) {
      query = query.eq('status', expectedStatus);
    }

    const { data, error } = await query.select().single();

    if (error) {
      // If no rows were updated due to status mismatch, throw concurrency error
      if (error.code === 'PGRST116') {
        throw new ConcurrencyError(
          'SwapRequest',
          id,
          expectedStatus || 'unknown',
          'changed by another process'
        );
      }
      throw error;
    }

    return data as SwapRequest;
  },

  /**
   * Delete swap request
   */
  async deleteSwapRequest(id: string): Promise<void> {
    const { error } = await supabase.from(API_ENDPOINTS.SWAP_REQUESTS).delete().eq('id', id);

    if (error) throw error;
  },

  /**
   * Get user's swap requests (as requester or target)
   */
  async getUserSwapRequests(userId: string): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SWAP_REQUESTS)
      .select(
        `
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `
      )
      .or(`requester_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SwapRequest[];
  },

  /**
   * Get pending swap requests for approval
   */
  async getPendingSwapRequests(status?: SwapRequestStatus): Promise<SwapRequest[]> {
    let query = supabase.from(API_ENDPOINTS.SWAP_REQUESTS).select(`
        *,
        requester:users!swap_requests_requester_id_fkey(id, name, email),
        target:users!swap_requests_target_user_id_fkey(id, name, email),
        requester_shift:shifts!swap_requests_requester_shift_id_fkey(date, shift_type),
        target_shift:shifts!swap_requests_target_shift_id_fkey(date, shift_type)
      `);

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['pending_acceptance', 'pending_tl', 'pending_wfm']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as SwapRequest[];
  },
};
