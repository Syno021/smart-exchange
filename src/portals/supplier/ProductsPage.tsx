import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useSupplierProfile } from '@/portals/supplier/hooks/useSupplierProfile'
import { productService } from '@/services/product.service'
import type { Product } from '@/types/product.types'

export function ProductsPage() {
  const { data: supplier } = useSupplierProfile()

  const { data: products, isLoading } = useQuery({
    queryKey: ['supplier', 'products', supplier?.supplier_id],
    queryFn: async () => {
      const { data } = await productService.getAll({ per_page: 200 })
      return data.data.filter((p) => p.supplier_id === supplier!.supplier_id)
    },
    enabled: !!supplier,
  })

  const stats = useMemo(() => {
    const list = products ?? []
    return {
      total: list.length,
      active: list.filter((p) => p.is_active).length,
      lowStock: list.filter((p) => p.stock_qty <= p.reorder_level && p.stock_qty > 0).length,
    }
  }, [products])

  const columns: ColumnDef<Product>[] = [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'category_name', header: 'Category' },
    {
      accessorKey: 'cost_price',
      header: 'Cost',
      cell: ({ row }) => <RandAmount amount={row.original.cost_price} />,
    },
    {
      accessorKey: 'selling_price',
      header: 'Retail',
      cell: ({ row }) => <RandAmount amount={row.original.selling_price} />,
    },
    { accessorKey: 'stock_qty', header: 'Stock' },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.is_active ? 'active' : 'inactive'}
          label={row.original.is_active ? 'Active' : 'Inactive'}
        />
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Products Supplied"
        subtitle={`${stats.total} products · ${stats.active} active · ${stats.lowStock} low stock`}
      />

      {!isLoading && (products ?? []).length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products linked"
          description="Products assigned to your supplier account will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={products ?? []}
          isLoading={isLoading}
          searchPlaceholder="Search products…"
          exportCsv
          exportFilename="supplier-products"
          pageSize={15}
        />
      )}
    </div>
  )
}
