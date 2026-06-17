import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  DollarSign,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CategoryDonutChart,
  DataTable,
  Input,
  KpiCard,
  PageHeader,
  RandAmount,
  SkeletonKpiGrid,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TopProductsChart,
  type ColumnDef,
} from '@/components'
import { formatDate, formatRand } from '@/lib/utils'
import { todayIso } from '@/lib/validation'
import { reportService } from '@/services/report.service'
import type { CashierPerformanceReport, RecentChangesReport, TopProductsReport } from '@/services/report.service'

const RECENT_CHANGES_POLL = 10000

function defaultDateRange() {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  return { from, to }
}

export function ReportsPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const params = { date_from: dateRange.from, date_to: dateRange.to }

  const salesQuery = useQuery({
    queryKey: ['admin', 'reports', 'sales-summary', params],
    queryFn: async () => {
      const { data } = await reportService.salesSummary(params)
      return data.data
    },
  })

  const topProductsQuery = useQuery({
    queryKey: ['admin', 'reports', 'top-products', params],
    queryFn: async () => {
      const { data } = await reportService.topProducts({ ...params, limit: 10 })
      return data.data
    },
  })

  const revenueExpensesQuery = useQuery({
    queryKey: ['admin', 'reports', 'revenue-expenses', params],
    queryFn: async () => {
      const { data } = await reportService.revenueExpenses(params)
      return data.data
    },
  })

  const cashierQuery = useQuery({
    queryKey: ['admin', 'reports', 'cashier-performance', params],
    queryFn: async () => {
      const { data } = await reportService.cashierPerformance(params)
      return data.data
    },
  })

  const stockQuery = useQuery({
    queryKey: ['admin', 'reports', 'stock-value'],
    queryFn: async () => {
      const { data } = await reportService.stockValue()
      return data.data
    },
  })

  const overviewQuery = useQuery({
    queryKey: ['admin', 'reports', 'overview', params],
    queryFn: async () => {
      const { data } = await reportService.overview(params)
      return data.data
    },
  })

  const recentChangesQuery = useQuery({
    queryKey: ['admin', 'reports', 'recent-changes'],
    queryFn: async () => {
      const { data } = await reportService.recentChanges({ limit: 25 })
      return data.data
    },
    refetchInterval: RECENT_CHANGES_POLL,
    refetchIntervalInBackground: true,
  })

  const topProductChartData = useMemo(
    () =>
      (topProductsQuery.data?.products ?? []).map((p) => ({
        name: p.name,
        revenue: Number(p.revenue),
        qty: Number(p.units_sold),
      })),
    [topProductsQuery.data]
  )

  const monthlyChartData = useMemo(
    () =>
      (revenueExpensesQuery.data?.monthly ?? []).map((m) => ({
        month: m.month_label,
        revenue: Number(m.revenue),
        expenses: Number(m.expenses),
      })),
    [revenueExpensesQuery.data]
  )

  const expenseDonutData = useMemo(
    () =>
      (revenueExpensesQuery.data?.expenses_by_category ?? []).map((e) => ({
        name: e.category,
        value: Number(e.total),
      })),
    [revenueExpensesQuery.data]
  )

  const topProductColumns: ColumnDef<TopProductsReport['products'][number]>[] = [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'units_sold', header: 'Units Sold' },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => <RandAmount amount={Number(row.original.revenue)} />,
    },
    { accessorKey: 'order_count', header: 'Orders' },
  ]

  const cashierColumns: ColumnDef<CashierPerformanceReport['cashiers'][number]>[] = [
    { accessorKey: 'full_name', header: 'Cashier' },
    { accessorKey: 'total_sales', header: 'Transactions' },
    {
      accessorKey: 'total_revenue',
      header: 'Revenue',
      cell: ({ row }) => <RandAmount amount={Number(row.original.total_revenue)} />,
    },
    {
      accessorKey: 'avg_sale_value',
      header: 'Avg Sale',
      cell: ({ row }) => <RandAmount amount={Number(row.original.avg_sale_value)} />,
    },
  ]

  const stockCategoryColumns: ColumnDef<
    NonNullable<typeof stockQuery.data>['by_category'][number]
  >[] = [
    { accessorKey: 'category_name', header: 'Category' },
    { accessorKey: 'product_count', header: 'Products' },
    { accessorKey: 'total_units', header: 'Units' },
    {
      accessorKey: 'cost_value',
      header: 'Cost Value',
      cell: ({ row }) => <RandAmount amount={Number(row.original.cost_value)} />,
    },
    {
      accessorKey: 'retail_value',
      header: 'Retail Value',
      cell: ({ row }) => <RandAmount amount={Number(row.original.retail_value)} />,
    },
  ]

  const recentAuditColumns: ColumnDef<RecentChangesReport['audit_entries'][number]>[] = [
    {
      accessorKey: 'created_at',
      header: 'When',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      accessorKey: 'user_name',
      header: 'User',
      cell: ({ row }) => row.original.user_name ?? 'System',
    },
    { accessorKey: 'action', header: 'Action' },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => row.original.module ?? '—',
    },
    {
      accessorKey: 'target_id',
      header: 'Target',
      cell: ({ row }) => row.original.target_id ?? '—',
    },
  ]

  const recentSalesColumns: ColumnDef<RecentChangesReport['recent_sales'][number]>[] = [
    { accessorKey: 'sale_ref', header: 'Sale Ref' },
    {
      accessorKey: 'total_amt',
      header: 'Amount',
      cell: ({ row }) => <RandAmount amount={Number(row.original.total_amt)} />,
    },
    { accessorKey: 'status', header: 'Status' },
    {
      accessorKey: 'cashier_name',
      header: 'Cashier',
      cell: ({ row }) => row.original.cashier_name ?? '—',
    },
    {
      accessorKey: 'created_at',
      header: 'When',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
  ]

  const changesSummary = recentChangesQuery.data?.changes_summary

  const dateFilters = (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        label="From"
        type="date"
        value={dateRange.from}
        max={todayIso()}
        onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))}
        className="w-auto min-w-[160px]"
      />
      <Input
        label="To"
        type="date"
        value={dateRange.to}
        max={todayIso()}
        onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))}
        className="w-auto min-w-[160px]"
      />
    </div>
  )

  return (
    <div>
      <PageHeader title="Reports" subtitle="Analytics and performance insights" />

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Database Overview</TabsTrigger>
          <TabsTrigger value="changes">Recent Changes</TabsTrigger>
          <TabsTrigger value="sales">Sales Summary</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="revenue">Revenue vs Expenses</TabsTrigger>
          <TabsTrigger value="cashiers">Cashier Performance</TabsTrigger>
          <TabsTrigger value="stock">Stock Value</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mb-4">{dateFilters}</div>
          {overviewQuery.isLoading ? (
            <SkeletonKpiGrid count={8} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Total Users"
                  value={overviewQuery.data?.users.total ?? 0}
                  icon={Users}
                  colorScheme="blue"
                  subtitle={`${overviewQuery.data?.users.active ?? 0} active`}
                />
                <KpiCard
                  title="Products"
                  value={overviewQuery.data?.products.active ?? 0}
                  icon={Package}
                  colorScheme="gray"
                  subtitle={`${overviewQuery.data?.products.low_stock ?? 0} low stock`}
                />
                <KpiCard
                  title="Customers"
                  value={overviewQuery.data?.customers ?? 0}
                  icon={Users}
                  colorScheme="green"
                />
                <KpiCard
                  title="Suppliers"
                  value={overviewQuery.data?.suppliers ?? 0}
                  icon={ShoppingCart}
                  colorScheme="amber"
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Sales (Period)"
                  value={overviewQuery.data?.sales.period.total_sales ?? 0}
                  icon={Receipt}
                  colorScheme="green"
                  subtitle={formatRand(Number(overviewQuery.data?.sales.period.total_revenue ?? 0))}
                />
                <KpiCard
                  title="Sales Today"
                  value={overviewQuery.data?.sales.today.count ?? 0}
                  icon={ShoppingCart}
                  colorScheme="blue"
                  subtitle={formatRand(Number(overviewQuery.data?.sales.today.revenue ?? 0))}
                />
                <KpiCard
                  title="Expenses (Period)"
                  value={formatRand(Number(overviewQuery.data?.expenses_total ?? 0))}
                  icon={Wallet}
                  colorScheme="red"
                />
                <KpiCard
                  title="Stock Movements"
                  value={overviewQuery.data?.stock_movements ?? 0}
                  icon={Activity}
                  colorScheme="gray"
                  subtitle="In selected period"
                />
              </div>
              {overviewQuery.data?.users.by_role && overviewQuery.data.users.by_role.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Users by Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {overviewQuery.data.users.by_role.map((entry) => (
                        <div
                          key={entry.role}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <p className="text-xs uppercase tracking-wide text-gray-500">{entry.role}</p>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">{entry.count}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="changes">
          {recentChangesQuery.isLoading ? (
            <SkeletonKpiGrid count={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Audit Events (24h)"
                value={changesSummary?.audit_count ?? 0}
                icon={Activity}
                colorScheme="blue"
              />
              <KpiCard
                title="New Users (24h)"
                value={changesSummary?.new_users ?? 0}
                icon={Users}
                colorScheme="green"
              />
              <KpiCard
                title="Sales Count Δ"
                value={changesSummary?.sales_count_delta ?? 0}
                icon={
                  (changesSummary?.sales_count_delta ?? 0) >= 0 ? TrendingUp : TrendingDown
                }
                colorScheme={
                  (changesSummary?.sales_count_delta ?? 0) >= 0 ? 'green' : 'red'
                }
                subtitle="vs previous 24h"
              />
              <KpiCard
                title="Revenue Δ"
                value={formatRand(Number(changesSummary?.sales_revenue_delta ?? 0))}
                icon={
                  (changesSummary?.sales_revenue_delta ?? 0) >= 0 ? TrendingUp : TrendingDown
                }
                colorScheme={
                  (changesSummary?.sales_revenue_delta ?? 0) >= 0 ? 'green' : 'red'
                }
                subtitle="vs previous 24h"
              />
            </div>
          )}

          <p className="mb-4 mt-2 text-xs text-gray-500">
            Auto-refreshes every {RECENT_CHANGES_POLL / 1000}s · showing activity since{' '}
            {recentChangesQuery.data?.since
              ? formatDate(recentChangesQuery.data.since)
              : 'last 24 hours'}
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Audit Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={recentAuditColumns}
                data={recentChangesQuery.data?.audit_entries ?? []}
                isLoading={recentChangesQuery.isLoading}
                searchable={false}
                emptyMessage="No recent audit activity."
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={recentSalesColumns}
                  data={recentChangesQuery.data?.recent_sales ?? []}
                  isLoading={recentChangesQuery.isLoading}
                  searchable={false}
                  emptyMessage="No recent sales."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Movements</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={[
                    {
                      accessorKey: 'product_name',
                      header: 'Product',
                    },
                    {
                      accessorKey: 'movement_type',
                      header: 'Type',
                    },
                    {
                      accessorKey: 'qty_change',
                      header: 'Qty Change',
                    },
                    {
                      accessorKey: 'created_at',
                      header: 'When',
                      cell: ({ row }) => formatDate(row.original.created_at),
                    },
                  ]}
                  data={recentChangesQuery.data?.stock_movements ?? []}
                  isLoading={recentChangesQuery.isLoading}
                  searchable={false}
                  emptyMessage="No recent stock movements."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="mb-4">{dateFilters}</div>
          {salesQuery.isLoading ? (
            <SkeletonKpiGrid count={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Sales"
                value={salesQuery.data?.summary.total_sales ?? 0}
                icon={ShoppingCart}
                colorScheme="green"
              />
              <KpiCard
                title="Total Revenue"
                value={formatRand(Number(salesQuery.data?.summary.total_revenue ?? 0))}
                icon={DollarSign}
                colorScheme="green"
              />
              <KpiCard
                title="Avg Transaction"
                value={formatRand(Number(salesQuery.data?.summary.avg_sale_value ?? 0))}
                icon={Receipt}
                colorScheme="blue"
              />
              <KpiCard
                title="Total Tax"
                value={formatRand(Number(salesQuery.data?.summary.total_tax ?? 0))}
                icon={Percent}
                colorScheme="gray"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          <div className="mb-4">{dateFilters}</div>
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProductsQuery.isLoading ? (
                <div className="h-[320px] animate-pulse rounded bg-gray-100" />
              ) : topProductChartData.length > 0 ? (
                <TopProductsChart data={topProductChartData} />
              ) : (
                <p className="py-12 text-center text-sm text-gray-500">No product data for this period.</p>
              )}
            </CardContent>
          </Card>
          <div className="mt-4">
            <DataTable
              columns={topProductColumns}
              data={topProductsQuery.data?.products ?? []}
              isLoading={topProductsQuery.isLoading}
              searchable={false}
              emptyMessage="No products sold in this period."
            />
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="mb-4">{dateFilters}</div>
          {revenueExpensesQuery.isLoading ? (
            <SkeletonKpiGrid count={3} className="lg:grid-cols-3" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard
                title="Revenue"
                value={formatRand(Number(revenueExpensesQuery.data?.total_revenue ?? 0))}
                icon={TrendingUp}
                colorScheme="green"
              />
              <KpiCard
                title="Expenses"
                value={formatRand(Number(revenueExpensesQuery.data?.total_expenses ?? 0))}
                icon={Wallet}
                colorScheme="red"
              />
              <KpiCard
                title="Net Profit"
                value={formatRand(Number(revenueExpensesQuery.data?.net_profit ?? 0))}
                icon={BarChart3}
                colorScheme="blue"
              />
            </div>
          )}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Monthly Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueExpensesQuery.isLoading ? (
                <div className="h-[300px] animate-pulse rounded bg-gray-100" />
              ) : monthlyChartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                        formatter={(value, name) => [formatRand(Number(value)), name === 'revenue' ? 'Revenue' : 'Expenses']}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#00843D" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#C8102E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-gray-500">No financial data for this period.</p>
              )}
            </CardContent>
          </Card>
          {expenseDonutData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryDonutChart data={expenseDonutData} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cashiers">
          <div className="mb-4">{dateFilters}</div>
          <DataTable
            columns={cashierColumns}
            data={cashierQuery.data?.cashiers ?? []}
            isLoading={cashierQuery.isLoading}
            exportCsv
            exportFilename="cashier-performance"
            emptyMessage="No cashier activity for this period."
          />
        </TabsContent>

        <TabsContent value="stock">
          {stockQuery.isLoading ? (
            <SkeletonKpiGrid count={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Products"
                value={stockQuery.data?.totals.total_products ?? 0}
                icon={Package}
                colorScheme="blue"
              />
              <KpiCard
                title="Total Units"
                value={stockQuery.data?.totals.total_units ?? 0}
                icon={BarChart3}
                colorScheme="gray"
              />
              <KpiCard
                title="Cost Value"
                value={formatRand(Number(stockQuery.data?.totals.cost_value ?? 0))}
                icon={Wallet}
                colorScheme="amber"
              />
              <KpiCard
                title="Retail Value"
                value={formatRand(Number(stockQuery.data?.totals.retail_value ?? 0))}
                icon={DollarSign}
                colorScheme="green"
              />
            </div>
          )}
          <div className="mt-6">
            <DataTable
              columns={stockCategoryColumns}
              data={stockQuery.data?.by_category ?? []}
              isLoading={stockQuery.isLoading}
              searchable={false}
              emptyMessage="No stock data available."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
