import { ShoppingBag } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface AppLogoProps {
  className?: string
  showText?: boolean
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 'h-4 w-4', text: 'text-base' },
  md: { box: 'h-9 w-9', icon: 'h-5 w-5', text: 'text-lg' },
  lg: { box: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-xl' },
}

export function AppLogo({
  className,
  showText = true,
  variant = 'dark',
  size = 'md',
}: AppLogoProps) {
  const sizes = sizeMap[size]
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white',
          sizes.box
        )}
      >
        <ShoppingBag className={sizes.icon} />
      </div>
      {showText && (
        <span className={cn('font-display font-bold tracking-tight', sizes.text, textColor)}>
          {APP_NAME}
        </span>
      )}
    </div>
  )
}
