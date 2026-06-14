export interface Product {
  product_id: number
  category_id: number
  supplier_id?: number
  barcode?: string
  sku?: string
  name: string
  description?: string
  image_url?: string
  unit: string
  cost_price: number
  selling_price: number
  stock_qty: number
  reorder_level: number
  max_stock: number
  is_active: boolean
  is_featured: boolean
  category_name?: string
  supplier_name?: string
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  name: string
  barcode?: string
  sku?: string
  category_id: number
  supplier_id?: number
  unit: string
  cost_price: number
  selling_price: number
  stock_qty: number
  reorder_level: number
  max_stock: number
  description?: string
  image_url?: string
  is_active: boolean
  is_featured: boolean
}

export interface ProductFilters extends Record<string, string | number | undefined> {
  page?: number
  per_page?: number
  search?: string
  category_id?: number
  status?: 'active' | 'inactive' | 'low' | 'out'
}
