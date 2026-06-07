import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  PoStatusActionBar,
  invalidatePurchaseOrderQueries,
} from '@/components/shared/PoStatusActionBar'
import { RandAmount } from '@/components/shared/RandAmount'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { PO_STATUS_LABELS } from '@/lib/constants'
import {
  canSupplierAddNotes,
  getPoStatusHint,
  getSupplierPoActions,
} from '@/lib/poWorkflow'
import { formatDate } from '@/lib/utils'
import type { POItem } from '@/types/order.types'
import type { ApiResponse } from '@/types/api.types'
import { ClipboardList } from 'lucide-react'

export function PODetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [supplierNotes, setSupplierNotes] = useState('')

  const { data: po, isLoading, isError, refetch } = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getById(Number(id))
      return data.data
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (po?.supplier_notes) {
      setSupplierNotes(po.supplier_notes)
    }
  }, [po?.supplier_notes])

  const notesMutation = useMutation({
    mutationFn: () =>
      purchaseOrderService.update(Number(id), { supplier_notes: supplierNotes.trim() || undefined }),
    onSuccess: () => {
      invalidatePurchaseOrderQueries(queryClient, Number(id))
      refetch()
    },
  })

  const itemColumns: ColumnDef<POItem>[] = [
    { accessorKey: 'product_name', header: 'Product' },
    { accessorKey: 'qty_ordered', header: 'Qty Ordered' },
    { accessorKey: 'qty_received', header: 'Qty Received' },
    {
      accessorKey: 'unit_cost',
      header: 'Unit Cost',
      cell: ({ row }) => <RandAmount amount={row.original.unit_cost} />,
    },
    {
      accessorKey: 'line_total',
      header: 'Line Total',
      cell: ({ row }) => <RandAmount amount={row.original.line_total} />,
    },
  ]

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (isError || !po) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={ClipboardList}
          title="Purchase order not found"
          action={
            <Link to="/supplier/orders">
              <Button>Back to orders</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const supplierActions = getSupplierPoActions(po.status)
  const statusHint = getPoStatusHint(po.status, 'supplier')
  const notesChanged = supplierNotes.trim() !== (po.supplier_notes ?? '').trim()

  return (
    <div className="p-4 sm:p-6">
      <Link
        to="/supplier/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{po.po_ref}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={po.status} label={PO_STATUS_LABELS[po.status]} />
            <span className="text-sm text-gray-500">Created {formatDate(po.created_at)}</span>
          </div>
          {statusHint && <p className="mt-2 text-sm text-gray-500">{statusHint}</p>}
        </div>
        <PoStatusActionBar
          poId={po.po_id}
          actions={supplierActions}
          onSuccess={() => refetch()}
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <RandAmount amount={po.total_amt} className="text-xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Expected Date</p>
            <p className="font-medium text-gray-900">
              {po.expected_date ? formatDate(po.expected_date, 'dd MMM yyyy') : 'Not set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Created By</p>
            <p className="font-medium text-gray-900">{po.creator_name ?? 'Store manager'}</p>
          </CardContent>
        </Card>
      </div>

      {po.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Store Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {canSupplierAddNotes(po.status) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Supplier Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              placeholder="Delivery reference, dispatch details, or questions for the store…"
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                loading={notesMutation.isPending}
                disabled={!notesChanged}
                onClick={() => notesMutation.mutate()}
              >
                Save Notes
              </Button>
              {notesMutation.isSuccess && (
                <span className="text-sm text-brand-700">Notes saved.</span>
              )}
              {notesMutation.isError && (
                <span className="text-sm text-danger-600">
                  {(notesMutation.error as AxiosError<ApiResponse<unknown>>).response?.data
                    ?.message ?? 'Failed to save notes.'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={itemColumns}
            data={po.items ?? []}
            searchable={false}
            pageSize={20}
          />
        </CardContent>
      </Card>
    </div>
  )
}
