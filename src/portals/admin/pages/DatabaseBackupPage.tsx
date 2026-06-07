import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, Download, HardDrive, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AxiosError } from 'axios'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  useToast,
  type ColumnDef,
} from '@/components'
import { formatDate } from '@/lib/utils'
import { backupService } from '@/services/backup.service'
import type { ApiResponse, BackupEntry } from '@/types/api.types'

const BACKUP_KEY = ['admin', 'backups'] as const

function formatBytes(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function DatabaseBackupPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<BackupEntry | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const historyQuery = useQuery({
    queryKey: BACKUP_KEY,
    queryFn: async () => {
      const { data } = await backupService.getHistory({ per_page: 50 })
      return data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: () => backupService.create(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: BACKUP_KEY })
      const result = res.data.data
      toast({
        title: result.status === 'failed' ? 'Backup logged with warnings' : 'Backup created',
        description: result.message ?? result.filename,
        variant: result.status === 'failed' ? 'warning' : 'success',
      })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: 'Backup failed',
        description: err.response?.data?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backupService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKUP_KEY })
      setDeleteTarget(null)
      toast({ title: 'Backup deleted', variant: 'success' })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: 'Failed to delete backup',
        description: err.response?.data?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const handleDownload = async (backup: BackupEntry) => {
    if (backup.status !== 'success') {
      toast({
        title: 'Download unavailable',
        description: 'This backup did not complete successfully.',
        variant: 'warning',
      })
      return
    }

    setDownloadingId(backup.backup_id)
    try {
      await backupService.download(backup.backup_id, backup.filename)
      toast({ title: 'Download started', description: backup.filename, variant: 'success' })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      toast({
        title: 'Download failed',
        description: axiosErr.response?.data?.message ?? 'Could not download backup file.',
        variant: 'error',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const columns: ColumnDef<BackupEntry>[] = [
    { accessorKey: 'filename', header: 'Filename' },
    {
      accessorKey: 'size_bytes',
      header: 'Size',
      cell: ({ row }) => formatBytes(row.original.size_bytes),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'creator_name',
      header: 'Created By',
      cell: ({ row }) =>
        row.original.creator_name ??
        (row.original as BackupEntry & { created_by_name?: string }).created_by_name ??
        '—',
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(row.original)}
            loading={downloadingId === row.original.backup_id}
            disabled={row.original.status !== 'success'}
            aria-label={`Download ${row.original.filename}`}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row.original)}
            aria-label={`Delete ${row.original.filename}`}
          >
            <Trash2 className="h-4 w-4 text-danger-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Database Backup"
        subtitle="Create, download, and manage database backup snapshots"
        actions={
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
            <Database className="h-4 w-4" />
            Create Backup
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-brand-600" />
            Backup Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Backups are stored server-side as SQL dumps. You can download successful backups or
            delete old ones to free disk space. Creating a backup logs the operation in the audit
            trail.
          </p>
        </CardContent>
      </Card>

      {historyQuery.data?.length === 0 && !historyQuery.isLoading ? (
        <EmptyState
          icon={Database}
          title="No backups yet"
          description="Create your first database backup to get started."
          action={
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
              Create Backup
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={historyQuery.data ?? []}
          isLoading={historyQuery.isLoading}
          searchable={false}
          emptyMessage="No backup history found."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Backup"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.filename}"? This removes the file from the server and cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.backup_id)}
      />
    </div>
  )
}
