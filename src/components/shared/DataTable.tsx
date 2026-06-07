import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { cn } from '@/lib/utils'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  exportCsv?: boolean
  exportFilename?: string
  pageSize?: number
  emptyMessage?: string
  className?: string
}

function getColumnKey<TData>(col: ColumnDef<TData, unknown>): string {
  if ('accessorKey' in col && col.accessorKey) return String(col.accessorKey)
  if ('id' in col && col.id) return col.id
  return ''
}

function exportToCsv<TData>(
  data: TData[],
  columns: ColumnDef<TData, unknown>[],
  filename: string
) {
  const exportableColumns = columns.filter((col) => {
    const key = getColumnKey(col)
    return key && key !== 'actions'
  })

  const headers = exportableColumns.map((col) => {
    const header = col.header
    if (typeof header === 'string') return header
    return getColumnKey(col)
  })

  const rows = data.map((row) =>
    exportableColumns.map((col) => {
      const key = getColumnKey(col) as keyof TData
      const value = row[key]
      const str = value == null ? '' : String(value)
      return `"${str.replace(/"/g, '""')}"`
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  exportCsv = false,
  exportFilename = 'export',
  pageSize = 10,
  emptyMessage = 'No results found.',
  className,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const columnCount = columns.length

  if (isLoading) {
    return <SkeletonTable rows={pageSize} columns={Math.min(columnCount, 6)} className={className} />
  }

  return (
    <div className={cn('space-y-4', className)}>
      {(searchable || exportCsv) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={globalFilter}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filteredCount} {filteredCount === 1 ? 'row' : 'rows'}
            </span>
            {exportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCsv(
                    table.getFilteredRowModel().rows.map((r) => r.original),
                    columns,
                    exportFilename
                  )
                }
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-100 bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
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

export type { ColumnDef }
