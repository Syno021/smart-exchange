import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  SelectField,
  useToast,
} from '@/components'
import { productService } from '@/services/product.service'
import { supplierService } from '@/services/supplier.service'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  category_id: z.number().min(1, 'Category is required'),
  supplier_id: z.number().optional(),
  unit: z.string().min(1, 'Unit is required'),
  cost_price: z.number().min(0, 'Cost must be 0 or more'),
  selling_price: z.number().min(0, 'Price must be 0 or more'),
  stock_qty: z.number().int().min(0),
  reorder_level: z.number().int().min(0),
  max_stock: z.number().int().min(0),
  description: z.string().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const productQuery = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await productService.getById(Number(id))
      return data.data
    },
    enabled: isEdit,
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await productService.getCategories()
      return data.data
    },
  })

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supplierService.getAll({ per_page: 100 })
      return data.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      unit: 'each',
      cost_price: 0,
      selling_price: 0,
      stock_qty: 0,
      reorder_level: 10,
      max_stock: 100,
      is_active: true,
      is_featured: false,
    },
  })

  useEffect(() => {
    if (productQuery.data) {
      const p = productQuery.data
      reset({
        name: p.name,
        barcode: p.barcode ?? '',
        sku: p.sku ?? '',
        category_id: p.category_id,
        supplier_id: p.supplier_id,
        unit: p.unit,
        cost_price: p.cost_price,
        selling_price: p.selling_price,
        stock_qty: p.stock_qty,
        reorder_level: p.reorder_level,
        max_stock: p.max_stock,
        description: p.description ?? '',
        is_active: p.is_active,
        is_featured: p.is_featured,
      })
    }
  }, [productQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        ...values,
        barcode: values.barcode || undefined,
        sku: values.sku || undefined,
        supplier_id: values.supplier_id || undefined,
        description: values.description || undefined,
      }
      if (isEdit) {
        await productService.update(Number(id), payload)
      } else {
        await productService.create(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: isEdit ? 'Product updated' : 'Product created',
        variant: 'success',
      })
      navigate('/manager/products')
    },
    onError: () => {
      toast({ title: 'Failed to save product', variant: 'error' })
    },
  })

  const categoryId = watch('category_id')
  const supplierId = watch('supplier_id')

  const categoryOptions = (categoriesQuery.data ?? []).map((c) => ({
    value: String(c.category_id),
    label: c.name,
  }))

  const supplierOptions = (suppliersQuery.data ?? []).map((s) => ({
    value: String(s.supplier_id),
    label: s.company_name,
  }))

  if (isEdit && productQuery.isLoading) {
    return <div className="animate-pulse rounded-lg bg-gray-100 p-12" />
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        subtitle={isEdit ? `Editing ${productQuery.data?.name ?? 'product'}` : 'Add a new product to the catalogue'}
        actions={
          <Link to="/manager/products">
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <form
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Product Name" error={errors.name?.message} {...register('name')} />
              <Input label="SKU" error={errors.sku?.message} {...register('sku')} />
              <Input label="Barcode" error={errors.barcode?.message} {...register('barcode')} />
              <Input label="Unit" error={errors.unit?.message} {...register('unit')} placeholder="e.g. each, kg, litre" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Category"
                placeholder="Select category"
                value={categoryId ? String(categoryId) : undefined}
                onValueChange={(v) => setValue('category_id', Number(v), { shouldValidate: true })}
                options={categoryOptions}
                error={errors.category_id?.message}
              />
              <SelectField
                label="Supplier"
                placeholder="Select supplier (optional)"
                value={supplierId ? String(supplierId) : undefined}
                onValueChange={(v) => setValue('supplier_id', Number(v))}
                options={supplierOptions}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Cost Price (R)"
                type="number"
                step="0.01"
                error={errors.cost_price?.message}
                {...register('cost_price', { valueAsNumber: true })}
              />
              <Input
                label="Selling Price (R)"
                type="number"
                step="0.01"
                error={errors.selling_price?.message}
                {...register('selling_price', { valueAsNumber: true })}
              />
              <Input
                label="Stock Qty"
                type="number"
                error={errors.stock_qty?.message}
                {...register('stock_qty', { valueAsNumber: true })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Reorder Level"
                type="number"
                error={errors.reorder_level?.message}
                {...register('reorder_level', { valueAsNumber: true })}
              />
              <Input
                label="Max Stock"
                type="number"
                error={errors.max_stock?.message}
                {...register('max_stock', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1.5 flex min-h-[80px] w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                {...register('description')}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" {...register('is_active')} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" {...register('is_featured')} />
                Featured
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Link to="/manager/products">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={saveMutation.isPending}>
                {isEdit ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
