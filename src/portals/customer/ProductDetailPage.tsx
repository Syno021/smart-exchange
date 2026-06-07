import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { RandAmount } from '@/components/shared/RandAmount'
import { productService } from '@/services/product.service'
import { useCartStore } from '@/stores/cartStore'
import { toNumber } from '@/lib/utils'
import { Package } from 'lucide-react'
import { useState } from 'react'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await productService.getById(Number(id))
      return data.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={Package}
          title="Product not found"
          action={
            <Link to="/shop/browse">
              <Button>Back to shop</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const outOfStock = product.stock_qty <= 0

  const handleAddToCart = () => {
    const price = toNumber(product.selling_price)
    addItem({
      product_id: product.product_id,
      name: product.name,
      unit_price: price,
      qty,
      discount_pct: 0,
      line_total: price * qty,
      stock_qty: product.stock_qty,
      image_url: product.image_url,
    })
    navigate('/shop/cart')
  }

  return (
    <div className="p-4 sm:p-6">
      <Link
        to="/shop/browse"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="aspect-square bg-gray-50">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-gray-300">
                📦
              </div>
            )}
          </div>
        </Card>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.category_name && <Badge variant="secondary">{product.category_name}</Badge>}
            {product.is_featured && <Badge variant="warning">Featured</Badge>}
            {outOfStock && <Badge variant="danger">Out of stock</Badge>}
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold text-gray-900">{product.name}</h1>

          {product.description && (
            <p className="mt-3 text-gray-600">{product.description}</p>
          )}

          <RandAmount
            amount={product.selling_price}
            className="mt-4 block text-3xl font-bold text-brand-700"
          />

          <p className="mt-2 text-sm text-gray-500">
            {outOfStock ? 'Currently unavailable' : `${product.stock_qty} in stock`}
            {product.unit && ` · per ${product.unit}`}
          </p>

          {!outOfStock && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-gray-200">
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center font-medium">{qty}</span>
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setQty((q) => Math.min(product.stock_qty, q + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button size="lg" onClick={handleAddToCart} className="flex-1 sm:flex-none">
                <ShoppingCart className="h-5 w-5" />
                Add to cart
              </Button>
            </div>
          )}

          <Card className="mt-8">
            <CardContent className="space-y-2 text-sm text-gray-600">
              {product.sku && <p><span className="font-medium text-gray-900">SKU:</span> {product.sku}</p>}
              {product.barcode && <p><span className="font-medium text-gray-900">Barcode:</span> {product.barcode}</p>}
              {product.supplier_name && (
                <p><span className="font-medium text-gray-900">Supplier:</span> {product.supplier_name}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
