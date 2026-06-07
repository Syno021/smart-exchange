export type POStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'shipped'
  | 'received'
  | 'cancelled'

export interface POItem {
  po_item_id?: number
  po_id?: number
  product_id: number
  product_name?: string
  qty_ordered: number
  qty_received: number
  unit_cost: number
  line_total: number
}

export interface PurchaseOrder {
  po_id: number
  po_ref: string
  supplier_id: number
  supplier_name?: string
  created_by: number
  creator_name?: string
  approved_by?: number
  status: POStatus
  total_amt: number
  expected_date?: string
  received_date?: string
  notes?: string
  supplier_notes?: string
  items?: POItem[]
  created_at: string
  updated_at: string
}

export interface PurchaseOrderFormData {
  supplier_id: number
  expected_date?: string
  notes?: string
  items: Array<{
    product_id: number
    qty_ordered: number
    unit_cost: number
    line_total: number
  }>
}

export interface POFilters extends Record<string, string | number | undefined> {
  page?: number
  per_page?: number
  status?: POStatus
  supplier_id?: number
}
