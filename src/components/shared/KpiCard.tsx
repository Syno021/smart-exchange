import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  colorScheme?: 'green' | 'red' | 'amber' | 'blue' | 'gray'
  index?: number
  className?: string
}

const colorSchemes = {
  green: {
    icon: 'bg-brand-100 text-brand-600',
    trend: { up: 'text-brand-600', down: 'text-danger-600', neutral: 'text-gray-500' },
  },
  red: {
    icon: 'bg-danger-100 text-danger-600',
    trend: { up: 'text-brand-600', down: 'text-danger-600', neutral: 'text-gray-500' },
  },
  amber: {
    icon: 'bg-warning-100 text-warning-500',
    trend: { up: 'text-brand-600', down: 'text-danger-600', neutral: 'text-gray-500' },
  },
  blue: {
    icon: 'bg-blue-100 text-blue-700',
    trend: { up: 'text-brand-600', down: 'text-danger-600', neutral: 'text-gray-500' },
  },
  gray: {
    icon: 'bg-gray-100 text-gray-600',
    trend: { up: 'text-brand-600', down: 'text-danger-600', neutral: 'text-gray-500' },
  },
}

const TrendIcon = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  colorScheme = 'green',
  index = 0,
  className,
}: KpiCardProps) {
  const scheme = colorSchemes[colorScheme]
  const Trend = trend ? TrendIcon[trend] : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: 'easeOut' }}
      className={cn(
        'rounded-lg border border-gray-100 bg-white p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && trendValue && Trend && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                scheme.trend[trend]
              )}
            >
              <Trend className="h-3.5 w-3.5" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            scheme.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
