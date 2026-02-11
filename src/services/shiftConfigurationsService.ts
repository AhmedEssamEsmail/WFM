// Shift Configurations Service

import { supabase } from '../lib/supabase'
import type { ShiftConfiguration } from '../types'

const SHIFT_CONFIGURATIONS_TABLE = 'shift_configurations'

export const shiftConfigurationsService = {
  /**
   * Get all shift configurations
   */
  async getAllShiftConfigurations(): Promise<ShiftConfiguration[]> {
    const { data, error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    return data as ShiftConfiguration[]
  },

  /**
   * Get only active shift configurations
   */
  async getActiveShiftConfigurations(): Promise<ShiftConfiguration[]> {
    const { data, error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data as ShiftConfiguration[]
  },

  /**
   * Get shift configuration by code
   */
  async getShiftByCode(shiftCode: string): Promise<ShiftConfiguration | null> {
    const { data, error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .select('*')
      .eq('shift_code', shiftCode)
      .maybeSingle()

    if (error) throw error
    return data as ShiftConfiguration | null
  },

  /**
   * Create a new shift configuration
   */
  async createShiftConfiguration(
    shift: Omit<ShiftConfiguration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ShiftConfiguration> {
    const { data, error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .insert(shift)
      .select()
      .single()

    if (error) throw error
    return data as ShiftConfiguration
  },

  /**
   * Update a shift configuration
   */
  async updateShiftConfiguration(
    id: string,
    updates: Partial<Omit<ShiftConfiguration, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ShiftConfiguration> {
    const { data, error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ShiftConfiguration
  },

  /**
   * Delete a shift configuration
   */
  async deleteShiftConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Toggle shift active status
   */
  async toggleShiftActive(id: string, isActive: boolean): Promise<ShiftConfiguration> {
    const { data, error } = await supabase
      .from(SHIFT_CONFIGURATIONS_TABLE)
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as ShiftConfiguration
  },

  /**
   * Get shift hours map for auto-distribution
   */
  async getShiftHoursMap(): Promise<Record<string, { start: string; end: string } | null>> {
    const shifts = await this.getActiveShiftConfigurations()
    const map: Record<string, { start: string; end: string } | null> = {}

    for (const shift of shifts) {
      if (shift.shift_code === 'OFF') {
        map[shift.shift_code] = null
      } else {
        map[shift.shift_code] = {
          start: shift.start_time,
          end: shift.end_time,
        }
      }
    }

    return map
  },
}
