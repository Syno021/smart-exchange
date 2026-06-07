import api from '../lib/axios'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type { User, UserFormData } from '../types/user.types'

export const userService = {
  getAll: (params?: {
    page?: number
    per_page?: number
    search?: string
    role?: string
    is_active?: number
    sort_by?: string
    sort_dir?: 'ASC' | 'DESC'
  }) => api.get<PaginatedResponse<User>>('/users', { params }),

  create: (payload: UserFormData) =>
    api.post<ApiResponse<{ user_id: number }>>('/users', payload),

  update: (id: number, payload: Partial<UserFormData>) =>
    api.put<ApiResponse<null>>(`/users/${id}`, payload),

  delete: (id: number) => api.delete<ApiResponse<null>>(`/users/${id}`),
}
