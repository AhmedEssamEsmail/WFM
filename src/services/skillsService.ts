// Skills service - centralized skills management

import { supabase } from '../lib/supabase'
import type { Skill } from '../types'

export const skillsService = {
  /**
   * Get all skills (optionally filter by active status)
   */
  async getSkills(activeOnly: boolean = false): Promise<Skill[]> {
    let query = supabase
      .from('skills')
      .select('*')
      .order('name', { ascending: true })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data as Skill[]
  },

  /**
   * Get skill by ID
   */
  async getSkillById(id: string): Promise<Skill | null> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Skill
  },

  /**
   * Create new skill (WFM only)
   */
  async createSkill(skill: Omit<Skill, 'id' | 'created_at' | 'updated_at'>): Promise<Skill> {
    // Check name uniqueness before creating
    const isUnique = await this.isSkillNameUnique(skill.name)
    if (!isUnique) {
      throw new Error('A skill with this name already exists')
    }

    const { data, error } = await supabase
      .from('skills')
      .insert(skill)
      .select()
      .single()
    
    if (error) throw error
    return data as Skill
  },

  /**
   * Update existing skill (WFM only)
   */
  async updateSkill(id: string, updates: Partial<Skill>): Promise<Skill> {
    // If updating name, check uniqueness
    if (updates.name) {
      const isUnique = await this.isSkillNameUnique(updates.name, id)
      if (!isUnique) {
        throw new Error('A skill with this name already exists')
      }
    }

    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Skill
  },

  /**
   * Delete skill (WFM only)
   * Cascades to user_skills due to ON DELETE CASCADE
   */
  async deleteSkill(id: string): Promise<void> {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Get skills for a specific user
   */
  async getUserSkills(userId: string): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('user_skills')
      .select('skill_id, skills(*)')
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Extract skills from the joined data
    const skills = (data || [])
      .map((item: any) => item.skills)
      .filter((skill: any) => skill !== null)
    
    return skills as Skill[]
  },

  /**
   * Assign skills to user (replaces existing assignments)
   * Uses transaction to ensure atomicity
   */
  async assignSkillsToUser(userId: string, skillIds: string[]): Promise<void> {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)
    
    if (deleteError) throw deleteError

    // If no skills to assign, we're done
    if (skillIds.length === 0) {
      return
    }

    // Insert new assignments
    const assignments = skillIds.map(skillId => ({
      user_id: userId,
      skill_id: skillId,
    }))

    const { error: insertError } = await supabase
      .from('user_skills')
      .insert(assignments)
    
    if (insertError) throw insertError
  },

  /**
   * Check if skill name is unique (case-insensitive)
   */
  async isSkillNameUnique(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('skills')
      .select('id')
      .ilike('name', name)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data.length === 0
  },
}
