import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { SkeletonKpi } from '@/components/shared/SkeletonKpi'
import { RandAmount } from '@/components/shared/RandAmount'
import { ProductCard } from '@/portals/customer/components/ProductCard'
import { productService } from '@/services/product.service'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, string> = {
  groceries: '🛒',
  beverages: '🥤',
  dairy: '🥛',
  bakery: '🍞',
  household: '🧹',
  snacks: '🍿',
  default: '📦',
}

export function HomePage() {
  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await productService.getCategories()
      return data.data.filter((c) => c.is_active)
    },
  })

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data } = await productService.getAll({ status: 'active', per_page: 8 })
      return data.data.filter((p) => p.is_featured && p.is_active)
    },
  })

  const { data: deals } = useQuery({
    queryKey: ['products', 'deals'],
    queryFn: async () => {
      const { data } = await productService.getAll({ status: 'active', per_page: 12 })
      return data.data
        .filter((p) => p.selling_price < p.cost_price * 1.25)
        .slice(0, 4)
    },
  })

  return (
    <div className="space-y-10 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="relative z-10 max-w-xl">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-100">
            <Sparkles className="h-4 w-4" />
            Welcome to {APP_NAME}
          </p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Fresh deals, delivered with Ubuntu spirit
          </h1>
          <p className="mt-3 text-brand-100">
            Shop local favourites, earn loyalty points, and enjoy smart savings every day.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop/browse">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
                Start Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/shop/loyalty">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                View Loyalty Card
              </Button>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/5" />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gray-900">Shop by Category</h2>
          <Link to="/shop/browse" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {catsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonKpi key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {(categories ?? []).map((cat) => (
              <Link key={cat.category_id} to={`/shop/browse?category=${cat.category_id}`}>
                <Card className="flex flex-col items-center p-4 text-center transition-shadow hover:shadow-md">
                  <span className="text-3xl">
                    {CATEGORY_ICONS[cat.slug] ?? CATEGORY_ICONS.default}
                  </span>
                  <p className="mt-2 text-sm font-medium text-gray-900">{cat.name}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-xl font-bold text-gray-900">Featured Deals</h2>
        </div>
        {featuredLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (featured ?? []).length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(featured ?? []).map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-500">
              No featured products right now. Browse the shop for great deals.
            </CardContent>
          </Card>
        )}
      </section>

      {(deals ?? []).length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-gray-900">Smart Savings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(deals ?? []).map((product) => (
              <Link
                key={product.product_id}
                to={`/shop/browse/${product.product_id}`}
                className={cn(
                  'flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-md',
                )}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-2xl">
                  📦
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category_name}</p>
                </div>
                <RandAmount amount={product.selling_price} className="font-bold text-brand-700" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
