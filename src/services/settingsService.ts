// Settings service

import { supabase } from '../lib/supabase';
import { API_ENDPOINTS } from '../constants';

export const settingsService = {
  /**
   * Get a setting value
   */
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data.value;
  },

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from(API_ENDPOINTS.SETTINGS).select('key, value');

    if (error) throw error;

    const settings: Record<string, string> = {};
    data.forEach((setting) => {
      settings[setting.key] = setting.value;
    });
    return settings;
  },

  /**
   * Update a setting
   */
  async updateSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
  },

  /**
   * Update multiple settings
   */
  async updateSettings(settings: Record<string, string>): Promise<void> {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(API_ENDPOINTS.SETTINGS)
      .upsert(updates, { onConflict: 'key' });

    if (error) throw error;
  },

  /**
   * Get WFM auto-approve setting
   */
  async getAutoApproveSetting(): Promise<boolean> {
    const value = await this.getSetting('wfm_auto_approve');
    return value === 'true';
  },

  /**
   * Get allow leave exceptions setting
   */
  async getAllowLeaveExceptionsSetting(): Promise<boolean> {
    const value = await this.getSetting('allow_leave_exceptions');
    return value === 'true';
  },
};
