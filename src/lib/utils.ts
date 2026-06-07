import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

/** Safely coerce API decimals (often strings) and unknown values to a finite number. */
export const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const formatRand = (amount: unknown): string => {
  const value = toNumber(amount)
  return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const formatDate = (date: string, fmt = 'dd MMM yyyy HH:mm'): string =>
  format(new Date(date), fmt)

export const generateSaleRef = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `USM-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-PENDING`
}

export const truncate = (str: string, maxLength: number): string =>
  str.length <= maxLength ? str : `${str.slice(0, maxLength)}…`

export const calcMargin = (cost: unknown, selling: unknown): number => {
  const costNum = toNumber(cost)
  const sellingNum = toNumber(selling)
  if (sellingNum <= 0) return 0
  return Math.round(((sellingNum - costNum) / sellingNum) * 10000) / 100
}
