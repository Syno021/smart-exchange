import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SelectField } from '@/components/ui/Select'
import { useSupplierProfile } from '@/portals/supplier/hooks/useSupplierProfile'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { PO_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { POStatus, PurchaseOrder } from '@/types/order.types'
import { useState } from 'react'

export function PurchaseOrdersPage() {
  const { data: supplier } = useSupplierProfile()
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['supplier', 'orders', supplier?.supplier_id, statusFilter],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getAll({
        per_page: 50,
        status:
          statusFilter !== 'all'
            ? (statusFilter as POStatus)
            : undefined,
      })
      return data.data
    },
    enabled: !!supplier,
  })

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: 'po_ref',
      header: 'PO Reference',
      cell: ({ row }) => (
        <Link
          to={`/supplier/orders/${row.original.po_id}`}
          className="font-mono text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {row.original.po_ref}
        </Link>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.created_at, 'dd MMM yyyy'),
    },
    {
      accessorKey: 'expected_date',
      header: 'Expected',
      cell: ({ row }) =>
        row.original.expected_date
          ? formatDate(row.original.expected_date, 'dd MMM yyyy')
          : '—',
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
          label={PO_STATUS_LABELS[row.original.status]}
        />
      ),
    },
  ]

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    ...Object.entries(PO_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ]

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Purchase Orders" subtitle="Manage incoming orders from Ubuntu Smart Mart" />

      <div className="mb-4 sm:w-56">
        <SelectField
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={statusOptions}
        />
      </div>

      <DataTable
        columns={columns}
        data={orders ?? []}
        isLoading={isLoading}
        searchPlaceholder="Search POs…"
        pageSize={10}
        emptyMessage="No purchase orders found."
      />
    </div>
  )
}
