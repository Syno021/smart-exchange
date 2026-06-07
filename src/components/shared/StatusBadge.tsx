import { STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium capitalize',
        colorClass,
        className
      )}
    >
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}
