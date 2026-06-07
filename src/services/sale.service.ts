import api from '../lib/axios'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  CreateOnlineOrderPayload,
  CreateSalePayload,
  Sale,
  SaleFilters,
} from '../types/sale.types'

export const saleService = {
  getAll: (params?: SaleFilters) =>
    api.get<PaginatedResponse<Sale>>('/sales', { params }),

  getById: (id: number) => api.get<ApiResponse<Sale>>(`/sales/${id}`),

  create: (payload: CreateSalePayload) =>
    api.post<
      ApiResponse<{
        sale_id: number
        sale_ref: string
        total_amt: number
        change_given: number
      }>
    >('/sales', payload),

  createOnlineOrder: (payload: CreateOnlineOrderPayload) =>
    api.post<
      ApiResponse<{
        sale_id: number
        sale_ref: string
        total_amt: number
        status: string
      }>
    >('/sales/online-order', payload),

  dispatchDelivery: (id: number) =>
    api.put<ApiResponse<null>>(`/sales/${id}/dispatch`),

  markDelivered: (id: number) =>
    api.put<ApiResponse<null>>(`/sales/${id}/deliver`),

  void: (id: number) => api.put<ApiResponse<null>>(`/sales/${id}/void`),
}
