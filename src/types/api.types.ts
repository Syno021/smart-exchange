export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface Notification {
  notif_id: number
  user_id: number
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface AuditLogEntry {
  log_id: number
  user_id?: number
  user_name?: string
  action: string
  module?: string
  target_table?: string
  target_id?: number
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface BackupEntry {
  backup_id: number
  created_by: number
  creator_name?: string
  filename: string
  size_bytes?: number
  status: 'success' | 'failed'
  created_at: string
}

export interface Category {
  category_id: number
  name: string
  slug: string
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface StockMovement {
  movement_id: number
  product_id: number
  product_name?: string
  user_id: number
  user_name?: string
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'opening'
  reference_id?: number
  qty_before: number
  qty_change: number
  qty_after: number
  note?: string
  created_at: string
}
