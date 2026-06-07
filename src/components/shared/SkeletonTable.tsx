import { cn } from '@/lib/utils'

export interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function SkeletonTable({
  rows = 5,
  columns = 5,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('animate-pulse overflow-hidden rounded-lg border border-gray-100 bg-white', className)}>
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded bg-gray-200" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={cn(
                  'h-4 flex-1 rounded bg-gray-100',
                  colIdx === 0 && 'max-w-[120px]'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
