// Users service - centralized user management

import { supabase } from '../lib/supabase';
import type { User } from '../types';

export const usersService = {
  /**
   * Get all users with optional ordering
   */
  async getUsers(orderBy: 'name' | 'email' = 'name'): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order(orderBy, { ascending: true });

    if (error) throw error;
    return data as User[];
  },

  /**
   * Get users filtered by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('name', { ascending: true });

    if (error) throw error;
    return data as User[];
  },

  /**
   * Get users by email list (for CSV imports)
   */
  async getUsersByEmails(emails: string[]): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .in('email', emails);

    if (error) throw error;
    return data as User[];
  },

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as User;
  },
};
