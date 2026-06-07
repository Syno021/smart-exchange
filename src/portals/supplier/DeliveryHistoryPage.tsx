import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Truck } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useSupplierProfile } from '@/portals/supplier/hooks/useSupplierProfile'
import { PO_STATUS_LABELS } from '@/lib/constants'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { formatDate, formatRand, toNumber } from '@/lib/utils'
import type { POStatus, PurchaseOrder } from '@/types/order.types'

const DELIVERY_STATUSES: POStatus[] = ['shipped', 'received']

export function DeliveryHistoryPage() {
  const { data: supplier } = useSupplierProfile()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['supplier', 'deliveries', supplier?.supplier_id],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getAll({ per_page: 100 })
      return data.data.filter((po) => DELIVERY_STATUSES.includes(po.status))
    },
    enabled: !!supplier,
  })

  const totalDelivered = useMemo(
    () => (orders ?? []).reduce((s, o) => s + toNumber(o.total_amt), 0),
    [orders],
  )

  const receivedCount = useMemo(
    () => (orders ?? []).filter((o) => o.status === 'received').length,
    [orders],
  )

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
      id: 'delivery_date',
      header: 'Delivery Date',
      cell: ({ row }) => {
        const po = row.original
        if (po.received_date) {
          return formatDate(po.received_date, 'dd MMM yyyy')
        }
        if (po.expected_date) {
          return formatDate(po.expected_date, 'dd MMM yyyy')
        }
        return formatDate(po.updated_at, 'dd MMM yyyy')
      },
    },
    {
      accessorKey: 'total_amt',
      header: 'Value',
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

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Delivery History"
        subtitle={`${orders?.length ?? 0} deliveries · ${receivedCount} received · ${formatRand(totalDelivered)} total`}
      />

      {!isLoading && (orders ?? []).length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No deliveries recorded"
          description="Purchase orders you have shipped or that have been received will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders ?? []}
          isLoading={isLoading}
          searchPlaceholder="Search deliveries…"
          exportCsv
          exportFilename="delivery-history"
          pageSize={10}
        />
      )}
    </div>
  )
}
