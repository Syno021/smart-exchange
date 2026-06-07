import { cn } from '@/lib/utils'

export interface SkeletonKpiProps {
  className?: string
}

export function SkeletonKpi({ className }: SkeletonKpiProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg border border-gray-100 bg-white p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-100" />
        </div>
        <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />
      </div>
    </div>
  )
}

export interface SkeletonKpiGridProps {
  count?: number
  className?: string
}

export function SkeletonKpiGrid({ count = 4, className }: SkeletonKpiGridProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKpi key={i} />
      ))}
    </div>
  )
}
