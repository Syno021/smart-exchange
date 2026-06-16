import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  DataTable,
  PageHeader,
  RandAmount,
  StatusBadge,
  type ColumnDef,
} from '@/components'
import { saleService } from '@/services/sale.service'
import { formatDate } from '@/lib/utils'
import { todayIso } from '@/lib/validation'
import type { Sale } from '@/types/sale.types'

const PAGE_SIZE = 15

function monthStartIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function TransactionHistoryPage() {
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState(monthStartIso())
  const [dateTo, setDateTo] = useState(todayIso())

  const salesQuery = useQuery({
    queryKey: ['sales', 'cashier', page, dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await saleService.getAll({
        page,
        per_page: PAGE_SIZE,
        date_from: dateFrom,
        date_to: dateTo,
      })
      return data
    },
  })

  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        accessorKey: 'sale_ref',
        header: 'Reference',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-gray-900">{row.original.sale_ref}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-gray-600">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="text-gray-600">{row.original.customer_name ?? 'Walk-in'}</span>
        ),
      },
      {
        accessorKey: 'payment_method',
        header: 'Payment',
        cell: ({ row }) => (
          <span className="capitalize text-gray-600">{row.original.payment_method}</span>
        ),
      },
      {
        accessorKey: 'total_amt',
        header: 'Total',
        cell: ({ row }) => (
          <RandAmount amount={row.original.total_amt} className="font-medium text-gray-900" />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  )

  const sales = salesQuery.data?.data ?? []
  const pagination = salesQuery.data?.pagination
  const totalPages = pagination?.last_page ?? 1

  return (
    <div>
      <PageHeader
        title="Transaction History"
        subtitle="Your completed sales — filtered automatically to your cashier account"
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-white p-4">
        <Filter className="hidden h-4 w-4 text-gray-400 sm:block" />
        <div className="flex flex-col gap-1">
          <label htmlFor="date-from" className="text-xs font-medium text-gray-500">
            From
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            max={todayIso()}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded border border-gray-200 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="date-to" className="text-xs font-medium text-gray-500">
            To
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            max={todayIso()}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded border border-gray-200 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        {pagination && (
          <p className="ml-auto text-sm text-gray-500">
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <DataTable
        columns={columns}
        data={sales}
        isLoading={salesQuery.isLoading}
        searchable={false}
        pageSize={PAGE_SIZE}
        emptyMessage="No transactions found for this period."
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || salesQuery.isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || salesQuery.isFetching}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
