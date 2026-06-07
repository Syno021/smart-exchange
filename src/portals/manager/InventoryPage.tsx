import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  DataTable,
  Modal,
  PageHeader,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  type ColumnDef,
} from '@/components'
import { stockService } from '@/services/stock.service'
import { productService } from '@/services/product.service'
import type { Product } from '@/types/product.types'

const adjustSchema = z.object({
  qty_change: z.number().int().refine((v) => v !== 0, 'Quantity change cannot be zero'),
  note: z.string().optional(),
})

type AdjustFormValues = z.infer<typeof adjustSchema>

type StockFilter = 'active' | 'low' | 'out'

export function InventoryPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StockFilter>('active')
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)

  const productsQuery = useQuery({
    queryKey: ['products', 'inventory', statusFilter],
    queryFn: async () => {
      const { data } = await productService.getAll({ per_page: 200, status: statusFilter })
      return data.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { qty_change: 0, note: '' },
  })

  const adjustMutation = useMutation({
    mutationFn: (values: AdjustFormValues) =>
      stockService.adjust({
        product_id: adjustProduct!.product_id,
        qty_change: values.qty_change,
        note: values.note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Stock adjusted', variant: 'success' })
      setAdjustProduct(null)
      reset()
    },
    onError: () => {
      toast({ title: 'Failed to adjust stock', variant: 'error' })
    },
  })

  const openAdjust = (product: Product) => {
    setAdjustProduct(product)
    reset({ qty_change: 0, note: '' })
  }

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            <p className="text-xs text-gray-500">{row.original.category_name}</p>
          </div>
        ),
      },
      {
        accessorKey: 'stock_qty',
        header: 'Current Stock',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.stock_qty} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: 'reorder_level',
        header: 'Reorder Level',
        cell: ({ row }) => (
          <span className="font-mono text-gray-600">{row.original.reorder_level}</span>
        ),
      },
      {
        accessorKey: 'max_stock',
        header: 'Max Stock',
        cell: ({ row }) => (
          <span className="font-mono text-gray-600">{row.original.max_stock}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { stock_qty, reorder_level } = row.original
          const status =
            stock_qty <= 0 ? 'out' : stock_qty <= reorder_level ? 'low' : 'active'
          return <StatusBadge status={status} />
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => openAdjust(row.original)}>
            <SlidersHorizontal className="h-4 w-4" />
            Adjust
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Monitor stock levels and adjust quantities"
      />

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StockFilter)}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="out">Out of Stock</TabsTrigger>
        </TabsList>
        <TabsContent value={statusFilter}>
          <DataTable
            columns={columns}
            data={productsQuery.data ?? []}
            isLoading={productsQuery.isLoading}
            searchPlaceholder="Search inventory…"
            emptyMessage={`No ${statusFilter === 'low' ? 'low stock' : statusFilter === 'out' ? 'out of stock' : 'active'} products found.`}
          />
        </TabsContent>
      </Tabs>

      <Modal
        open={!!adjustProduct}
        onOpenChange={(open) => !open && setAdjustProduct(null)}
        title="Adjust Stock"
        description={
          adjustProduct
            ? `${adjustProduct.name} — current: ${adjustProduct.stock_qty} ${adjustProduct.unit}`
            : undefined
        }
      >
        <form
          onSubmit={handleSubmit((values) => adjustMutation.mutate(values))}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Quantity Change</label>
            <input
              type="number"
              className="mt-1.5 flex h-10 w-full rounded border border-gray-200 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              placeholder="Use negative to reduce, positive to add"
              {...register('qty_change', { valueAsNumber: true })}
            />
            {errors.qty_change && (
              <p className="mt-1 text-xs text-danger-600">{errors.qty_change.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Note (optional)</label>
            <input
              type="text"
              className="mt-1.5 flex h-10 w-full rounded border border-gray-200 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              placeholder="Reason for adjustment"
              {...register('note')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAdjustProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={adjustMutation.isPending}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
