import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  SelectField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@/components'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { stockService } from '@/services/stock.service'
import { productService } from '@/services/product.service'
import { PO_STATUS_LABELS } from '@/lib/constants'

const manualItemSchema = z.object({
  product_id: z.number().min(1, 'Product is required'),
  qty_received: z.number().int().min(1, 'Qty must be at least 1'),
})

const manualSchema = z.object({
  note: z.string().optional(),
  items: z.array(manualItemSchema).min(1, 'Add at least one item'),
})

const poReceiveSchema = z.object({
  po_id: z.number().min(1, 'Purchase order is required'),
  items: z.array(
    z.object({
      po_item_id: z.number().optional(),
      product_id: z.number(),
      qty_received: z.number().int().min(0),
    }),
  ),
})

type ManualFormValues = z.infer<typeof manualSchema>
type PoReceiveFormValues = z.infer<typeof poReceiveSchema>

export function StockReceivingPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'po' | 'manual'>('po')
  const [selectedPoId, setSelectedPoId] = useState('')

  const posQuery = useQuery({
    queryKey: ['purchase-orders', 'receivable'],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getAll({
        per_page: 100,
        status: 'shipped',
      })
      return data.data
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data } = await productService.getAll({ per_page: 200 })
      return data.data
    },
  })

  const poDetailQuery = useQuery({
    queryKey: ['purchase-orders', selectedPoId],
    queryFn: async () => {
      const { data } = await purchaseOrderService.getById(Number(selectedPoId))
      return data.data
    },
    enabled: !!selectedPoId,
  })

  const manualForm = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: { note: '', items: [{ product_id: 0, qty_received: 1 }] },
  })

  const poForm = useForm<PoReceiveFormValues>({
    resolver: zodResolver(poReceiveSchema),
    defaultValues: { po_id: 0, items: [] },
  })

  const manualFields = useFieldArray({ control: manualForm.control, name: 'items' })

  const manualMutation = useMutation({
    mutationFn: async (values: ManualFormValues) => {
      for (const item of values.items) {
        await stockService.adjust({
          product_id: item.product_id,
          qty_change: item.qty_received,
          note: values.note || 'Manual stock receive',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Stock received (manual)', variant: 'success' })
      manualForm.reset({ note: '', items: [{ product_id: 0, qty_received: 1 }] })
    },
    onError: () => toast({ title: 'Failed to receive stock', variant: 'error' }),
  })

  const poMutation = useMutation({
    mutationFn: (values: PoReceiveFormValues) =>
      stockService.receive({
        po_id: values.po_id,
        items: values.items.filter((i) => i.qty_received > 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast({ title: 'Stock received against PO', variant: 'success' })
      setSelectedPoId('')
      poForm.reset()
    },
    onError: () => toast({ title: 'Failed to receive against PO', variant: 'error' }),
  })

  const handlePoSelect = (poId: string) => {
    setSelectedPoId(poId)
    poForm.setValue('po_id', Number(poId))
  }

  const productOptions = (productsQuery.data ?? []).map((p) => ({
    value: String(p.product_id),
    label: `${p.name} (${p.stock_qty} in stock)`,
  }))

  const poOptions = (posQuery.data ?? []).map((po) => ({
    value: String(po.po_id),
    label: `${po.po_ref} — ${po.supplier_name ?? 'Supplier'} (${PO_STATUS_LABELS[po.status]})`,
  }))

  const handlePoReceive = () => {
    if (!poDetailQuery.data?.items) return
    const items = poDetailQuery.data.items
      .map((item) => ({
        po_item_id: item.po_item_id,
        product_id: item.product_id,
        qty_received: item.qty_ordered - item.qty_received,
      }))
      .filter((item) => item.qty_received > 0)
    poForm.setValue('items', items)
    poMutation.mutate({ po_id: Number(selectedPoId), items })
  }

  return (
    <div>
      <PageHeader
        title="Stock Receiving"
        subtitle="Receive stock against a purchase order or enter manually"
      />

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'po' | 'manual')}>
        <TabsList>
          <TabsTrigger value="po">Against Purchase Order</TabsTrigger>
          <TabsTrigger value="manual">Manual Receive</TabsTrigger>
        </TabsList>

        <TabsContent value="po">
          <Card>
            <CardHeader>
              <CardTitle>Receive Against PO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectField
                label="Purchase Order"
                placeholder="Select a purchase order"
                value={selectedPoId || undefined}
                onValueChange={handlePoSelect}
                options={poOptions}
              />

              {poDetailQuery.data && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {poDetailQuery.data.po_ref} — {poDetailQuery.data.supplier_name}
                  </p>
                  <div className="mt-3 space-y-2">
                    {(poDetailQuery.data.items ?? []).map((item) => (
                      <div
                        key={item.product_id}
                        className="flex justify-between text-sm text-gray-700"
                      >
                        <span>{item.product_name}</span>
                        <span className="font-mono">
                          {item.qty_received}/{item.qty_ordered} received
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="mt-4"
                    onClick={handlePoReceive}
                    loading={poMutation.isPending}
                    disabled={!selectedPoId}
                  >
                    Receive Remaining Items
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Stock Receive</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={manualForm.handleSubmit((v) => manualMutation.mutate(v))}
                className="space-y-4"
              >
                <Input
                  label="Note"
                  placeholder="Delivery reference or reason"
                  {...manualForm.register('note')}
                />

                <div className="space-y-3">
                  {manualFields.fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3">
                      <SelectField
                        label={index === 0 ? 'Product' : undefined}
                        placeholder="Select product"
                        value={
                          manualForm.watch(`items.${index}.product_id`)
                            ? String(manualForm.watch(`items.${index}.product_id`))
                            : undefined
                        }
                        onValueChange={(v) =>
                          manualForm.setValue(`items.${index}.product_id`, Number(v))
                        }
                        options={productOptions}
                        className="flex-1"
                      />
                      <Input
                        label={index === 0 ? 'Qty' : undefined}
                        type="number"
                        min={1}
                        className="w-24"
                        {...manualForm.register(`items.${index}.qty_received`, { valueAsNumber: true })}
                      />
                      {manualFields.fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => manualFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => manualFields.append({ product_id: 0, qty_received: 1 })}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>

                {manualForm.formState.errors.items?.message && (
                  <p className="text-xs text-danger-600">
                    {manualForm.formState.errors.items.message}
                  </p>
                )}

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <Button type="submit" loading={manualMutation.isPending}>
                    Receive Stock
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
