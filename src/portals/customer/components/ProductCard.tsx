import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RandAmount } from '@/components/shared/RandAmount'
import { useCartStore } from '@/stores/cartStore'
import type { Product } from '@/types/product.types'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const outOfStock = product.stock_qty <= 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (outOfStock) return
    addItem({
      product_id: product.product_id,
      name: product.name,
      unit_price: product.selling_price,
      qty: 1,
      discount_pct: 0,
      line_total: product.selling_price,
      stock_qty: product.stock_qty,
      image_url: product.image_url,
    })
  }

  return (
    <Card className={cn('group overflow-hidden transition-shadow hover:shadow-md', className)}>
      <Link to={`/shop/browse/${product.product_id}`} className="block">
        <div className="relative aspect-square bg-gray-50">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-gray-300">
              📦
            </div>
          )}
          {product.is_featured && (
            <Badge variant="warning" className="absolute left-2 top-2">
              Featured
            </Badge>
          )}
          {outOfStock && (
            <Badge variant="danger" className="absolute right-2 top-2">
              Out of stock
            </Badge>
          )}
        </div>
        <div className="p-4">
          {product.category_name && (
            <p className="text-xs font-medium text-gray-500">{product.category_name}</p>
          )}
          <h3 className="mt-1 line-clamp-2 font-medium text-gray-900 group-hover:text-brand-700">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <RandAmount amount={product.selling_price} className="text-lg font-bold text-brand-700" />
            <Button
              size="sm"
              variant="secondary"
              disabled={outOfStock}
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  )
}
