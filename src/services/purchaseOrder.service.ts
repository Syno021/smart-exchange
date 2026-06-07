import api from '../lib/axios'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  POFilters,
  PurchaseOrder,
  PurchaseOrderFormData,
} from '../types/order.types'

export const purchaseOrderService = {
  getAll: (params?: POFilters) =>
    api.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`),

  create: (payload: PurchaseOrderFormData) =>
    api.post<ApiResponse<{ po_id: number; po_ref: string }>>('/purchase-orders', payload),

  update: (id: number, payload: Partial<PurchaseOrderFormData & { status?: string; supplier_notes?: string }>) =>
    api.put<ApiResponse<null>>(`/purchase-orders/${id}`, payload),
}
