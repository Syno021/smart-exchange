import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, DollarSign, ShoppingCart, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  PageHeader,
  RevenueLineChart,
  SalesBarChart,
  SkeletonKpiGrid,
} from '@/components'
import { formatDate, formatRand } from '@/lib/utils'
import { auditService } from '@/services/audit.service'
import { reportService } from '@/services/report.service'
import { userService } from '@/services/user.service'

export function DashboardPage() {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users-count'],
    queryFn: async () => {
      const { data } = await userService.getAll({ page: 1, per_page: 1 })
      return data.pagination.total
    },
  })

  const salesTodayQuery = useQuery({
    queryKey: ['admin', 'sales-today'],
    queryFn: async () => {
      const { data } = await reportService.salesSummary({ period: 'day' })
      return data.data
    },
  })

  const weekSalesQuery = useQuery({
    queryKey: ['admin', 'sales-week'],
    queryFn: async () => {
      const { data } = await reportService.salesSummary({ period: 'week' })
      return data.data
    },
  })

  const stockQuery = useQuery({
    queryKey: ['admin', 'stock-value'],
    queryFn: async () => {
      const { data } = await reportService.stockValue()
      return data.data
    },
  })

  const auditQuery = useQuery({
    queryKey: ['admin', 'recent-audit'],
    queryFn: async () => {
      const { data } = await auditService.getAll({ page: 1, per_page: 8 })
      return data.data
    },
  })

  const kpisLoading =
    usersQuery.isLoading ||
    salesTodayQuery.isLoading ||
    stockQuery.isLoading

  const todaySummary = salesTodayQuery.data?.summary
  const weekTrend = weekSalesQuery.data?.trend ?? []

  const revenueChartData = weekTrend.map((t) => ({
    date: t.period_label,
    revenue: Number(t.revenue),
  }))

  const salesChartData = weekTrend.map((t) => ({
    label: t.period_label,
    sales: Number(t.sales_count),
  }))

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of store performance and system activity"
      />

      {kpisLoading ? (
        <SkeletonKpiGrid count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Users"
            value={usersQuery.data ?? 0}
            icon={Users}
            colorScheme="blue"
            index={0}
          />
          <KpiCard
            title="Sales Today"
            value={todaySummary?.total_sales ?? 0}
            subtitle="Completed transactions"
            icon={ShoppingCart}
            colorScheme="green"
            index={1}
          />
          <KpiCard
            title="Revenue Today"
            value={formatRand(Number(todaySummary?.total_revenue ?? 0))}
            icon={DollarSign}
            colorScheme="green"
            index={2}
          />
          <KpiCard
            title="Low Stock Items"
            value={stockQuery.data?.low_stock_count ?? 0}
            subtitle="At or below reorder level"
            icon={AlertTriangle}
            colorScheme="amber"
            index={3}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {weekSalesQuery.isLoading ? (
              <div className="h-[300px] animate-pulse rounded bg-gray-100" />
            ) : revenueChartData.length > 0 ? (
              <RevenueLineChart data={revenueChartData} />
            ) : (
              <p className="py-12 text-center text-sm text-gray-500">No revenue data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Volume (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {weekSalesQuery.isLoading ? (
              <div className="h-[300px] animate-pulse rounded bg-gray-100" />
            ) : salesChartData.length > 0 ? (
              <SalesBarChart data={salesChartData} />
            ) : (
              <p className="py-12 text-center text-sm text-gray-500">No sales data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-600" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : auditQuery.data?.length ? (
            <ul className="divide-y divide-gray-50">
              {auditQuery.data.map((entry) => (
                <li
                  key={entry.log_id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-brand-700">{entry.action}</span>
                      {entry.module && (
                        <span className="text-gray-500"> · {entry.module}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.user_name ?? 'System'}
                      {entry.target_id != null && ` · #${entry.target_id}`}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-gray-400">
                    {formatDate(entry.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">No recent activity.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
