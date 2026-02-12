// Overtime Settings Service

import { supabase } from '../lib/supabase'
import { API_ENDPOINTS } from '../constants'
import type { OvertimeSettings } from '../types/overtime'

/**
 * Overtime settings service
 * Manages configurable overtime system settings including limits, auto-approve, and deadlines
 */
export const overtimeSettingsService = {
  /**
   * Get all overtime settings
   * Retrieves all configurable settings from the database and returns them as a structured object
   * @returns Promise<OvertimeSettings> All overtime settings with current values
   * @throws Error if database query fails
   */
  async getOvertimeSettings(): Promise<OvertimeSettings> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.OVERTIME_SETTINGS)
      .select('setting_key, setting_value')
    
    if (error) {
      throw new Error(`Failed to fetch overtime settings: ${error.message}`)
    }

    // Transform database rows into structured settings object
    const settings: Partial<OvertimeSettings> = {}
    
    data.forEach(row => {
      const key = row.setting_key as keyof OvertimeSettings
      settings[key] = row.setting_value as any
    })

    // Validate that all required settings are present
    const requiredKeys: (keyof OvertimeSettings)[] = [
      'auto_approve',
      'max_daily_hours',
      'max_weekly_hours',
      'require_shift_verification',
      'approval_deadline_days',
      'pay_multipliers'
    ]

    for (const key of requiredKeys) {
      if (!settings[key]) {
        throw new Error(`Missing required setting: ${key}`)
      }
    }

    return settings as OvertimeSettings
  },

  /**
   * Update a specific overtime setting
   * Updates a single setting in the database with validation
   * @param key - The setting key to update
   * @param value - The new value for the setting
   * @throws Error if validation fails or database update fails
   */
  async updateOvertimeSetting(key: keyof OvertimeSettings, value: any): Promise<void> {
    // Validate the setting value based on the key
    this.validateSettingValue(key, value)

    // Get current user ID for audit trail
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to update settings')
    }

    // Update the setting in the database
    const { error } = await supabase
      .from(API_ENDPOINTS.OVERTIME_SETTINGS)
      .update({
        setting_value: value,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', key)
    
    if (error) {
      throw new Error(`Failed to update setting ${key}: ${error.message}`)
    }
  },

  /**
   * Validate setting value based on requirements
   * @param key - The setting key being validated
   * @param value - The value to validate
   * @throws Error if validation fails
   */
  validateSettingValue(key: keyof OvertimeSettings, value: any): void {
    switch (key) {
      case 'max_daily_hours':
        if (typeof value.regular !== 'number' || value.regular <= 0) {
          throw new Error('Daily regular hours limit must be a positive number')
        }
        if (typeof value.double !== 'number' || value.double <= 0) {
          throw new Error('Daily double hours limit must be a positive number')
        }
        break

      case 'max_weekly_hours':
        if (typeof value.regular !== 'number' || value.regular <= 0) {
          throw new Error('Weekly regular hours limit must be a positive number')
        }
        if (typeof value.double !== 'number' || value.double <= 0) {
          throw new Error('Weekly double hours limit must be a positive number')
        }
        break

      case 'pay_multipliers':
        if (typeof value.regular !== 'number' || value.regular <= 0) {
          throw new Error('Regular pay multiplier must be a positive number')
        }
        if (typeof value.double !== 'number' || value.double <= 0) {
          throw new Error('Double pay multiplier must be a positive number')
        }
        break

      case 'approval_deadline_days':
        if (typeof value.days !== 'number' || value.days <= 0) {
          throw new Error('Approval deadline days must be a positive number')
        }
        break

      case 'auto_approve':
        if (typeof value.enabled !== 'boolean') {
          throw new Error('Auto-approve enabled must be a boolean value')
        }
        break

      case 'require_shift_verification':
        if (typeof value.enabled !== 'boolean') {
          throw new Error('Require shift verification must be a boolean value')
        }
        break

      default:
        throw new Error(`Unknown setting key: ${key}`)
    }
  }
}
