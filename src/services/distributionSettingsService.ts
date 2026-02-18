// Distribution Settings Service
// Manages configurable parameters for the ladder-based break distribution algorithm

import { supabase } from '../lib/supabase'
import type { DistributionSettings, DistributionSettingsUpdate, ShiftType } from '../types'

const DISTRIBUTION_SETTINGS_TABLE = 'distribution_settings'

/**
 * Convert Supabase error to proper Error instance
 */
function toError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; code?: string }
    return new Error(err.message || 'Unknown error')
  }
  return new Error(String(error))
}

/**
 * Get default distribution settings for all shift types
 */
function getDefaultSettings(): DistributionSettingsUpdate[] {
  return [
    {
      shift_type: 'AM',
      hb1_start_column: 4,   // 9:45 AM
      b_offset_minutes: 150,  // 2.5 hours
      hb2_offset_minutes: 150, // 2.5 hours
      ladder_increment: 1 // 15 minutes between agents
    },
    {
      shift_type: 'PM',
      hb1_start_column: 16,  // 1:00 PM
      b_offset_minutes: 150,
      hb2_offset_minutes: 150,
      ladder_increment: 1
    },
    {
      shift_type: 'BET',
      hb1_start_column: 8,   // 10:45 AM
      b_offset_minutes: 150,
      hb2_offset_minutes: 150,
      ladder_increment: 1
    }
  ]
}

/**
 * Validate distribution settings
 */
function validateSettings(settings: DistributionSettingsUpdate): string | null {
  // Validate hb1_start_column (0-47 for 48 intervals from 9:00 AM to 9:00 PM)
  if (settings.hb1_start_column < 0 || settings.hb1_start_column >= 48) {
    return 'Start column must be between 0 and 47'
  }

  // Validate b_offset_minutes (minimum 90 minutes per break rules)
  if (settings.b_offset_minutes < 90) {
    return 'B offset must be at least 90 minutes (minimum gap rule)'
  }

  // Validate hb2_offset_minutes (minimum 90 minutes per break rules)
  if (settings.hb2_offset_minutes < 90) {
    return 'HB2 offset must be at least 90 minutes (minimum gap rule)'
  }

  // Validate shift_type
  const validShiftTypes: ShiftType[] = ['AM', 'PM', 'BET']
  if (!validShiftTypes.includes(settings.shift_type)) {
    return `Invalid shift type: ${settings.shift_type}`
  }

  return null
}

export const distributionSettingsService = {
  /**
   * Get all distribution settings as a Map keyed by shift type
   */
  async getSettings(): Promise<Map<ShiftType, DistributionSettings>> {
    const { data, error } = await supabase
      .from(DISTRIBUTION_SETTINGS_TABLE)
      .select('*')
      .order('shift_type', { ascending: true })

    if (error) throw toError(error)

    // If no settings exist, return defaults
    if (!data || data.length === 0) {
      const defaults = getDefaultSettings()
      const defaultMap = new Map<ShiftType, DistributionSettings>()
      
      for (const setting of defaults) {
        defaultMap.set(setting.shift_type, {
          id: '',
          ...setting,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      return defaultMap
    }

    // Convert array to Map
    const settingsMap = new Map<ShiftType, DistributionSettings>()
    for (const setting of data as DistributionSettings[]) {
      settingsMap.set(setting.shift_type, setting)
    }

    // Fill in missing shift types with defaults
    const defaults = getDefaultSettings()
    for (const defaultSetting of defaults) {
      if (!settingsMap.has(defaultSetting.shift_type)) {
        settingsMap.set(defaultSetting.shift_type, {
          id: '',
          ...defaultSetting,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }

    return settingsMap
  },

  /**
   * Get settings for a specific shift type
   */
  async getSettingsByShiftType(shiftType: ShiftType): Promise<DistributionSettings> {
    const { data, error } = await supabase
      .from(DISTRIBUTION_SETTINGS_TABLE)
      .select('*')
      .eq('shift_type', shiftType)
      .maybeSingle()

    if (error) throw toError(error)

    // If no setting exists, return default
    if (!data) {
      const defaults = getDefaultSettings()
      const defaultSetting = defaults.find(s => s.shift_type === shiftType)
      
      if (!defaultSetting) {
        throw new Error(`No default settings found for shift type: ${shiftType}`)
      }

      return {
        id: '',
        ...defaultSetting,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    return data as DistributionSettings
  },

  /**
   * Update distribution settings (WFM only)
   * Accepts an array of settings updates for multiple shift types
   */
  async updateSettings(updates: DistributionSettingsUpdate[]): Promise<DistributionSettings[]> {
    // Validate all settings first
    for (const update of updates) {
      const validationError = validateSettings(update)
      if (validationError) {
        throw new Error(`Validation failed for ${update.shift_type}: ${validationError}`)
      }
    }

    const results: DistributionSettings[] = []

    // Update each setting using upsert
    for (const update of updates) {
      const { data, error } = await supabase
        .from(DISTRIBUTION_SETTINGS_TABLE)
        .upsert(
          {
            shift_type: update.shift_type,
            hb1_start_column: update.hb1_start_column,
            b_offset_minutes: update.b_offset_minutes,
            hb2_offset_minutes: update.hb2_offset_minutes,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'shift_type'
          }
        )
        .select()
        .single()

      if (error) throw toError(error)
      results.push(data as DistributionSettings)
    }

    return results
  },

  /**
   * Reset all settings to defaults (WFM only)
   */
  async resetToDefaults(): Promise<DistributionSettings[]> {
    const defaults = getDefaultSettings()
    return await this.updateSettings(defaults)
  },

  /**
   * Get default settings (for UI display)
   */
  getDefaultSettings(): DistributionSettingsUpdate[] {
    return getDefaultSettings()
  },

  /**
   * Validate settings without saving
   */
  validateSettings(settings: DistributionSettingsUpdate): string | null {
    return validateSettings(settings)
  }
}
