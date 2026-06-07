import api from '../lib/axios'
import type { ApiResponse, BackupEntry, PaginatedResponse } from '../types/api.types'

export const backupService = {
  create: () =>
    api.post<
      ApiResponse<{
        backup_id: number
        filename: string
        size_bytes?: number
        status?: string
        message?: string
      }>
    >('/backup/create'),

  getHistory: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<BackupEntry>>('/backup/history', { params }),

  download: async (id: number, filename: string) => {
    const response = await api.get(`/backup/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  delete: (id: number) => api.delete<ApiResponse<null>>(`/backup/${id}`),
}
