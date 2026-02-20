/**
 * Common validation schemas
 * Reusable Zod schemas for common data types
 */

import { z } from 'zod';

// ============================================
// UUID Schema
// ============================================

export const uuidSchema = z.string().uuid('Must be a valid UUID');

// ============================================
// Date Schemas
// ============================================

/**
 * ISO 8601 date format (YYYY-MM-DD)
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in ISO 8601 format (YYYY-MM-DD)')
  .refine((date) => !isNaN(new Date(date).getTime()), 'Must be a valid date');

/**
 * Time format (HH:MM:SS)
 */
export const timeSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Must be in HH:MM:SS format');

/**
 * Time format (HH:MM)
 */
export const shortTimeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format');

/**
 * Date range schema - validates that start <= end
 */
export const dateRangeSchema = z
  .object({
    start_date: isoDateSchema,
    end_date: isoDateSchema,
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  });

/**
 * Future date schema - validates date is not in the past
 */
export const futureDateSchema = (allowToday = true) =>
  isoDateSchema.refine(
    (date) => {
      const dateObj = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return allowToday ? dateObj >= today : dateObj > today;
    },
    {
      message: allowToday ? 'Must be today or in the future' : 'Must be in the future',
    }
  );

// ============================================
// Email Schema
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Must be a valid email address');

/**
 * Email with domain restriction
 */
function normalizeDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return '';
  return normalized.startsWith('@') ? normalized : `@${normalized}`;
}

export const domainEmailSchema = (domain: string) => {
  const normalizedDomain = normalizeDomain(domain);
  return emailSchema.refine(
    (email) => {
      if (!normalizedDomain) return false;
      return email.trim().toLowerCase().endsWith(normalizedDomain);
    },
    {
      message: normalizedDomain
        ? `Email must be from ${normalizedDomain} domain`
        : 'Email domain is not configured',
    }
  );
};

// ============================================
// Number Schemas
// ============================================

export const positiveNumberSchema = z.number().positive('Must be a positive number');

export const nonNegativeNumberSchema = z.number().nonnegative('Must be a non-negative number');

export const positiveIntegerSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be a positive number');

export const nonNegativeIntegerSchema = z
  .number()
  .int('Must be an integer')
  .nonnegative('Must be a non-negative number');

// ============================================
// String Schemas
// ============================================

export const nonEmptyStringSchema = z
  .string()
  .min(1, 'Must not be empty')
  .refine((s) => s.trim().length > 0, 'Must not be empty');

// ============================================
// Type Exports
// ============================================

export type UUID = z.infer<typeof uuidSchema>;
export type ISODate = z.infer<typeof isoDateSchema>;
export type Time = z.infer<typeof timeSchema>;
export type ShortTime = z.infer<typeof shortTimeSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Email = z.infer<typeof emailSchema>;
