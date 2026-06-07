import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Input } from '@/components/ui/Input'
import { SelectField } from '@/components/ui/Select'
import { ProductCard } from '@/portals/customer/components/ProductCard'
import { productService } from '@/services/product.service'
import { Package } from 'lucide-react'

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') ?? ''
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(categoryParam || 'all')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await productService.getCategories()
      return data.data.filter((c) => c.is_active)
    },
  })

  const filters = useMemo(
    () => ({
      status: 'active' as const,
      per_page: 48,
      search: search || undefined,
      category_id:
        categoryId && categoryId !== 'all' ? Number(categoryId) : undefined,
    }),
    [search, categoryId],
  )

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'shop', filters],
    queryFn: async () => {
      const { data } = await productService.getAll(filters)
      return data.data
    },
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const handleCategory = (value: string) => {
    setCategoryId(value)
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'all') next.set('category', value)
    else next.delete('category')
    setSearchParams(next, { replace: true })
  }

  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...(categories ?? []).map((c) => ({
      value: String(c.category_id),
      label: c.name,
    })),
  ]

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Shop" subtitle="Browse our full product catalogue" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <SelectField
          value={categoryId}
          onValueChange={handleCategory}
          options={categoryOptions}
          className="sm:w-56"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (products ?? []).length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Try adjusting your search or category filter."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {(products ?? []).map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
