import api from '../lib/axios'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type { Customer } from '../types/customer.types'
import type { Sale } from '../types/sale.types'

export const customerService = {
  getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),

  update: (customerId: number, payload: { address?: string }) =>
    api.put<ApiResponse<null>>(`/customers/${customerId}`, payload),

  getOrders: (customerId: number, params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Sale>>(`/customers/${customerId}/orders`, { params }),
}
