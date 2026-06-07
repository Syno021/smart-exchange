import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  ConfirmDialog,
  DataTable,
  PageHeader,
  RandAmount,
  SelectField,
  StatusBadge,
  useToast,
  type ColumnDef,
} from '@/components'
import { useDebounce } from '@/hooks/useDebounce'
import { productService } from '@/services/product.service'
import { calcMargin } from '@/lib/utils'
import type { Product } from '@/types/product.types'

export function ProductsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const debouncedSearch = useDebounce(search)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await productService.getCategories()
      return data.data
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products', { search: debouncedSearch, category_id: categoryFilter }],
    queryFn: async () => {
      const { data } = await productService.getAll({
        per_page: 200,
        search: debouncedSearch || undefined,
        category_id: categoryFilter !== 'all' ? Number(categoryFilter) : undefined,
      })
      return data.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Product deleted', variant: 'success' })
      setDeleteTarget(null)
    },
    onError: () => {
      toast({ title: 'Failed to delete product', variant: 'error' })
    },
  })

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            {row.original.sku && (
              <p className="text-xs text-gray-500">{row.original.sku}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'category_name',
        header: 'Category',
        cell: ({ row }) => row.original.category_name ?? '—',
      },
      {
        accessorKey: 'selling_price',
        header: 'Price',
        cell: ({ row }) => <RandAmount amount={row.original.selling_price} />,
      },
      {
        id: 'margin',
        header: 'Margin',
        cell: ({ row }) => {
          const margin = calcMargin(row.original.cost_price, row.original.selling_price)
          return <span className="font-mono text-sm">{margin.toFixed(1)}%</span>
        },
      },
      {
        accessorKey: 'stock_qty',
        header: 'Stock',
        cell: ({ row }) => {
          const { stock_qty, reorder_level, is_active } = row.original
          let status = 'active'
          if (!is_active) status = 'inactive'
          else if (stock_qty <= 0) status = 'out'
          else if (stock_qty <= reorder_level) status = 'low'
          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{stock_qty}</span>
              <StatusBadge status={status} />
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Link to={`/manager/products/${row.original.product_id}/edit`}>
              <Button variant="ghost" size="sm" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4 text-danger-600" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const categoryOptions = (categoriesQuery.data ?? []).map((c) => ({
    value: String(c.category_id),
    label: c.name,
  }))

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage product catalogue, pricing, and stock levels"
        actions={
          <Link to="/manager/products/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="h-10 max-w-sm flex-1 rounded border border-gray-200 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
        <SelectField
          placeholder="All categories"
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          options={[{ value: 'all', label: 'All categories' }, ...categoryOptions]}
          className="w-full sm:w-48"
        />
      </div>

      <DataTable
        columns={columns}
        data={productsQuery.data ?? []}
        isLoading={productsQuery.isLoading}
        searchable={false}
        exportCsv
        exportFilename="products"
        emptyMessage="No products found."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.product_id)}
      />
    </div>
  )
}
