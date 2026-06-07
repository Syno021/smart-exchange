import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  PageHeader,
  RoleBadge,
  SelectField,
  StatusBadge,
  useToast,
  type ColumnDef,
} from '@/components'
import { useDebounce } from '@/hooks/useDebounce'
import { ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { userService } from '@/services/user.service'
import type { ApiResponse } from '@/types/api.types'
import type { User, UserFormData } from '@/types/user.types'
import type { UserRole } from '@/types/auth.types'
import { UserFormModal } from './UserFormModal'

const USERS_KEY = ['admin', 'users'] as const

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All roles' },
  ...(Object.keys(ROLES) as UserRole[]).map((role) => ({
    value: role,
    label: ROLES[role].label,
  })),
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const SORT_OPTIONS = [
  { value: 'full_name:ASC', label: 'Name (A–Z)' },
  { value: 'full_name:DESC', label: 'Name (Z–A)' },
  { value: 'username:ASC', label: 'Username (A–Z)' },
  { value: 'role:ASC', label: 'Role' },
  { value: 'created_at:DESC', label: 'Newest first' },
  { value: 'created_at:ASC', label: 'Oldest first' },
  { value: 'last_login:DESC', label: 'Last login (recent)' },
  { value: 'is_active:DESC', label: 'Active first' },
]

export function UserManagementPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('full_name:ASC')

  const debouncedSearch = useDebounce(search)

  const [sortBy, sortDir] = sort.split(':') as [string, 'ASC' | 'DESC']

  const queryParams = useMemo(
    () => ({
      per_page: 100,
      search: debouncedSearch || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      is_active: statusFilter !== 'all' ? Number(statusFilter) : undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
    [debouncedSearch, roleFilter, statusFilter, sortBy, sortDir]
  )

  const usersQuery = useQuery({
    queryKey: [...USERS_KEY, queryParams],
    queryFn: async () => {
      const { data } = await userService.getAll(queryParams)
      return data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users-count'] })
      setModalOpen(false)
      toast({ title: 'User created', variant: 'success' })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: 'Failed to create user',
        description: err.response?.data?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof userService.update>[1] }) =>
      userService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      setModalOpen(false)
      setEditingUser(null)
      toast({ title: 'User updated', variant: 'success' })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: 'Failed to update user',
        description: err.response?.data?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users-count'] })
      setDeleteTarget(null)
      toast({ title: 'User deactivated', variant: 'success' })
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: 'Failed to deactivate user',
        description: err.response?.data?.message ?? 'Please try again.',
        variant: 'error',
      })
    },
  })

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.full_name}</p>
          <p className="text-xs text-gray-500">@{row.original.username}</p>
        </div>
      ),
    },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
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
    {
      accessorKey: 'last_login',
      header: 'Last Login',
      cell: ({ row }) =>
        row.original.last_login ? formatDate(row.original.last_login, 'dd MMM yyyy') : '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingUser(row.original)
              setModalOpen(true)
            }}
            aria-label={`Edit ${row.original.full_name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {row.original.is_active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={`Deactivate ${row.original.full_name}`}
            >
              <Trash2 className="h-4 w-4 text-danger-600" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const handleFormSubmit = (values: UserFormData) => {
    if (editingUser) {
      const payload: Partial<UserFormData> = { ...values }
      if (!payload.password) delete payload.password
      updateMutation.mutate({ id: editingUser.user_id, payload })
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create, edit, and assign roles to system users"
        actions={
          <Button
            onClick={() => {
              setEditingUser(null)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input
          label="Search"
          placeholder="Name, username, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px]"
        />
        <SelectField
          label="Role"
          value={roleFilter}
          onValueChange={setRoleFilter}
          options={ROLE_FILTER_OPTIONS}
          className="min-w-[160px]"
        />
        <SelectField
          label="Status"
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          className="min-w-[160px]"
        />
        <SelectField
          label="Sort by"
          value={sort}
          onValueChange={setSort}
          options={SORT_OPTIONS}
          className="min-w-[180px]"
        />
      </div>

      <DataTable
        columns={columns}
        data={usersQuery.data ?? []}
        isLoading={usersQuery.isLoading}
        searchable={false}
        exportCsv
        exportFilename="users"
        emptyMessage="No users found."
      />

      <UserFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Deactivate User"
        description={
          deleteTarget
            ? `Deactivate ${deleteTarget.full_name}? They will no longer be able to sign in.`
            : undefined
        }
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.user_id)}
      />
    </div>
  )
}
