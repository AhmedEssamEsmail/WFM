// Shifts service

import { supabase } from '../lib/supabase';
import type { Shift } from '../types';
import { API_ENDPOINTS } from '../constants';

export const shiftsService = {
  /**
   * Get all shifts for a date range
   */
  async getShifts(startDate?: string, endDate?: string): Promise<Shift[]> {
    let query = supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('*, users(name, email)')
      .order('date', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Shift[];
  },

  /**
   * Get shifts for a specific user
   */
  async getUserShifts(userId: string, startDate?: string, endDate?: string): Promise<Shift[]> {
    let query = supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Shift[];
  },

  /**
   * Get shift by ID
   */
  async getShiftById(shiftId: string): Promise<Shift> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .select('*')
      .eq('id', shiftId)
      .single();

    if (error) throw error;
    return data as Shift;
  },

  /**
   * Create a new shift
   */
  async createShift(shift: Omit<Shift, 'id' | 'created_at'>): Promise<Shift> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .insert(shift)
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  },

  /**
   * Update a shift
   */
  async updateShift(shiftId: string, updates: Partial<Shift>): Promise<Shift> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .update(updates)
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  },

  /**
   * Delete a shift
   */
  async deleteShift(shiftId: string): Promise<void> {
    const { error } = await supabase.from(API_ENDPOINTS.SHIFTS).delete().eq('id', shiftId);

    if (error) throw error;
  },

  /**
   * Bulk create shifts
   */
  async bulkCreateShifts(shifts: Omit<Shift, 'id' | 'created_at'>[]): Promise<Shift[]> {
    const { data, error } = await supabase.from(API_ENDPOINTS.SHIFTS).insert(shifts).select();

    if (error) throw error;
    return data as Shift[];
  },

  /**
   * Bulk upsert shifts (insert or update)
   */
  async bulkUpsertShifts(shifts: Omit<Shift, 'id' | 'created_at'>[]): Promise<Shift[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.SHIFTS)
      .upsert(shifts, { onConflict: 'user_id,date' })
      .select();

    if (error) throw error;
    return data as Shift[];
  },
};
