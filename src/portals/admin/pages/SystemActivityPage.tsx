import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  DataTable,
  Input,
  PageHeader,
  SelectField,
  type ColumnDef,
} from '@/components'
import { formatDate } from '@/lib/utils'
import { todayIso } from '@/lib/validation'
import { auditService } from '@/services/audit.service'
import type { AuditLogEntry } from '@/types/api.types'

const PER_PAGE = 20
const POLL_INTERVAL = 5000

export function SystemActivityPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filterOptionsQuery = useQuery({
    queryKey: ['admin', 'audit-log', 'filters'],
    queryFn: async () => {
      const { data } = await auditService.getFilterOptions()
      return data.data
    },
  })

  const queryParams = useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      module: moduleFilter !== 'all' ? moduleFilter : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [page, actionFilter, moduleFilter, dateFrom, dateTo]
  )

  const auditQuery = useQuery({
    queryKey: ['admin', 'audit-log', queryParams],
    queryFn: async () => {
      const { data } = await auditService.getAll(queryParams)
      return data
    },
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
  })

  const actionOptions = useMemo(
    () => [
      { value: 'all', label: 'All actions' },
      ...(filterOptionsQuery.data?.actions ?? []).map((action) => ({
        value: action,
        label: action,
      })),
    ],
    [filterOptionsQuery.data]
  )

  const moduleOptions = useMemo(
    () => [
      { value: 'all', label: 'All modules' },
      ...(filterOptionsQuery.data?.modules ?? []).map((module) => ({
        value: module,
        label: module,
      })),
    ],
    [filterOptionsQuery.data]
  )

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      accessorKey: 'user_name',
      header: 'User',
      cell: ({ row }) => row.original.user_name ?? 'System',
    },
    { accessorKey: 'action', header: 'Action' },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => row.original.module ?? row.original.target_table ?? '—',
    },
    {
      accessorKey: 'target_id',
      header: 'Target ID',
      cell: ({ row }) => row.original.target_id ?? '—',
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: ({ row }) => row.original.ip_address ?? '—',
    },
  ]

  const pagination = auditQuery.data?.pagination
  const logs = auditQuery.data?.data ?? []

  const resetFilters = () => {
    setActionFilter('all')
    setModuleFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="System Activity"
        subtitle="Live audit trail of database actions across the platform"
        actions={
          <div className="flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
            <Radio className="h-3 w-3 animate-pulse" />
            Live · refreshes every {POLL_INTERVAL / 1000}s
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SelectField
          label="Action"
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v)
            setPage(1)
          }}
          options={actionOptions}
        />
        <SelectField
          label="Module"
          value={moduleFilter}
          onValueChange={(v) => {
            setModuleFilter(v)
            setPage(1)
          }}
          options={moduleOptions}
        />
        <Input
          label="From"
          type="date"
          value={dateFrom}
          max={todayIso()}
          onChange={(e) => {
            setDateFrom(e.target.value)
            setPage(1)
          }}
          className="w-auto min-w-[160px]"
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          max={todayIso()}
          onChange={(e) => {
            setDateTo(e.target.value)
            setPage(1)
          }}
          className="w-auto min-w-[160px]"
        />
        <Button variant="outline" size="sm" onClick={resetFilters} className="mb-0.5">
          Clear filters
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={auditQuery.isLoading}
        searchable={false}
        pageSize={PER_PAGE}
        emptyMessage="No audit log entries found."
      />

      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.last_page} · {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || auditQuery.isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.last_page || auditQuery.isFetching}
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
