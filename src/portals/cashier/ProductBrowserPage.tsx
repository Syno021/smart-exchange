import { useQuery } from '@tanstack/react-query'
import { Package, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  RandAmount,
} from '@/components'
import { productService } from '@/services/product.service'
import type { Product } from '@/types/product.types'
import { cn } from '@/lib/utils'

function ProductBrowseCard({ product }: { product: Product }) {
  const outOfStock = product.stock_qty <= 0
  const lowStock = !outOfStock && product.stock_qty <= product.reorder_level

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-gray-50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {outOfStock && (
          <Badge variant="danger" className="absolute right-2 top-2">
            Out of stock
          </Badge>
        )}
        {lowStock && (
          <Badge variant="warning" className="absolute right-2 top-2">
            Low stock
          </Badge>
        )}
        {product.is_featured && !outOfStock && (
          <Badge variant="default" className="absolute left-2 top-2">
            Featured
          </Badge>
        )}
      </div>
      <div className="p-4">
        {product.category_name && (
          <p className="text-xs font-medium text-gray-500">{product.category_name}</p>
        )}
        <h3 className="mt-1 line-clamp-2 font-medium text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{product.description}</p>
        )}
        <div className="mt-3 flex items-end justify-between gap-2">
          <RandAmount amount={product.selling_price} className="text-lg font-bold text-brand-700" />
          <span className="text-xs text-gray-500">
            {product.stock_qty} {product.unit}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-400">
          {product.barcode && <span>Barcode: {product.barcode}</span>}
          {product.sku && <span>SKU: {product.sku}</span>}
        </div>
      </div>
    </Card>
  )
}

export function ProductBrowserPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await productService.getCategories()
      return data.data
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products', 'browse', debouncedSearch, categoryId],
    queryFn: async () => {
      const { data } = await productService.getAll({
        search: debouncedSearch || undefined,
        category_id: categoryId,
        status: 'active',
        per_page: 60,
      })
      return data.data
    },
  })

  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data ?? []

  return (
    <div>
      <PageHeader
        title="Product Browser"
        subtitle="Browse the store catalogue — read-only reference for cashiers"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, barcode, or SKU…"
            className={cn(
              'h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm',
              'focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20',
            )}
          />
        </div>
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {productsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description={debouncedSearch ? 'Try adjusting your search or category filter.' : 'No active products in the catalogue.'}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductBrowseCard key={product.product_id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
