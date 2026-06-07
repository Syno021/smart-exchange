import { useQuery } from '@tanstack/react-query'
import { Eye, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  DataTable,
  PageHeader,
  PoStatusActionBar,
  RandAmount,
  SelectField,
  StatusBadge,
  type ColumnDef,
} from '@/components'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { supplierService } from '@/services/supplier.service'
import { PO_STATUS_LABELS } from '@/lib/constants'
import { getManagerPoActions } from '@/lib/poWorkflow'
import { formatDate } from '@/lib/utils'
import type { POStatus, PurchaseOrder } from '@/types/order.types'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...Object.entries(PO_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supplierService.getAll({ per_page: 100 })
      return data.data
    },
  })

  const posQuery = useQuery({
    queryKey: ['purchase-orders', { status: statusFilter, supplier_id: supplierFilter }],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getAll({
        per_page: 100,
        status: statusFilter !== 'all' ? (statusFilter as POStatus) : undefined,
        supplier_id: supplierFilter !== 'all' ? Number(supplierFilter) : undefined,
      })
      return data.data
    },
  })

  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: 'po_ref',
        header: 'PO Ref',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.po_ref}</span>
        ),
      },
      {
        accessorKey: 'supplier_name',
        header: 'Supplier',
        cell: ({ row }) => row.original.supplier_name ?? '—',
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
      {
        accessorKey: 'total_amt',
        header: 'Total',
        cell: ({ row }) => <RandAmount amount={row.original.total_amt} />,
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
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.created_at, 'dd MMM yyyy'),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const actions = getManagerPoActions(row.original.status)
          return (
            <div className="flex flex-wrap items-center gap-1">
              <Link to={`/manager/purchase-orders/${row.original.po_id}/edit`}>
                <Button variant="ghost" size="sm" aria-label="View / Edit">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              {actions.length > 0 && (
                <PoStatusActionBar
                  poId={row.original.po_id}
                  actions={actions}
                  size="sm"
                />
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  const supplierOptions = [
    { value: 'all', label: 'All suppliers' },
    ...(suppliersQuery.data ?? []).map((s) => ({
      value: String(s.supplier_id),
      label: s.company_name,
    })),
  ]

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Create and track supplier purchase orders"
        actions={
          <Link to="/manager/purchase-orders/new">
            <Button>
              <Plus className="h-4 w-4" />
              New PO
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SelectField
          placeholder="Filter by status"
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_OPTIONS}
          className="w-full sm:w-48"
        />
        <SelectField
          placeholder="Filter by supplier"
          value={supplierFilter}
          onValueChange={setSupplierFilter}
          options={supplierOptions}
          className="w-full sm:w-56"
        />
      </div>

      <DataTable
        columns={columns}
        data={posQuery.data ?? []}
        isLoading={posQuery.isLoading}
        searchPlaceholder="Search purchase orders…"
        exportCsv
        exportFilename="purchase-orders"
        emptyMessage="No purchase orders found."
      />
    </div>
  )
}
