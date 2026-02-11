// Headcount service

import { supabase } from '../lib/supabase'
import type { HeadcountUser, Department } from '../types'
import { API_ENDPOINTS, PAGINATION } from '../constants'
import type { PaginatedResponse } from '../hooks/usePaginatedQuery'

export const headcountService = {
  /**
   * Get all employees with pagination support
   * @param cursor - Cursor for pagination (name for alphabetical sorting)
   * @param limit - Number of items per page
   */
  async getEmployeesPaginated(
    cursor?: string,
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResponse<HeadcountUser>> {
    // Validate and cap limit
    const validatedLimit = Math.min(
      Math.max(1, limit),
      PAGINATION.MAX_PAGE_SIZE
    )

    // Build query
    let query = supabase
      .from('v_headcount_active')
      .select('*')
      .order('name', { ascending: true })
      .limit(validatedLimit + 1) // Fetch one extra to check if there are more

    // Apply cursor if provided (for alphabetical pagination)
    if (cursor) {
      query = query.gt('name', cursor)
    }

    const { data, error } = await query

    if (error) throw error

    // Check if there are more results
    const hasMore = data.length > validatedLimit
    const items = hasMore ? data.slice(0, validatedLimit) : data

    // Get next cursor from last item
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].name
      : undefined

    return {
      data: items as HeadcountUser[],
      nextCursor,
      hasMore,
    }
  },

  /**
   * Get all employees (non-paginated - for backward compatibility)
   */
  async getEmployees(): Promise<HeadcountUser[]> {
    const { data, error } = await supabase
      .from('v_headcount_active')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data as HeadcountUser[]
  },

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<HeadcountUser> {
    const { data, error } = await supabase
      .from('v_headcount_active')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as HeadcountUser
  },

  /**
   * Update employee
   */
  async updateEmployee(id: string, updates: Partial<HeadcountUser>): Promise<void> {
    // Split updates between users and headcount_profiles tables
    const userUpdates: Record<string, unknown> = {}
    const profileUpdates: Record<string, unknown> = {}
    
    const userFields = ['name', 'email', 'role', 'employee_id', 'status', 'department', 'hire_date', 'manager_id']
    const profileFields = ['job_title', 'job_level', 'employment_type', 'location', 'time_zone', 'phone', 'skills', 'certifications', 'max_weekly_hours', 'cost_center', 'budget_code', 'termination_date', 'onboarding_status']
    
    Object.entries(updates).forEach(([key, value]) => {
      if (userFields.includes(key)) {
        userUpdates[key] = value
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = value
      }
    })
    
    // Update users table
    if (Object.keys(userUpdates).length > 0) {
      const { error } = await supabase
        .from(API_ENDPOINTS.USERS)
        .update(userUpdates)
        .eq('id', id)
      
      if (error) throw error
    }
    
    // Update headcount_profiles table
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString()
      
      const { error } = await supabase
        .from(API_ENDPOINTS.HEADCOUNT_PROFILES)
        .upsert({ user_id: id, ...profileUpdates }, { onConflict: 'user_id' })
      
      if (error) throw error
    }
  },

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.DEPARTMENTS)
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data as Department[]
  },

  /**
   * Get headcount metrics
   */
  async getHeadcountMetrics(): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('v_department_summary')
      .select('*')
    
    if (error) throw error
    return data
  },

  /**
   * Log headcount audit
   */
  async logAudit(userId: string, action: string, previousValues: Record<string, unknown>, newValues: Record<string, unknown>, performedBy: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from(API_ENDPOINTS.HEADCOUNT_AUDIT_LOG)
      .insert({
        user_id: userId,
        action,
        previous_values: previousValues,
        new_values: newValues,
        performed_by: performedBy,
        reason,
        effective_date: new Date().toISOString().split('T')[0],
      })
    
    if (error) throw error
  },

  /**
   * Get audit log for an employee
   */
  async getEmployeeAuditLog(userId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.HEADCOUNT_AUDIT_LOG)
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
    
    if (error) throw error
    return data
  },
}
