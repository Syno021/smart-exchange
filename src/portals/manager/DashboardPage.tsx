import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, DollarSign, Package, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  PageHeader,
  SkeletonKpiGrid,
  StatusBadge,
  StockStatusChart,
  TopProductsChart,
} from '@/components'
import { productService } from '@/services/product.service'
import { reportService } from '@/services/report.service'
import { formatDate, formatRand } from '@/lib/utils'
import type { Product } from '@/types/product.types'

function getStockStatus(product: Product): 'active' | 'low' | 'out' | 'inactive' {
  if (!product.is_active) return 'inactive'
  if (product.stock_qty <= 0) return 'out'
  if (product.stock_qty <= product.reorder_level) return 'low'
  return 'active'
}

export function DashboardPage() {
  const stockValueQuery = useQuery({
    queryKey: ['reports', 'stock-value'],
    queryFn: async () => {
      const { data } = await reportService.stockValue()
      return data.data
    },
  })

  const salesSummaryQuery = useQuery({
    queryKey: ['reports', 'sales-summary'],
    queryFn: async () => {
      const { data } = await reportService.salesSummary({ period: 'day' })
      return data.data
    },
  })

  const lowStockQuery = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      const { data } = await productService.getLowStock()
      return data.data
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products', 'all-status'],
    queryFn: async () => {
      const { data } = await productService.getAll({ per_page: 500 })
      return data.data
    },
  })

  const topProductsQuery = useQuery({
    queryKey: ['reports', 'top-products'],
    queryFn: async () => {
      const { data } = await reportService.topProducts({ limit: 5 })
      return data.data
    },
  })

  const stockValue = stockValueQuery.data
  const salesSummary = salesSummaryQuery.data
  const lowStock = lowStockQuery.data ?? []
  const products = productsQuery.data ?? []

  const statusCounts = products.reduce(
    (acc, p) => {
      const status = getStockStatus(p)
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const stockChartData = [
    { status: 'Active', count: statusCounts.active ?? 0 },
    { status: 'Low', count: statusCounts.low ?? 0 },
    { status: 'Out', count: statusCounts.out ?? 0 },
    { status: 'Inactive', count: statusCounts.inactive ?? 0 },
  ].filter((d) => d.count > 0)

  const topChartData = (topProductsQuery.data?.products ?? []).map((p) => ({
    name: p.name,
    revenue: Number(p.revenue),
    qty: Number(p.units_sold),
  }))

  const kpisLoading = stockValueQuery.isLoading || salesSummaryQuery.isLoading

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of stock levels, sales performance, and alerts"
      />

      {kpisLoading ? (
        <SkeletonKpiGrid count={4} className="mb-6" />
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Products"
            value={stockValue?.totals.total_products ?? 0}
            subtitle={`${stockValue?.totals.total_units ?? 0} units in stock`}
            icon={Package}
            colorScheme="green"
            index={0}
          />
          <KpiCard
            title="Stock Value (Cost)"
            value={formatRand(stockValue?.totals.cost_value ?? 0)}
            subtitle="At cost price"
            icon={DollarSign}
            colorScheme="blue"
            index={1}
          />
          <KpiCard
            title="Today's Revenue"
            value={formatRand(salesSummary?.summary.total_revenue ?? 0)}
            subtitle={`${salesSummary?.summary.total_sales ?? 0} transactions`}
            icon={ShoppingCart}
            colorScheme="green"
            index={2}
          />
          <KpiCard
            title="Low Stock Alerts"
            value={stockValue?.low_stock_count ?? lowStock.length}
            subtitle="Products below reorder level"
            icon={AlertTriangle}
            colorScheme="amber"
            index={3}
          />
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            {productsQuery.isLoading ? (
              <div className="h-[280px] animate-pulse rounded bg-gray-100" />
            ) : stockChartData.length > 0 ? (
              <StockStatusChart data={stockChartData} />
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">No product data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsQuery.isLoading ? (
              <div className="h-[320px] animate-pulse rounded bg-gray-100" />
            ) : topChartData.length > 0 ? (
              <TopProductsChart data={topChartData} />
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">No sales data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Low Stock Alerts</CardTitle>
          <Link
            to="/manager/inventory"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View inventory →
          </Link>
        </CardHeader>
        <CardContent>
          {lowStockQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">All products are adequately stocked.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStock.slice(0, 8).map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.category_name ?? 'Uncategorised'} · Reorder at {product.reorder_level}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-700">
                      {product.stock_qty} {product.unit}
                    </span>
                    <StatusBadge status="low" label="Low" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {salesSummary && (
        <div className="mt-4 text-xs text-gray-400">
          Sales period: {salesSummary.period} · Updated {formatDate(new Date().toISOString(), 'dd MMM yyyy')}
        </div>
      )}
    </div>
  )
}
