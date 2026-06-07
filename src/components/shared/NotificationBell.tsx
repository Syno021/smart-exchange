import * as Popover from '@radix-ui/react-popover'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/types/api.types'
import { Button } from '@/components/ui/Button'
import { cn, formatDate } from '@/lib/utils'

export interface NotificationBellProps {
  className?: string
  iconClass?: string
  accentClass?: string
}

export function NotificationBell({
  className,
  iconClass = 'text-gray-600',
  accentClass = 'text-brand-600',
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllRead,
    isMarkingRead,
  } = useNotifications()

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative rounded-lg p-2 transition-colors hover:bg-gray-100 hover:text-gray-900',
            iconClass,
            className
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-lg border border-gray-100 bg-white shadow-modal outline-none"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-display text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead()}
                disabled={isMarkingRead}
              >
                <CheckCheck className={cn('h-4 w-4', accentClass)} />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notif: Notification) => (
                  <li
                    key={notif.notif_id}
                    className={cn(
                      'px-4 py-3 transition-colors hover:bg-gray-50',
                      !notif.is_read && 'bg-brand-50/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {formatDate(notif.created_at, 'dd MMM yyyy HH:mm')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
