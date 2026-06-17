import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Input,
  PageHeader,
  RandAmount,
  TopProductsChart,
  type ColumnDef,
} from '@/components'
import { reportService } from '@/services/report.service'
import { todayIso } from '@/lib/validation'
import type { TopProductsReport } from '@/services/report.service'

type TrendProduct = TopProductsReport['products'][number]

export function ProductTrendsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const trendsQuery = useQuery({
    queryKey: ['reports', 'top-products', { dateFrom, dateTo }],
    queryFn: async () => {
      const { data } = await reportService.topProducts({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: 20,
      })
      return data.data
    },
  })

  const products = trendsQuery.data?.products ?? []

  const chartData = products.slice(0, 10).map((p) => ({
    name: p.name,
    revenue: Number(p.revenue),
    qty: Number(p.units_sold),
  }))

  const columns = useMemo<ColumnDef<TrendProduct>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'units_sold',
        header: 'Qty Sold',
        cell: ({ row }) => (
          <span className="font-mono">{row.original.units_sold}</span>
        ),
      },
      {
        accessorKey: 'revenue',
        header: 'Revenue',
        cell: ({ row }) => <RandAmount amount={Number(row.original.revenue)} />,
      },
      {
        id: 'avg_price',
        header: 'Avg Price',
        cell: ({ row }) => {
          const avg =
            row.original.units_sold > 0
              ? Number(row.original.revenue) / row.original.units_sold
              : 0
          return <RandAmount amount={avg} />
        },
      },
      {
        accessorKey: 'order_count',
        header: 'Orders',
        cell: ({ row }) => row.original.order_count,
      },
    ],
    []
  )

  return (
    <div>
      <PageHeader
        title="Product Trends"
        subtitle="Analyse top-selling products and revenue trends"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Input
          label="From"
          type="date"
          value={dateFrom}
          max={todayIso()}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          max={todayIso()}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsQuery.isLoading ? (
            <div className="h-[320px] animate-pulse rounded bg-gray-100" />
          ) : chartData.length > 0 ? (
            <TopProductsChart data={chartData} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No trend data for the selected period.
            </p>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={products}
        isLoading={trendsQuery.isLoading}
        searchPlaceholder="Search products…"
        exportCsv
        exportFilename="product-trends"
        emptyMessage="No product trends found."
      />
    </div>
  )
}
