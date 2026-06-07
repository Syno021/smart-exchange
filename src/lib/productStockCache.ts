import type { QueryClient } from '@tanstack/react-query'
import type { Product } from '@/types/product.types'
import { toNumber } from './utils'

type SoldItem = { product_id: number; qty: number }

function applyStockDecrement(products: Product[], soldMap: Map<number, number>): Product[] {
  return products.map((product) => {
    const soldQty = soldMap.get(product.product_id)
    if (!soldQty) return product
    return {
      ...product,
      stock_qty: Math.max(0, toNumber(product.stock_qty) - soldQty),
    }
  })
}

/** Immediately reduce displayed stock across all cached product lists after a sale. */
export function decrementProductStockInCache(
  queryClient: QueryClient,
  soldItems: SoldItem[],
): void {
  if (soldItems.length === 0) return

  const soldMap = new Map<number, number>()
  for (const item of soldItems) {
    soldMap.set(item.product_id, (soldMap.get(item.product_id) ?? 0) + item.qty)
  }

  queryClient.setQueriesData<Product[]>({ queryKey: ['products'] }, (old) => {
    if (!old || !Array.isArray(old)) return old
    return applyStockDecrement(old, soldMap)
  })

  void queryClient.invalidateQueries({ queryKey: ['products'] })
}
