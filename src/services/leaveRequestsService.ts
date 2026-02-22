// Leave requests service

import { supabase } from '../lib/supabase';
import type { LeaveRequest, LeaveRequestStatus, LeaveType } from '../types';
import { API_ENDPOINTS, PAGINATION } from '../constants';
import {
  validateUUID,
  validateLeaveType,
  validateDateRange,
  validateLeaveRequestData,
  validateLeaveRequest,
} from '../validation';
import { sanitizeUserInput } from '../utils/sanitize';
import { ConcurrencyError, ResourceNotFoundError } from '../types/errors';
import type { PaginatedResponse } from '../hooks/usePaginatedQuery';

export const leaveRequestsService = {
  /**
   * Get all leave requests with pagination support
   * @param cursor - Cursor for pagination (created_at timestamp)
   * @param limit - Number of items per page
   */
  async getLeaveRequestsPaginated(
    cursor?: string,
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<LeaveRequest>> {
    // Validate and cap limit
    const validatedLimit = Math.min(Math.max(1, limit), PAGINATION.MAX_PAGE_SIZE);

    // Build query
    let query = supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
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
      data: items as LeaveRequest[],
      nextCursor,
      hasMore,
    };
  },

  /**
   * Get all leave requests (non-paginated - for backward compatibility)
   */
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as LeaveRequest[];
  },

  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as LeaveRequest;
  },

  /**
   * Create a new leave request
   */
  async createLeaveRequest(
    request: Omit<
      LeaveRequest,
      'id' | 'created_at' | 'status' | 'tl_approved_at' | 'wfm_approved_at'
    >,
    status: LeaveRequestStatus = 'pending_tl'
  ): Promise<LeaveRequest> {
    // Input validation
    validateUUID(request.user_id, 'user_id');
    validateLeaveType(request.leave_type);
    validateDateRange(request.start_date, request.end_date, 'start_date', 'end_date');

    // Sanitize notes if provided
    const sanitizedNotes = request.notes ? sanitizeUserInput(request.notes) : null;

    // Validate string length for notes (max 1000 characters)
    if (sanitizedNotes && sanitizedNotes.length > 1000) {
      throw new Error('Notes must not exceed 1000 characters');
    }

    // Calculate requested days for validation
    const { getBusinessDaysBetween } = await import('../utils/dateHelpers');
    const requestedDays = getBusinessDaysBetween(request.start_date, request.end_date);

    // Validate leave request data
    validateLeaveRequestData({
      userId: request.user_id,
      leaveType: request.leave_type,
      startDate: request.start_date,
      endDate: request.end_date,
      requestedDays,
    });

    // Service-layer validation: Check balance and overlapping requests
    await validateLeaveRequest(
      request.user_id,
      request.leave_type as LeaveType,
      request.start_date,
      request.end_date
    );

    // Create the leave request
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .insert({
        ...request,
        notes: sanitizedNotes,
        status,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeaveRequest;
  },
  /**
   * Update leave request status with optimistic locking
   */
  async updateLeaveRequestStatus(
    id: string,
    status: LeaveRequestStatus,
    approvalField?: 'tl_approved_at' | 'wfm_approved_at',
    expectedStatus?: LeaveRequestStatus
  ): Promise<LeaveRequest> {
    // Validate input
    validateUUID(id, 'id');

    // If expectedStatus is provided, implement optimistic locking
    if (expectedStatus) {
      // Query current status
      const { data: currentRequest, error: fetchError } = await supabase
        .from(API_ENDPOINTS.LEAVE_REQUESTS)
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new ResourceNotFoundError('LeaveRequest', id);
        }
        throw fetchError;
      }

      // Check if status matches expected
      if (currentRequest.status !== expectedStatus) {
        throw new ConcurrencyError('LeaveRequest', id, expectedStatus, currentRequest.status);
      }
    }

    const updates: Record<string, string> = { status };

    if (approvalField) {
      updates[approvalField] = new Date().toISOString();
    }

    // Update with WHERE clause checking status if expectedStatus provided
    let query = supabase.from(API_ENDPOINTS.LEAVE_REQUESTS).update(updates).eq('id', id);

    // Add status check to WHERE clause for optimistic locking
    if (expectedStatus) {
      query = query.eq('status', expectedStatus);
    }

    const { data, error } = await query.select().single();

    if (error) {
      // If no rows were updated due to status mismatch, throw concurrency error
      if (error.code === 'PGRST116') {
        throw new ConcurrencyError(
          'LeaveRequest',
          id,
          expectedStatus || 'unknown',
          'changed by another process'
        );
      }
      throw error;
    }

    return data as LeaveRequest;
  },

  /**
   * Delete leave request
   */
  async deleteLeaveRequest(id: string): Promise<void> {
    const { error } = await supabase.from(API_ENDPOINTS.LEAVE_REQUESTS).delete().eq('id', id);

    if (error) throw error;
  },

  /**
   * Get user's leave requests
   */
  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as LeaveRequest[];
  },

  /**
   * Get pending leave requests for approval
   */
  async getPendingLeaveRequests(status?: LeaveRequestStatus): Promise<LeaveRequest[]> {
    let query = supabase
      .from(API_ENDPOINTS.LEAVE_REQUESTS)
      .select('*, users(id, name, email, role)');

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['pending_tl', 'pending_wfm']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as LeaveRequest[];
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
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data as LeaveRequest[];
  },
};
