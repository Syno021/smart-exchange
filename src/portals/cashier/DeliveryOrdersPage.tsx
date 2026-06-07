import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AxiosError } from 'axios'
import { MapPin, PackageCheck, Truck } from 'lucide-react'
import {
  Button,
  DataTable,
  EmptyState,
  PageHeader,
  RandAmount,
  StatusBadge,
  useToast,
} from '@/components'
import { saleService } from '@/services/sale.service'
import { SALE_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Sale } from '@/types/sale.types'
import type { ApiResponse } from '@/types/api.types'

export function DeliveryOrdersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const ordersQuery = useQuery({
    queryKey: ['sales', 'delivery-queue'],
    queryFn: async () => {
      const { data } = await saleService.getAll({ per_page: 100, delivery_queue: 1 })
      return data.data
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] })
  }

  const dispatchMutation = useMutation({
    mutationFn: (saleId: number) => saleService.dispatchDelivery(saleId),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Order sent out for delivery', variant: 'success' })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: err.response?.data?.message ?? 'Failed to dispatch order',
        variant: 'error',
      })
    },
  })

  const deliverMutation = useMutation({
    mutationFn: (saleId: number) => saleService.markDelivered(saleId),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Order marked as delivered — customer notified', variant: 'success' })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: err.response?.data?.message ?? 'Failed to mark order delivered',
        variant: 'error',
      })
    },
  })

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'sale_ref',
      header: 'Order Ref',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.sale_ref}</span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => row.original.customer_name ?? 'Customer',
    },
    {
      id: 'delivery',
      header: 'Delivery Address',
      cell: ({ row }) => (
        <div className="max-w-xs text-sm text-gray-600">
          <p>{row.original.delivery_address}</p>
          {row.original.delivery_phone && (
            <p className="mt-0.5 text-xs text-gray-400">{row.original.delivery_phone}</p>
          )}
        </div>
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
    {
      accessorKey: 'created_at',
      header: 'Ordered',
      cell: ({ row }) => formatDate(row.original.created_at, 'dd MMM yyyy HH:mm'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original
        const isPending = order.status === 'pending'
        const isOut = order.status === 'out_for_delivery'
        const busy =
          dispatchMutation.isPending || deliverMutation.isPending

        return (
          <div className="flex flex-wrap gap-2">
            {isPending && (
              <Button
                size="sm"
                loading={dispatchMutation.isPending}
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Send ${order.sale_ref} out for delivery?`)) {
                    dispatchMutation.mutate(order.sale_id)
                  }
                }}
              >
                <Truck className="h-4 w-4" />
                Send for Delivery
              </Button>
            )}
            {isOut && (
              <Button
                size="sm"
                variant="secondary"
                loading={deliverMutation.isPending}
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Mark ${order.sale_ref} as delivered?`)) {
                    deliverMutation.mutate(order.sale_id)
                  }
                }}
              >
                <PackageCheck className="h-4 w-4" />
                Mark Delivered
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const orders = ordersQuery.data ?? []
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const outCount = orders.filter((o) => o.status === 'out_for_delivery').length

  return (
    <div>
      <PageHeader
        title="Delivery Orders"
        subtitle={`${pendingCount} awaiting dispatch · ${outCount} out for delivery`}
      />

      {!ordersQuery.isLoading && orders.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No delivery orders"
          description="Online customer orders waiting for delivery will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          isLoading={ordersQuery.isLoading}
          searchPlaceholder="Search orders…"
          pageSize={10}
          emptyMessage="No delivery orders in the queue."
        />
      )}
    </div>
  )
}
