/**
 * Settings and comment validation schemas
 * Zod schemas for application settings and comments
 */

import { z } from 'zod'
import { VALIDATION } from '../../constants'

// ============================================
// Settings Schema
// ============================================

export const settingsSchema = z.object({
  wfm_auto_approve: z.boolean(),
  allow_leave_exceptions: z.boolean(),
})

// ============================================
// Comment Schema
// ============================================

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(
      VALIDATION.COMMENT_MAX_LENGTH,
      `Comment must be less than ${VALIDATION.COMMENT_MAX_LENGTH} characters`
    ),
})

// ============================================
// Type Exports
// ============================================

export type SettingsInput = z.infer<typeof settingsSchema>
export type CommentInput = z.infer<typeof commentSchema>
