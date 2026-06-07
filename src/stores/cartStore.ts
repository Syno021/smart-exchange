import { create } from 'zustand'
import { toNumber } from '../lib/utils'
import type { CartItem } from '../types/sale.types'

interface CartState {
  items: CartItem[]
  customerId: number | null
  discount: number
  addItem: (item: CartItem) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, delta: number) => void
  setDiscount: (amount: number) => void
  setCustomer: (id: number | null) => void
  clearCart: () => void
  subtotal: () => number
  tax: () => number
  total: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  customerId: null,
  discount: 0,

  addItem: (item) =>
    set((s) => {
      const normalized: CartItem = {
        ...item,
        unit_price: toNumber(item.unit_price),
        qty: toNumber(item.qty, 1),
        discount_pct: toNumber(item.discount_pct),
        line_total: toNumber(item.line_total),
        stock_qty: toNumber(item.stock_qty),
      }
      const existing = s.items.find((i) => i.product_id === normalized.product_id)
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.product_id === normalized.product_id
              ? {
                  ...i,
                  qty: i.qty + 1,
                  line_total:
                    (i.qty + 1) * i.unit_price * (1 - i.discount_pct / 100),
                }
              : i,
          ),
        }
      }
      return { items: [...s.items, normalized] }
    }),

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.product_id !== id) })),

  updateQty: (id, delta) =>
    set((s) => ({
      items: s.items
        .map((i) => {
          if (i.product_id !== id) return i
          const qty = Math.max(1, i.qty + delta)
          return {
            ...i,
            qty,
            line_total: qty * i.unit_price * (1 - i.discount_pct / 100),
          }
        })
        .filter((i) => i.qty > 0),
    })),

  setDiscount: (amount) => set({ discount: amount }),
  setCustomer: (id) => set({ customerId: id }),
  clearCart: () => set({ items: [], customerId: null, discount: 0 }),

  subtotal: () =>
    get().items.reduce((sum, item) => sum + toNumber(item.line_total), 0),
  tax: () => {
    const sub = get().subtotal() - toNumber(get().discount)
    return Math.round(sub * 0.15 * 100) / 100
  },
  total: () => {
    const sub = get().subtotal()
    return sub - toNumber(get().discount) + get().tax()
  },
}))
