import { cn, formatRand, toNumber } from '@/lib/utils'

export interface RandAmountProps {
  amount: number | string | null | undefined
  className?: string
  showSign?: boolean
}

export function RandAmount({ amount, className, showSign = false }: RandAmountProps) {
  const value = toNumber(amount)
  const formatted = formatRand(Math.abs(value))
  const sign = value < 0 ? '−' : showSign && value > 0 ? '+' : ''

  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {sign}
      {sign ? ' ' : ''}
      {formatted}
    </span>
  )
}
