// Overtime Settings Service

import { supabase } from '../lib/supabase';
import { API_ENDPOINTS } from '../constants';
import type {
  OvertimeSettings,
  OvertimeSettingKey,
  OvertimeSettingRow,
  OvertimeSettingValue,
} from '../types/overtime';

const REQUIRED_OVERTIME_SETTING_KEYS: OvertimeSettingKey[] = [
  'auto_approve',
  'max_daily_hours',
  'max_weekly_hours',
  'require_shift_verification',
  'approval_deadline_days',
  'pay_multipliers',
];

type SettingCandidateValue =
  | string
  | number
  | boolean
  | null
  | SettingCandidateValue[]
  | { [key: string]: SettingCandidateValue };

type SettingCandidateRecord = { [key: string]: SettingCandidateValue };

function isRecord(value: unknown): value is SettingCandidateRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEnabledFlag(value: unknown): value is { enabled: boolean } {
  return isRecord(value) && typeof value.enabled === 'boolean';
}

function isHoursRule(value: unknown): value is { regular: number; double: number } {
  return (
    isRecord(value) &&
    typeof value.regular === 'number' &&
    value.regular > 0 &&
    typeof value.double === 'number' &&
    value.double > 0
  );
}

function isApprovalDeadlineRule(value: unknown): value is { days: number } {
  return isRecord(value) && typeof value.days === 'number' && value.days > 0;
}

function isOvertimeSettingKey(value: unknown): value is OvertimeSettingKey {
  return (
    typeof value === 'string' &&
    REQUIRED_OVERTIME_SETTING_KEYS.includes(value as OvertimeSettingKey)
  );
}

function isOvertimeSettingValue<K extends OvertimeSettingKey>(
  key: K,
  value: unknown
): value is OvertimeSettingValue<K> {
  switch (key) {
    case 'auto_approve':
    case 'require_shift_verification':
      return isEnabledFlag(value);
    case 'max_daily_hours':
    case 'max_weekly_hours':
    case 'pay_multipliers':
      return isHoursRule(value);
    case 'approval_deadline_days':
      return isApprovalDeadlineRule(value);
    default:
      return false;
  }
}

function hasAllRequiredSettings(settings: Partial<OvertimeSettings>): settings is OvertimeSettings {
  return REQUIRED_OVERTIME_SETTING_KEYS.every((key) => settings[key] !== undefined);
}

function assignSetting<K extends OvertimeSettingKey>(
  settings: Partial<OvertimeSettings>,
  key: K,
  value: OvertimeSettingValue<K>
): void {
  settings[key] = value;
}

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
      .select('setting_key, setting_value');

    if (error) {
      throw new Error(`Failed to fetch overtime settings: ${error.message}`);
    }

    // Transform database rows into structured settings object.
    const settings: Partial<OvertimeSettings> = {};

    for (const row of (data || []) as OvertimeSettingRow[]) {
      if (!isOvertimeSettingKey(row.setting_key)) {
        continue;
      }

      if (!isOvertimeSettingValue(row.setting_key, row.setting_value)) {
        throw new Error(`Invalid value for setting ${row.setting_key}`);
      }

      assignSetting(settings, row.setting_key, row.setting_value);
    }

    for (const key of REQUIRED_OVERTIME_SETTING_KEYS) {
      if (settings[key] === undefined) {
        throw new Error(`Missing required setting: ${key}`);
      }
    }

    if (!hasAllRequiredSettings(settings)) {
      throw new Error('Failed to load required overtime settings');
    }

    return settings;
  },

  /**
   * Update a specific overtime setting
   * Updates a single setting in the database with validation
   * @param key - The setting key to update
   * @param value - The new value for the setting
   * @throws Error if validation fails or database update fails
   */
  async updateOvertimeSetting<K extends OvertimeSettingKey>(
    key: K,
    value: OvertimeSettingValue<K>
  ): Promise<void> {
    // Validate the setting value based on the key
    this.validateSettingValue(key, value);

    // Get current user ID for audit trail
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to update settings');
    }

    // Update the setting in the database
    const { error } = await supabase
      .from(API_ENDPOINTS.OVERTIME_SETTINGS)
      .update({
        setting_value: value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', key);

    if (error) {
      throw new Error(`Failed to update setting ${key}: ${error.message}`);
    }
  },

  /**
   * Validate setting value based on requirements
   * @param key - The setting key being validated
   * @param value - The value to validate
   * @throws Error if validation fails
   */
  validateSettingValue<K extends OvertimeSettingKey>(key: K, value: OvertimeSettingValue<K>): void {
    switch (key) {
      case 'max_daily_hours':
        if (!isHoursRule(value)) {
          throw new Error('Daily regular hours limit must be a positive number');
        }
        break;

      case 'max_weekly_hours':
        if (!isHoursRule(value)) {
          throw new Error('Weekly regular hours limit must be a positive number');
        }
        break;

      case 'pay_multipliers':
        if (!isHoursRule(value)) {
          throw new Error('Regular pay multiplier must be a positive number');
        }
        break;

      case 'approval_deadline_days':
        if (!isApprovalDeadlineRule(value)) {
          throw new Error('Approval deadline days must be a positive number');
        }
        break;

      case 'auto_approve':
        if (!isEnabledFlag(value)) {
          throw new Error('Auto-approve enabled must be a boolean value');
        }
        break;

      case 'require_shift_verification':
        if (!isEnabledFlag(value)) {
          throw new Error('Require shift verification must be a boolean value');
        }
        break;

      default:
        throw new Error(`Unknown setting key: ${key}`);
    }
  },
};
