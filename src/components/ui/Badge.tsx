import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-700',
        secondary: 'bg-gray-100 text-gray-600',
        success: 'bg-brand-100 text-brand-800',
        warning: 'bg-warning-100 text-warning-500',
        danger: 'bg-danger-100 text-danger-600',
        outline: 'border border-gray-200 bg-white text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { badgeVariants }
