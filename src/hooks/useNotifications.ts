import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notification.service'

const NOTIFICATIONS_KEY = ['notifications'] as const

export function useNotifications() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const { data } = await notificationService.getAll()
      return data.data
    },
    refetchInterval: 1000 * 60,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markAllRead: markAllReadMutation.mutate,
    isMarkingRead: markAllReadMutation.isPending,
  }
}
