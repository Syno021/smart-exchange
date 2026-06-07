import api from '../lib/axios'
import type { ApiResponse, Notification } from '../types/api.types'

export const notificationService = {
  getAll: (params?: { page?: number; per_page?: number; unread_only?: boolean }) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params }),

  markAllRead: () => api.put<ApiResponse<null>>('/notifications/read-all'),
}
