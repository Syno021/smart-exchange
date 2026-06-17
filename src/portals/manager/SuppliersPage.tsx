import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageHeader,
  StatusBadge,
  useToast,
  type ColumnDef,
} from '@/components'
import { supplierService } from '@/services/supplier.service'
import { formatDate } from '@/lib/utils'
import { emailOptionalSchema, phoneOptionalSchema } from '@/lib/validation'
import type { Supplier } from '@/types/supplier.types'

const supplierSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  contact_name: z.string().max(100).optional(),
  phone: phoneOptionalSchema,
  email: emailOptionalSchema,
  address: z.string().max(255).optional(),
  tax_number: z.string().max(50).optional(),
  payment_terms: z.string().max(100).optional(),
  is_active: z.boolean(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

export function SuppliersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supplierService.getAll({ per_page: 200 })
      return data.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      company_name: '',
      is_active: true,
    },
  })

  const openCreate = () => {
    setEditingSupplier(null)
    reset({ company_name: '', is_active: true })
    setModalOpen(true)
  }

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    reset({
      company_name: supplier.company_name,
      contact_name: supplier.contact_name ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      tax_number: supplier.tax_number ?? '',
      payment_terms: supplier.payment_terms ?? '',
      is_active: supplier.is_active,
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (values: SupplierFormValues) => {
      const payload = {
        ...values,
        contact_name: values.contact_name || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        tax_number: values.tax_number || undefined,
        payment_terms: values.payment_terms || undefined,
      }
      if (editingSupplier) {
        await supplierService.update(editingSupplier.supplier_id, payload)
      } else {
        await supplierService.create(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: editingSupplier ? 'Supplier updated' : 'Supplier created',
        variant: 'success',
      })
      setModalOpen(false)
      setEditingSupplier(null)
    },
    onError: () => toast({ title: 'Failed to save supplier', variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({ title: 'Supplier deleted', variant: 'success' })
      setDeleteTarget(null)
    },
    onError: () => toast({ title: 'Failed to delete supplier', variant: 'error' }),
  })

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'company_name',
        header: 'Company',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.company_name}</p>
            {row.original.contact_name && (
              <p className="text-xs text-gray-500">{row.original.contact_name}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.phone ?? '—',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email ?? '—',
      },
      {
        accessorKey: 'payment_terms',
        header: 'Payment Terms',
        cell: ({ row }) => row.original.payment_terms ?? '—',
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
        accessorKey: 'created_at',
        header: 'Added',
        cell: ({ row }) => formatDate(row.original.created_at, 'dd MMM yyyy'),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => openEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
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

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier contacts and payment terms"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={suppliersQuery.data ?? []}
        isLoading={suppliersQuery.isLoading}
        searchPlaceholder="Search suppliers…"
        exportCsv
        exportFilename="suppliers"
        emptyMessage="No suppliers found."
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        className="max-w-lg"
      >
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <Input
            label="Company Name"
            error={errors.company_name?.message}
            {...register('company_name')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact Name" {...register('contact_name')} />
            <Input label="Phone" {...register('phone')} />
          </div>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Address" {...register('address')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tax Number" {...register('tax_number')} />
            <Input label="Payment Terms" placeholder="e.g. Net 30" {...register('payment_terms')} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" {...register('is_active')} />
            Active supplier
          </label>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete supplier"
        description={`Are you sure you want to delete "${deleteTarget?.company_name}"? This supplier will be removed from active lists.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.supplier_id)}
      />
    </div>
  )
}
