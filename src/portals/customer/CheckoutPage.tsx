import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Clock, MapPin, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SelectField } from '@/components/ui/Select'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { useCartStore } from '@/stores/cartStore'
import { useCustomerProfile } from '@/portals/customer/hooks/useCustomerProfile'
import { saleService } from '@/services/sale.service'
import { PAYMENT_METHODS } from '@/lib/constants'
import type { PaymentMethod } from '@/types/sale.types'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api.types'

const checkoutSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Delivery address is required'),
  payment_method: z.enum(['cash', 'card', 'ewallet', 'loyalty']),
  notes: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

interface PlacedOrder {
  sale_ref: string
  total_amt: number
}

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)
  const clearCart = useCartStore((s) => s.clearCart)
  const { data: customer } = useCustomerProfile()
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: customer?.full_name ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      payment_method: 'card',
      notes: '',
    },
  })

  const paymentMethod = watch('payment_method')

  if (items.length === 0 && !placed) {
    return (
      <div className="p-4 sm:p-6">
        <PageHeader title="Checkout" />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Your cart is empty.</p>
            <Link to="/shop/browse" className="mt-4 inline-block">
              <Button>Go to Shop</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="py-10">
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
            <h2 className="mt-4 font-display text-xl font-bold text-gray-900">Order Placed</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your delivery order has been submitted. We will notify you when it is on the way and
              when it has been delivered.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Clock className="h-4 w-4" />
              Ref: {placed.sale_ref} · <RandAmount amount={placed.total_amt} />
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/shop/orders">
                <Button>View Orders</Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (values: CheckoutForm) => {
    setSubmitError(null)
    try {
      const { data } = await saleService.createOnlineOrder({
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        payment_method: values.payment_method,
        delivery_address: values.address,
        delivery_phone: values.phone,
        notes: values.notes || undefined,
      })
      clearCart()
      setPlaced({
        sale_ref: data.data.sale_ref,
        total_amt: data.data.total_amt,
      })
    } catch (err) {
      setSubmitError(
        (err as AxiosError<ApiResponse<unknown>>).response?.data?.message ??
          'Failed to place order. Please try again.',
      )
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Checkout" subtitle="Review your order and delivery details" />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-600" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input label="Delivery address" error={errors.address?.message} {...register('address')} />
              <Input label="Order notes (optional)" {...register('notes')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectField
                label="How would you like to pay?"
                value={paymentMethod}
                onValueChange={(v) => setValue('payment_method', v as PaymentMethod)}
                options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
              />
              <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                Your order will be prepared and delivered to your address.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} × {item.qty}
                </span>
                <RandAmount amount={item.line_total} />
              </div>
            ))}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <RandAmount amount={subtotal()} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT</span>
                <RandAmount amount={tax()} />
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <RandAmount amount={total()} className="text-brand-700" />
              </div>
            </div>
            {submitError && (
              <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">
                {submitError}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Place Delivery Order
            </Button>
            <Link to="/shop/cart" className="block">
              <Button type="button" variant="ghost" className="w-full">
                Back to Cart
              </Button>
            </Link>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
