export type PaymentMethod = 'cash' | 'card' | 'ewallet' | 'loyalty'

/** Payment methods available to customers at checkout (eWallet excluded) */
export type CustomerPaymentMethod = 'cash' | 'card' | 'loyalty'
export type SaleStatus =
  | 'completed'
  | 'voided'
  | 'refunded'
  | 'pending'
  | 'out_for_delivery'
  | 'delivered'

export interface CartItem {
  product_id: number
  name: string
  unit_price: number
  qty: number
  discount_pct: number
  line_total: number
  stock_qty: number
  image_url?: string
}

export interface Sale {
  sale_id: number
  sale_ref: string
  cashier_id?: number | null
  cashier_name?: string
  customer_id?: number
  customer_name?: string
  subtotal: number
  discount_amt: number
  tax_amt: number
  total_amt: number
  amount_paid: number
  change_given: number
  payment_method: PaymentMethod
  status: SaleStatus
  points_earned: number
  points_redeemed: number
  notes?: string
  delivery_address?: string
  delivery_phone?: string
  delivered_at?: string
  items?: SaleItem[]
  created_at: string
}

export interface SaleItem {
  item_id: number
  product_id: number
  product_name: string
  qty: number
  unit_price: number
  discount_pct: number
  line_total: number
}

export interface CreateOnlineOrderPayload {
  items: Array<{ product_id: number; qty: number }>
  payment_method?: CustomerPaymentMethod
  delivery_address: string
  delivery_phone: string
  notes?: string
}

export interface CreateSalePayload {
  items: Array<{
    product_id: number
    qty: number
    unit_price: number
    discount_pct?: number
    line_total: number
  }>
  customer_id?: number
  discount_amt?: number
  amount_paid?: number
  payment_method?: PaymentMethod
  notes?: string
}

export interface SaleFilters extends Record<string, string | number | undefined> {
  page?: number
  per_page?: number
  date_from?: string
  date_to?: string
  status?: SaleStatus
  delivery_queue?: number
}
