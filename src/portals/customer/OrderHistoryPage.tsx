import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useCustomerProfile } from '@/portals/customer/hooks/useCustomerProfile'
import { customerService } from '@/services/customer.service'
import { formatDate } from '@/lib/utils'
import type { Sale } from '@/types/sale.types'
import { SALE_STATUS_LABELS } from '@/lib/constants'

export function OrderHistoryPage() {
  const { data: customer, isLoading: profileLoading } = useCustomerProfile()

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer', 'orders', customer?.customer_id],
    queryFn: async () => {
      if (!customer) return []
      const { data } = await customerService.getOrders(customer.customer_id, { per_page: 50 })
      return data.data
    },
    enabled: !!customer,
  })

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'sale_ref',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.sale_ref}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.created_at, 'dd MMM yyyy'),
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
    {
      id: 'delivery',
      header: 'Delivery',
      cell: ({ row }) =>
        row.original.delivery_address ? (
          <span className="text-xs text-gray-500">{row.original.delivery_address}</span>
        ) : (
          <span className="text-xs text-gray-400">In-store</span>
        ),
    },
  ]

  const isLoading = profileLoading || ordersLoading

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Order History" subtitle="Track your purchases and delivery orders" />

      {!isLoading && (orders ?? []).length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Your order history will appear here once you make a purchase."
          action={
            <Link to="/shop/browse">
              <span className="inline-flex h-10 items-center rounded bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
                Start Shopping
              </span>
            </Link>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders ?? []}
          isLoading={isLoading}
          searchable={false}
          pageSize={10}
          emptyMessage="No orders found."
        />
      )}
    </div>
  )
}
