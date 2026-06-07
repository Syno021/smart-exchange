import api from '../lib/axios'
import type { AuditLogEntry, ApiResponse, PaginatedResponse } from '../types/api.types'

export const auditService = {
  getAll: (params?: {
    page?: number
    per_page?: number
    action?: string
    module?: string
    user_id?: number
    date_from?: string
    date_to?: string
  }) => api.get<PaginatedResponse<AuditLogEntry>>('/audit-log', { params }),

  getFilterOptions: () =>
    api.get<ApiResponse<{ actions: string[]; modules: string[] }>>('/audit-log/filters'),
}
