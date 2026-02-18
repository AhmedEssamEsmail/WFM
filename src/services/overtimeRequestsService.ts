// Overtime requests service

import { supabase } from '../lib/supabase'
import type {
  OvertimeRequest,
  OvertimeStatus,
  CreateOvertimeRequestInput,
  OvertimeRequestFilters,
  OvertimeStatistics,
  OvertimeSummary,
  OvertimeHours,
  AgentOvertimeStats,
  OvertimeTrend,
} from '../types/overtime'
import { API_ENDPOINTS } from '../constants'
import { validateUUID } from '../validation'
import { ResourceNotFoundError, ConcurrencyError, ValidationError } from '../types/errors'
import { commentsService } from './commentsService'
import { overtimeSettingsService } from './overtimeSettingsService'

export const overtimeRequestsService = {
  /**
   * Create a new overtime request
   */
  async createOvertimeRequest(
    input: CreateOvertimeRequestInput
  ): Promise<OvertimeRequest> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Validate input
    if (!input.request_date || !input.start_time || !input.end_time) {
      throw new ValidationError('request_date, start_time, end_time', '', 'All fields are required')
    }

    if (!input.overtime_type || !['regular', 'double'].includes(input.overtime_type)) {
      throw new ValidationError('overtime_type', input.overtime_type, 'Must be "regular" or "double"')
    }

    if (!input.reason || input.reason.length < 10 || input.reason.length > 250) {
      throw new ValidationError('reason', input.reason, 'Reason must be between 10 and 250 characters')
    }

    // Calculate total hours
    const startTime = new Date(`1970-01-01T${input.start_time}`)
    const endTime = new Date(`1970-01-01T${input.end_time}`)
    const diffMs = endTime.getTime() - startTime.getTime()
    const total_hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2))

    if (total_hours <= 0 || total_hours > 24) {
      throw new ValidationError('total_hours', total_hours.toString(), 'Total hours must be between 0 and 24')
    }

    // Create the overtime request
    const { data, error } = await supabase
      .from('overtime_requests')
      .insert({
        requester_id: user.id,
        request_date: input.request_date,
        start_time: input.start_time,
        end_time: input.end_time,
        total_hours,
        overtime_type: input.overtime_type,
        reason: input.reason,
        status: 'pending_tl',
      })
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)
      .single()

    if (error) throw error
    return data as OvertimeRequest
  },

  /**
   * Get overtime requests with filtering and pagination
   */
  async getOvertimeRequests(
    filters: OvertimeRequestFilters = {}
  ): Promise<{ data: OvertimeRequest[]; pagination: { page: number; per_page: number; total: number } }> {
    const page = filters.page || 1
    const per_page = Math.min(filters.per_page || 50, 50) // Cap at 50
    const offset = (page - 1) * per_page

    // Build query
    let query = supabase
      .from('overtime_requests')
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.date_from) {
      query = query.gte('request_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('request_date', filters.date_to)
    }

    if (filters.agent_name) {
      // This will be filtered client-side after fetching
      // as Supabase doesn't support filtering on joined table fields directly
    }

    if (filters.department) {
      // This will be filtered client-side after fetching
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + per_page - 1)

    const { data, error, count } = await query

    if (error) throw error

    let filteredData = (data as OvertimeRequest[]) || []

    // Apply client-side filters
    if (filters.agent_name) {
      const searchTerm = filters.agent_name.toLowerCase()
      filteredData = filteredData.filter(req =>
        req.requester?.name?.toLowerCase().includes(searchTerm)
      )
    }

    if (filters.department) {
      filteredData = filteredData.filter(req =>
        req.requester?.department === filters.department
      )
    }

    return {
      data: filteredData,
      pagination: {
        page,
        per_page,
        total: count || 0,
      },
    }
  },

  /**
   * Get overtime request by ID
   */
  async getOvertimeRequestById(id: string): Promise<OvertimeRequest> {
    validateUUID(id, 'id')

    const { data, error } = await supabase
      .from('overtime_requests')
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ResourceNotFoundError('OvertimeRequest', id)
      }
      throw error
    }

    return data as OvertimeRequest
  },

  /**
   * Approve an overtime request (TL or WFM)
   */
  async approveOvertimeRequest(id: string, notes: string): Promise<OvertimeRequest> {
    validateUUID(id, 'id')

    if (!notes || notes.trim().length === 0) {
      throw new ValidationError('notes', notes, 'Notes are required for approval')
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user details for system comment
    const { data: userData } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single()

    // Get current request to determine status
    const currentRequest = await this.getOvertimeRequestById(id)

    let updates: Partial<OvertimeRequest> = {}
    let newStatus: OvertimeStatus
    let isAutoApprove = false

    if (currentRequest.status === 'pending_tl') {
      // Team Lead approval
      updates = {
        tl_reviewed_by: user.id,
        tl_reviewed_at: new Date().toISOString(),
        tl_decision: 'approved',
        tl_notes: notes,
      }

      // Check auto-approve setting
      const { data: autoApproveSetting } = await supabase
        .from(API_ENDPOINTS.OVERTIME_SETTINGS)
        .select('setting_value')
        .eq('setting_key', 'auto_approve')
        .single()

      const autoApproveEnabled = autoApproveSetting?.setting_value?.enabled || false

      if (autoApproveEnabled) {
        // Auto-approve: skip WFM review
        newStatus = 'approved'
        isAutoApprove = true
        updates.wfm_reviewed_by = user.id
        updates.wfm_reviewed_at = new Date().toISOString()
        updates.wfm_decision = 'approved'
        updates.wfm_notes = 'Auto-approved (setting enabled)'
        updates.status = newStatus
      } else {
        // Normal flow: move to pending_wfm
        newStatus = 'pending_wfm'
        updates.status = newStatus
      }
    } else if (currentRequest.status === 'pending_wfm') {
      // WFM approval
      newStatus = 'approved'
      updates = {
        wfm_reviewed_by: user.id,
        wfm_reviewed_at: new Date().toISOString(),
        wfm_decision: 'approved',
        wfm_notes: notes,
        status: newStatus,
      }
    } else {
      throw new ValidationError('status', currentRequest.status, 'Request cannot be approved in current status')
    }

    // Update the request
    const { data, error } = await supabase
      .from('overtime_requests')
      .update(updates)
      .eq('id', id)
      .eq('status', currentRequest.status) // Optimistic locking
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ConcurrencyError('OvertimeRequest', id, currentRequest.status, 'changed by another process')
      }
      throw error
    }

    // Create system comment
    const userName = userData?.name || 'Unknown User'
    let commentContent = ''

    if (isAutoApprove) {
      commentContent = `Overtime request auto-approved by ${userName} (Team Lead). Notes: ${notes}`
    } else if (currentRequest.status === 'pending_tl') {
      commentContent = `Overtime request approved by ${userName} (Team Lead). Notes: ${notes}`
    } else if (currentRequest.status === 'pending_wfm') {
      commentContent = `Overtime request approved by ${userName} (WFM Administrator). Notes: ${notes}`
    }

    await commentsService.createSystemComment(
      id,
      'overtime_request',
      commentContent,
      user.id
    )

    return data as OvertimeRequest
  },

  /**
   * Reject an overtime request (TL or WFM)
   */
  async rejectOvertimeRequest(id: string, notes: string): Promise<OvertimeRequest> {
    validateUUID(id, 'id')

    if (!notes || notes.trim().length === 0) {
      throw new ValidationError('notes', notes, 'Notes are required for rejection')
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user details for system comment
    const { data: userData } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single()

    // Get current request to determine status
    const currentRequest = await this.getOvertimeRequestById(id)

    const updates: Partial<OvertimeRequest> = {
      status: 'rejected',
    }

    if (currentRequest.status === 'pending_tl') {
      // Team Lead rejection
      updates.tl_reviewed_by = user.id
      updates.tl_reviewed_at = new Date().toISOString()
      updates.tl_decision = 'rejected'
      updates.tl_notes = notes
    } else if (currentRequest.status === 'pending_wfm') {
      // WFM rejection
      updates.wfm_reviewed_by = user.id
      updates.wfm_reviewed_at = new Date().toISOString()
      updates.wfm_decision = 'rejected'
      updates.wfm_notes = notes
    } else {
      throw new ValidationError('status', currentRequest.status, 'Request cannot be rejected in current status')
    }

    // Update the request
    const { data, error } = await supabase
      .from('overtime_requests')
      .update(updates)
      .eq('id', id)
      .eq('status', currentRequest.status) // Optimistic locking
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ConcurrencyError('OvertimeRequest', id, currentRequest.status, 'changed by another process')
      }
      throw error
    }

    // Create system comment
    const userName = userData?.name || 'Unknown User'
    let commentContent = ''

    if (currentRequest.status === 'pending_tl') {
      commentContent = `Overtime request rejected by ${userName} (Team Lead). Reason: ${notes}`
    } else if (currentRequest.status === 'pending_wfm') {
      commentContent = `Overtime request rejected by ${userName} (WFM Administrator). Reason: ${notes}`
    }

    await commentsService.createSystemComment(
      id,
      'overtime_request',
      commentContent,
      user.id
    )

    return data as OvertimeRequest
  },

  /**
   * Cancel an overtime request (Agent only)
   */
  async cancelOvertimeRequest(id: string): Promise<OvertimeRequest> {
    validateUUID(id, 'id')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user details for system comment
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    // Get current request
    const currentRequest = await this.getOvertimeRequestById(id)

    // Verify user is the requester
    if (currentRequest.requester_id !== user.id) {
      throw new Error('Only the requester can cancel this request')
    }

    // Verify status is pending
    if (!['pending_tl', 'pending_wfm'].includes(currentRequest.status)) {
      throw new ValidationError('status', currentRequest.status, 'Only pending requests can be cancelled')
    }

    // Update the request
    const { data, error } = await supabase
      .from('overtime_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', currentRequest.status) // Optimistic locking
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ConcurrencyError('OvertimeRequest', id, currentRequest.status, 'changed by another process')
      }
      throw error
    }

    // Create system comment
    const userName = userData?.name || 'Unknown User'
    const commentContent = `Overtime request cancelled by ${userName}.`

    await commentsService.createSystemComment(
      id,
      'overtime_request',
      commentContent,
      user.id
    )

    return data as OvertimeRequest
  },

  /**
   * Get overtime statistics for reporting
   */
  async getOvertimeStatistics(filters: OvertimeRequestFilters = {}): Promise<OvertimeStatistics> {
    // Build query
    let query = supabase
      .from('overtime_requests')
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)

    // Apply date filters
    if (filters.date_from) {
      query = query.gte('request_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('request_date', filters.date_to)
    }

    // Apply department filter
    if (filters.department) {
      // Will be filtered client-side
    }

    const { data, error } = await query

    if (error) throw error

    let requests = (data as OvertimeRequest[]) || []

    // Apply client-side department filter
    if (filters.department) {
      requests = requests.filter(req => req.requester?.department === filters.department)
    }

    // Get settings for pay multipliers
    const settings = await overtimeSettingsService.getOvertimeSettings()

    // Calculate summary statistics
    const totalRequests = requests.length
    const approved = requests.filter(r => r.status === 'approved').length
    const rejected = requests.filter(r => r.status === 'rejected').length
    const pending = requests.filter(r => r.status === 'pending_tl' || r.status === 'pending_wfm').length
    const approvalRate = totalRequests > 0 ? Math.round((approved / totalRequests) * 100) : 0

    const summary: OvertimeSummary = {
      total_requests: totalRequests,
      approved,
      rejected,
      pending,
      approval_rate: approvalRate,
    }

    // Calculate hours breakdown (only approved requests)
    const approvedRequests = requests.filter(r => r.status === 'approved')
    const regularHours = approvedRequests
      .filter(r => r.overtime_type === 'regular')
      .reduce((sum, r) => sum + r.total_hours, 0)
    const doubleHours = approvedRequests
      .filter(r => r.overtime_type === 'double')
      .reduce((sum, r) => sum + r.total_hours, 0)
    const totalHours = regularHours + doubleHours
    const equivalentHours = 
      (regularHours * settings.pay_multipliers.regular) + 
      (doubleHours * settings.pay_multipliers.double)

    const hours: OvertimeHours = {
      total_hours: Number(totalHours.toFixed(2)),
      regular_hours: Number(regularHours.toFixed(2)),
      double_hours: Number(doubleHours.toFixed(2)),
      equivalent_hours: Number(equivalentHours.toFixed(2)),
    }

    // Calculate by agent (top 5, only approved)
    const agentMap = new Map<string, AgentOvertimeStats>()
    
    approvedRequests.forEach(req => {
      if (!req.requester) return

      const userId = req.requester.id
      if (!agentMap.has(userId)) {
        agentMap.set(userId, {
          user_id: userId,
          name: req.requester.name,
          department: req.requester.department,
          total_hours: 0,
          regular_hours: 0,
          double_hours: 0,
          equivalent_hours: 0,
          request_count: 0,
        })
      }

      const stats = agentMap.get(userId)!
      stats.total_hours += req.total_hours
      stats.request_count += 1

      if (req.overtime_type === 'regular') {
        stats.regular_hours += req.total_hours
        stats.equivalent_hours += req.total_hours * settings.pay_multipliers.regular
      } else {
        stats.double_hours += req.total_hours
        stats.equivalent_hours += req.total_hours * settings.pay_multipliers.double
      }
    })

    const byAgent = Array.from(agentMap.values())
      .sort((a, b) => b.total_hours - a.total_hours)
      .slice(0, 5)
      .map(agent => ({
        ...agent,
        total_hours: Number(agent.total_hours.toFixed(2)),
        regular_hours: Number(agent.regular_hours.toFixed(2)),
        double_hours: Number(agent.double_hours.toFixed(2)),
        equivalent_hours: Number(agent.equivalent_hours.toFixed(2)),
      }))

    // Calculate by type (all requests)
    const regularCount = requests.filter(r => r.overtime_type === 'regular').length
    const regularTypeHours = requests
      .filter(r => r.overtime_type === 'regular')
      .reduce((sum, r) => sum + r.total_hours, 0)
    const doubleCount = requests.filter(r => r.overtime_type === 'double').length
    const doubleTypeHours = requests
      .filter(r => r.overtime_type === 'double')
      .reduce((sum, r) => sum + r.total_hours, 0)

    const byType = {
      regular: {
        count: regularCount,
        hours: Number(regularTypeHours.toFixed(2)),
      },
      double: {
        count: doubleCount,
        hours: Number(doubleTypeHours.toFixed(2)),
      },
    }

    // Calculate weekly trend (last 8 weeks, only approved)
    const weekMap = new Map<string, number>()
    
    approvedRequests.forEach(req => {
      const date = new Date(req.request_date)
      const year = date.getFullYear()
      const week = getWeekNumber(date)
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`
      
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + req.total_hours)
    })

    const trend: OvertimeTrend[] = Array.from(weekMap.entries())
      .map(([week, hours]) => ({
        week,
        hours: Number(hours.toFixed(2)),
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8) // Last 8 weeks

    return {
      summary,
      hours,
      by_agent: byAgent,
      by_type: byType,
      trend,
    }
  },

  /**
   * Export overtime requests to CSV
   */
  async exportOvertimeCSV(filters: OvertimeRequestFilters = {}): Promise<string> {
    // Build query for approved requests only
    let query = supabase
      .from('overtime_requests')
      .select(`
        *,
        requester:users!overtime_requests_requester_id_fkey(id, name, department, employee_id)
      `)
      .eq('status', 'approved')

    // Apply date filters
    if (filters.date_from) {
      query = query.gte('request_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('request_date', filters.date_to)
    }

    // Apply department filter
    if (filters.department) {
      // Will be filtered client-side
    }

    const { data, error } = await query

    if (error) throw error

    let requests = (data as OvertimeRequest[]) || []

    // Apply client-side department filter
    if (filters.department) {
      requests = requests.filter(req => req.requester?.department === filters.department)
    }

    // Get settings for pay multipliers
    const settings = await overtimeSettingsService.getOvertimeSettings()

    // Generate CSV using helper
    const { generateOvertimeCSV } = await import('../utils/overtimeCsvHelpers')
    return generateOvertimeCSV(requests, settings)
  },
}

/**
 * Helper function to get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
