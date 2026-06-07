import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  PoStatusActionBar,
  RandAmount,
  SelectField,
  StatusBadge,
  useToast,
} from '@/components'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { productService } from '@/services/product.service'
import { supplierService } from '@/services/supplier.service'
import { PO_STATUS_LABELS } from '@/lib/constants'
import {
  canCancelPo,
  canEditPoDetails,
  getManagerPoActions,
  getPoStatusHint,
} from '@/lib/poWorkflow'
import { toNumber } from '@/lib/utils'

const lineItemSchema = z.object({
  product_id: z.number().min(1, 'Product required'),
  qty_ordered: z.number().int().min(1, 'Qty must be at least 1'),
  unit_cost: z.number().min(0),
  line_total: z.number().min(0),
})

const poSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
})

type PoFormValues = z.infer<typeof poSchema>

export function PurchaseOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const poQuery = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getById(Number(id))
      return data.data
    },
    enabled: isEdit,
  })

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supplierService.getAll({ per_page: 100 })
      return data.data
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await productService.getAll({ per_page: 200 })
      return data.data
    },
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PoFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplier_id: 0,
      expected_date: '',
      notes: '',
      items: [{ product_id: 0, qty_ordered: 1, unit_cost: 0, line_total: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const supplierId = watch('supplier_id')

  const orderTotal = items.reduce((sum, item) => sum + toNumber(item.line_total), 0)

  useEffect(() => {
    if (!poQuery.data) return

    const po = poQuery.data
    const syncedItems = (po.items ?? []).map((item) => {
      const product = productsQuery.data?.find((p) => p.product_id === item.product_id)
      const unitCost = product ? toNumber(product.cost_price) : toNumber(item.unit_cost)
      const qty = toNumber(item.qty_ordered, 1)
      return {
        product_id: item.product_id,
        qty_ordered: qty,
        unit_cost: unitCost,
        line_total: qty * unitCost,
      }
    })

    reset({
      supplier_id: po.supplier_id,
      expected_date: po.expected_date?.slice(0, 10) ?? '',
      notes: po.notes ?? '',
      items: syncedItems.length > 0 ? syncedItems : [{ product_id: 0, qty_ordered: 1, unit_cost: 0, line_total: 0 }],
    })
  }, [poQuery.data, productsQuery.data, reset])

  const applyProductCost = (index: number, productId: number) => {
    const product = productsQuery.data?.find((p) => p.product_id === productId)
    if (!product) return

    const unitCost = toNumber(product.cost_price)
    setValue(`items.${index}.unit_cost`, unitCost)
    const qty = toNumber(items[index]?.qty_ordered, 1)
    setValue(`items.${index}.line_total`, qty * unitCost)
  }

  const updateLineTotal = (index: number) => {
    const qty = toNumber(items[index]?.qty_ordered, 1)
    const cost = toNumber(items[index]?.unit_cost)
    setValue(`items.${index}.line_total`, qty * cost)
  }

  const saveMutation = useMutation({
    mutationFn: async (values: PoFormValues) => {
      const payload = {
        ...values,
        expected_date: values.expected_date || undefined,
        notes: values.notes || undefined,
      }
      if (isEdit) {
        await purchaseOrderService.update(Number(id), payload)
      } else {
        await purchaseOrderService.create(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast({
        title: isEdit ? 'Purchase order updated' : 'Purchase order created',
        variant: 'success',
      })
      navigate('/manager/purchase-orders')
    },
    onError: () => toast({ title: 'Failed to save purchase order', variant: 'error' }),
  })

  const supplierOptions = (suppliersQuery.data ?? []).map((s) => ({
    value: String(s.supplier_id),
    label: s.company_name,
  }))

  const productOptions = (productsQuery.data ?? []).map((p) => ({
    value: String(p.product_id),
    label: p.name,
  }))

  if (isEdit && poQuery.isLoading) {
    return <div className="animate-pulse rounded-lg bg-gray-100 p-12" />
  }

  const poStatus = poQuery.data?.status
  const canEdit = !isEdit || (poStatus ? canEditPoDetails(poStatus) : true)
  const managerActions = poStatus ? getManagerPoActions(poStatus) : []
  const statusHint = poStatus ? getPoStatusHint(poStatus, 'manager') : ''

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
        subtitle={
          isEdit && poQuery.data
            ? `${poQuery.data.po_ref} · ${PO_STATUS_LABELS[poQuery.data.status]}`
            : 'Create a new supplier purchase order'
        }
        actions={
          <Link to="/manager/purchase-orders">
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      {isEdit && poQuery.data && (
        <Card className="mb-4 max-w-4xl">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <StatusBadge
                  status={poQuery.data.status}
                  label={PO_STATUS_LABELS[poQuery.data.status]}
                />
              </div>
              {statusHint && <p className="mt-2 text-sm text-gray-500">{statusHint}</p>}
            </div>
            <PoStatusActionBar
              poId={poQuery.data.po_id}
              actions={managerActions}
              showCancel={canCancelPo(poQuery.data.status)}
              onSuccess={() => poQuery.refetch()}
            />
          </CardContent>
        </Card>
      )}

      <Card className="max-w-4xl">
        <CardContent className="pt-6">
          <form
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Supplier"
                placeholder="Select supplier"
                value={supplierId ? String(supplierId) : undefined}
                onValueChange={(v) => setValue('supplier_id', Number(v), { shouldValidate: true })}
                options={supplierOptions}
                error={errors.supplier_id?.message}
                disabled={!canEdit}
              />
              <Input
                label="Expected Delivery Date"
                type="date"
                error={errors.expected_date?.message}
                disabled={!canEdit}
                {...register('expected_date')}
              />
            </div>

            <Input
              label="Notes"
              placeholder="Internal notes for this order"
              disabled={!canEdit}
              {...register('notes')}
            />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ product_id: 0, qty_ordered: 1, unit_cost: 0, line_total: 0 })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                  >
                    <SelectField
                      placeholder="Product"
                      value={
                        items[index]?.product_id
                          ? String(items[index].product_id)
                          : undefined
                      }
                      onValueChange={(v) => {
                        const productId = Number(v)
                        setValue(`items.${index}.product_id`, productId)
                        applyProductCost(index, productId)
                      }}
                      options={productOptions}
                      disabled={!canEdit}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      disabled={!canEdit}
                      {...register(`items.${index}.qty_ordered`, {
                        valueAsNumber: true,
                        onChange: () => updateLineTotal(index),
                      })}
                    />
                    <div className="flex h-10 flex-col justify-center">
                      <span className="text-xs font-medium text-gray-500">Unit cost</span>
                      <RandAmount
                        amount={items[index]?.unit_cost ?? 0}
                        className="text-sm font-medium text-gray-900"
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.unit_cost`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="flex h-10 items-center">
                      <RandAmount amount={items[index]?.line_total ?? 0} />
                    </div>
                    {canEdit && fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-danger-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.items?.message && (
                <p className="mt-2 text-xs text-danger-600">{errors.items.message}</p>
              )}
            </div>

            {isEdit && poQuery.data?.supplier_notes && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
                <p className="text-xs font-medium text-warning-800">Supplier notes</p>
                <p className="mt-1 text-sm text-warning-900">{poQuery.data.supplier_notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-600">
                Order Total: <RandAmount amount={orderTotal} className="font-semibold text-gray-900" />
              </div>
              <div className="flex gap-2">
                <Link to="/manager/purchase-orders">
                  <Button type="button" variant="outline">
                    Back
                  </Button>
                </Link>
                {canEdit && (
                  <Button type="submit" loading={saveMutation.isPending}>
                    {isEdit ? 'Save Changes' : 'Create PO'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
