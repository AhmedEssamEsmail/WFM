// Break Schedule Rules Service

import { supabase } from '../lib/supabase'
import type { BreakScheduleRule } from '../types'

const BREAK_RULES_TABLE = 'break_schedule_rules'

export const breakRulesService = {
  /**
   * Get all break schedule rules
   */
  async getRules(): Promise<BreakScheduleRule[]> {
    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .select('*')
      .order('priority', { ascending: true })

    if (error) throw error
    return data as BreakScheduleRule[]
  },

  /**
   * Get only active break schedule rules
   */
  async getActiveRules(): Promise<BreakScheduleRule[]> {
    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) throw error
    return data as BreakScheduleRule[]
  },

  /**
   * Get a single rule by ID
   */
  async getRuleById(ruleId: string): Promise<BreakScheduleRule> {
    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .select('*')
      .eq('id', ruleId)
      .single()

    if (error) throw error
    return data as BreakScheduleRule
  },

  /**
   * Get a rule by name
   */
  async getRuleByName(ruleName: string): Promise<BreakScheduleRule | null> {
    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .select('*')
      .eq('rule_name', ruleName)
      .maybeSingle()

    if (error) throw error
    return data as BreakScheduleRule | null
  },

  /**
   * Update a break schedule rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<BreakScheduleRule>
  ): Promise<BreakScheduleRule> {
    // Validate parameters if provided
    if (updates.parameters) {
      const validationError = this.validateRuleParameters(updates.parameters, updates.rule_type)
      if (validationError) {
        throw new Error(validationError)
      }
    }

    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single()

    if (error) throw error
    return data as BreakScheduleRule
  },

  /**
   * Toggle a rule's active status
   */
  async toggleRule(ruleId: string, isActive: boolean): Promise<BreakScheduleRule> {
    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .update({ is_active: isActive })
      .eq('id', ruleId)
      .select()
      .single()

    if (error) throw error
    return data as BreakScheduleRule
  },

  /**
   * Validate rule parameters based on rule type
   */
  validateRuleParameters(
    parameters: Record<string, any>,
    ruleType?: string
  ): string | null {
    if (!ruleType) return null

    switch (ruleType) {
      case 'timing': {
        // Validate timing rule parameters
        if (parameters.min_minutes !== undefined) {
          if (typeof parameters.min_minutes !== 'number' || parameters.min_minutes < 0) {
            return 'min_minutes must be a positive number'
          }
        }

        if (parameters.max_minutes !== undefined) {
          if (typeof parameters.max_minutes !== 'number' || parameters.max_minutes < 0) {
            return 'max_minutes must be a positive number'
          }
        }

        if (
          parameters.min_minutes !== undefined &&
          parameters.max_minutes !== undefined &&
          parameters.min_minutes > parameters.max_minutes
        ) {
          return 'min_minutes cannot be greater than max_minutes'
        }

        break
      }

      case 'coverage': {
        // Validate coverage rule parameters
        if (parameters.min_agents !== undefined) {
          if (
            typeof parameters.min_agents !== 'number' ||
            parameters.min_agents < 0 ||
            !Number.isInteger(parameters.min_agents)
          ) {
            return 'min_agents must be a positive integer'
          }
        }

        if (parameters.alert_threshold !== undefined) {
          if (
            typeof parameters.alert_threshold !== 'number' ||
            parameters.alert_threshold < 0 ||
            !Number.isInteger(parameters.alert_threshold)
          ) {
            return 'alert_threshold must be a positive integer'
          }
        }

        break
      }

      case 'ordering': {
        // Validate ordering rule parameters
        if (parameters.sequence !== undefined) {
          if (!Array.isArray(parameters.sequence)) {
            return 'sequence must be an array'
          }

          const validBreakTypes = ['HB1', 'B', 'HB2']
          for (const breakType of parameters.sequence) {
            if (!validBreakTypes.includes(breakType)) {
              return `Invalid break type in sequence: ${breakType}`
            }
          }
        }

        break
      }

      case 'distribution': {
        // Validate distribution rule parameters
        if (parameters.tolerance_percentage !== undefined) {
          if (
            typeof parameters.tolerance_percentage !== 'number' ||
            parameters.tolerance_percentage < 0 ||
            parameters.tolerance_percentage > 100
          ) {
            return 'tolerance_percentage must be between 0 and 100'
          }
        }

        break
      }
    }

    return null
  },

  /**
   * Create a new rule (WFM only)
   */
  async createRule(
    rule: Omit<BreakScheduleRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BreakScheduleRule> {
    // Validate parameters
    const validationError = this.validateRuleParameters(rule.parameters, rule.rule_type)
    if (validationError) {
      throw new Error(validationError)
    }

    const { data, error } = await supabase
      .from(BREAK_RULES_TABLE)
      .insert(rule)
      .select()
      .single()

    if (error) throw error
    return data as BreakScheduleRule
  },

  /**
   * Delete a rule (WFM only)
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase.from(BREAK_RULES_TABLE).delete().eq('id', ruleId)

    if (error) throw error
  },
}
