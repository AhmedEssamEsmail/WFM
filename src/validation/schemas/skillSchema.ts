/**
 * Skills validation schemas
 * Zod schemas for skills management
 */

import { z } from 'zod'

// ============================================
// Skill Schema
// ============================================

export const skillSchema = z.object({
  name: z
    .string()
    .min(1, 'Skill name is required')
    .max(100, 'Skill name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #FF5733)'),
  is_active: z.boolean().default(true),
})

// ============================================
// Assign Skills Schema
// ============================================

export const assignSkillsSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  skill_ids: z.array(z.string().uuid('Invalid skill ID')),
})

// ============================================
// Type Exports
// ============================================

export type SkillInput = z.infer<typeof skillSchema>
export type AssignSkillsInput = z.infer<typeof assignSkillsSchema>
