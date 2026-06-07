import api from '../lib/axios'
import type { ApiResponse, PaginatedResponse, StockMovement } from '../types/api.types'

export interface StockAdjustPayload {
  product_id: number
  qty_change: number
  note?: string
}

export interface StockReceivePayload {
  po_id: number
  items: Array<{
    po_item_id?: number
    product_id: number
    qty_received: number
  }>
}

export const stockService = {
  adjust: (payload: StockAdjustPayload) =>
    api.post<ApiResponse<{ movement_id: number }>>('/stock/adjust', payload),

  receive: (payload: StockReceivePayload) =>
    api.post<ApiResponse<null>>('/stock/receive', payload),

  getMovements: (params?: {
    page?: number
    per_page?: number
    product_id?: number
    movement_type?: string
  }) => api.get<PaginatedResponse<StockMovement>>('/stock/movements', { params }),
}
