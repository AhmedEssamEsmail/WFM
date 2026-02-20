/**
 * Swap request validation schemas
 * Zod schemas for swap request data validation
 */

import { z } from 'zod';
import { uuidSchema, isoDateSchema } from './common';

// ============================================
// Shift Type Schema
// ============================================

/**
 * Shift type schema - accepts any non-empty string
 * Database is the source of truth for valid shift types
 */
export const shiftTypeSchema = z
  .string()
  .min(1, 'Shift type is required')
  .max(10, 'Shift type must be less than 10 characters');

// ============================================
// Swap Request Schemas
// ============================================

/**
 * Swap request creation schema
 */
export const swapRequestCreateSchema = z.object({
  target_user_id: uuidSchema,
  requester_shift_id: uuidSchema,
  target_shift_id: uuidSchema,
});

/**
 * Swap request validation data schema
 * Used for internal validation logic
 */
export const swapRequestValidationSchema = z
  .object({
    requesterId: uuidSchema,
    targetUserId: uuidSchema,
    requesterShiftId: uuidSchema,
    targetShiftId: uuidSchema,
  })
  .refine((data) => data.requesterId !== data.targetUserId, {
    message: 'Cannot swap shifts with yourself',
    path: ['targetUserId'],
  })
  .refine((data) => data.requesterShiftId !== data.targetShiftId, {
    message: 'Cannot swap the same shift',
    path: ['targetShiftId'],
  });

/**
 * CSV shift schema
 */
export const csvShiftSchema = z.object({
  user_email: z.string().email(),
  date: isoDateSchema,
  shift_type: shiftTypeSchema,
});

// ============================================
// Type Exports
// ============================================

export type SwapRequestCreateInput = z.infer<typeof swapRequestCreateSchema>;
export type SwapRequestValidationData = z.infer<typeof swapRequestValidationSchema>;
export type CSVShiftInput = z.infer<typeof csvShiftSchema>;
