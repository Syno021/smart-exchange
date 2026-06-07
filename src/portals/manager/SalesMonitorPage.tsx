import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  DataTable,
  Input,
  PageHeader,
  RandAmount,
  SelectField,
  StatusBadge,
  type ColumnDef,
} from '@/components'
import { saleService } from '@/services/sale.service'
import { SALE_STATUS_LABELS } from '@/lib/constants'
import { formatDate, toNumber } from '@/lib/utils'
import type { Sale, SaleStatus } from '@/types/sale.types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...Object.entries(SALE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export function SalesMonitorPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const salesQuery = useQuery({
    queryKey: ['sales', { dateFrom, dateTo, status: statusFilter }],
    queryFn: async () => {
      const { data } = await saleService.getAll({
        per_page: 200,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: statusFilter !== 'all' ? (statusFilter as SaleStatus) : undefined,
      })
      return data.data
    },
  })

  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        accessorKey: 'sale_ref',
        header: 'Sale Ref',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.sale_ref}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: 'cashier_name',
        header: 'Cashier',
        cell: ({ row }) => row.original.cashier_name ?? '—',
      },
      {
        accessorKey: 'payment_method',
        header: 'Payment',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.payment_method}</span>
        ),
      },
      {
        accessorKey: 'total_amt',
        header: 'Total',
        cell: ({ row }) => <RandAmount amount={row.original.total_amt} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={SALE_STATUS_LABELS[row.original.status]}
          />
        ),
      },
    ],
    []
  )

  const totalRevenue = (salesQuery.data ?? [])
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + toNumber(s.total_amt), 0)

  return (
    <div>
      <PageHeader
        title="Sales Monitor"
        subtitle="Track transactions and revenue across the store"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="From"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <SelectField
          label="Status"
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
        <div className="flex flex-col justify-end">
          <p className="text-sm text-gray-500">Filtered revenue</p>
          <p className="font-display text-xl font-bold text-gray-900">
            <RandAmount amount={totalRevenue} />
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={salesQuery.data ?? []}
        isLoading={salesQuery.isLoading}
        searchPlaceholder="Search sales…"
        exportCsv
        exportFilename="sales"
        emptyMessage="No sales found for the selected filters."
      />
    </div>
  )
}
