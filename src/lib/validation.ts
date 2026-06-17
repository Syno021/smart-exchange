import { z } from 'zod'

/** South African local format: 10 digits starting with 0 */
export const PHONE_REGEX = /^0\d{9}$/

export function validatePhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Phone number is required'
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Phone must be exactly 10 digits and start with 0'
  }
  return null
}

export function validatePhoneOptional(value: string | undefined): string | null {
  if (!value?.trim()) return null
  return validatePhone(value)
}

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(PHONE_REGEX, 'Phone must be exactly 10 digits and start with 0')

export const phoneOptionalSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || PHONE_REGEX.test(val), {
    message: 'Phone must be exactly 10 digits and start with 0',
  })

export const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes')

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username is too long')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

export const emailOptionalSchema = z
  .string()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''))

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character')

/** ISO date string (YYYY-MM-DD) for today — use as max on filter date inputs */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
