// Leave types service - centralized leave type management

import { supabase } from '../lib/supabase'
import type { LeaveType } from '../types'

export interface LeaveTypeConfig {
  id: string
  code: LeaveType
  label: string
  description: string
  color: string
  display_order: number
  is_active: boolean
  created_at: string
}

export const leaveTypesService = {
  /**
   * Get all active leave types
   */
  async getActiveLeaveTypes(): Promise<LeaveTypeConfig[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (error) throw error
    return data as LeaveTypeConfig[]
  },

  /**
   * Get all leave types (including inactive)
   */
  async getAllLeaveTypes(): Promise<LeaveTypeConfig[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) throw error
    return data as LeaveTypeConfig[]
  },

  /**
   * Get leave type by code
   */
  async getLeaveTypeByCode(code: LeaveType): Promise<LeaveTypeConfig | null> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('code', code)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as LeaveTypeConfig
  },

  /**
   * Create a new leave type (WFM only)
   */
  async createLeaveType(leaveType: Omit<LeaveTypeConfig, 'id' | 'created_at'>): Promise<LeaveTypeConfig> {
    const { data, error } = await supabase
      .from('leave_types')
      .insert(leaveType)
      .select()
      .single()
    
    if (error) throw error
    return data as LeaveTypeConfig
  },

  /**
   * Update leave type (WFM only)
   */
  async updateLeaveType(id: string, updates: Partial<LeaveTypeConfig>): Promise<LeaveTypeConfig> {
    const { data, error } = await supabase
      .from('leave_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as LeaveTypeConfig
  },

  /**
   * Delete/deactivate leave type (WFM only)
   */
  async deactivateLeaveType(id: string): Promise<void> {
    const { error } = await supabase
      .from('leave_types')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) throw error
  },
}
