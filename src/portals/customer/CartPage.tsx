import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { useCartStore } from '@/stores/cartStore'

export function CartPage() {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)

  if (items.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <PageHeader title="Shopping Cart" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our shop and add items to get started."
          action={
            <Link to="/shop/browse">
              <Button>Start Shopping</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Shopping Cart" subtitle={`${items.length} item${items.length !== 1 ? 's' : ''}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.product_id}>
              <CardContent className="flex gap-4 py-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-2xl">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    '📦'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/shop/browse/${item.product_id}`}
                    className="font-medium text-gray-900 hover:text-brand-700"
                  >
                    {item.name}
                  </Link>
                  <RandAmount amount={item.unit_price} className="mt-1 block text-sm text-gray-500" />
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded border border-gray-200">
                      <button
                        type="button"
                        className="p-1.5 hover:bg-gray-50"
                        onClick={() => updateQty(item.product_id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm">{item.qty}</span>
                      <button
                        type="button"
                        className="p-1.5 hover:bg-gray-50"
                        onClick={() => updateQty(item.product_id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-danger-600"
                      onClick={() => removeItem(item.product_id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <RandAmount amount={item.line_total} className="font-semibold text-gray-900" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-3 py-4">
            <h3 className="font-display font-semibold text-gray-900">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <RandAmount amount={subtotal()} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT (15%)</span>
              <RandAmount amount={tax()} />
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 font-semibold">
              <span>Total</span>
              <RandAmount amount={total()} className="text-brand-700" />
            </div>
            <Link to="/shop/checkout" className="block">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <Link to="/shop/browse" className="block">
              <Button variant="ghost" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
