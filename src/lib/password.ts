const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SPECIAL = '!@#$%&*'

export function generateStrongPassword(length = 14): string {
  const all = UPPER + LOWER + DIGITS + SPECIAL
  const required = [
    UPPER[Math.floor(Math.random() * UPPER.length)],
    LOWER[Math.floor(Math.random() * LOWER.length)],
    DIGITS[Math.floor(Math.random() * DIGITS.length)],
    SPECIAL[Math.floor(Math.random() * SPECIAL.length)],
  ]

  for (let i = required.length; i < length; i++) {
    required.push(all[Math.floor(Math.random() * all.length)])
  }

  return required.sort(() => Math.random() - 0.5).join('')
}

export function validateStrongPassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must include a number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character'
  return null
}

export function getPasswordStrength(password: string): {
  score: number
  label: 'Weak' | 'Fair' | 'Good' | 'Strong'
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'Weak' }
  if (score <= 4) return { score, label: 'Fair' }
  if (score <= 5) return { score, label: 'Good' }
  return { score, label: 'Strong' }
}
