import api from '../lib/axios'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type { Supplier, SupplierFormData } from '../types/supplier.types'

export const supplierService = {
  getMe: () => api.get<ApiResponse<Supplier>>('/suppliers/me'),

  getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<PaginatedResponse<Supplier>>('/suppliers', { params }),

  create: (payload: SupplierFormData) =>
    api.post<ApiResponse<{ supplier_id: number }>>('/suppliers', payload),

  update: (id: number, payload: Partial<SupplierFormData>) =>
    api.put<ApiResponse<null>>(`/suppliers/${id}`, payload),

  delete: (id: number) => api.delete<ApiResponse<null>>(`/suppliers/${id}`),
}
