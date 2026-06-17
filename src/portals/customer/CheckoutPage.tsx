import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Clock, CreditCard, Gift, MapPin, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SelectField } from '@/components/ui/Select'
import { PageHeader } from '@/components/shared/PageHeader'
import { RandAmount } from '@/components/shared/RandAmount'
import { useCartStore } from '@/stores/cartStore'
import { useCustomerProfile } from '@/portals/customer/hooks/useCustomerProfile'
import { saleService } from '@/services/sale.service'
import { CUSTOMER_PAYMENT_METHODS } from '@/lib/constants'
import {
  isValidCardNumber,
  loadSavedCard,
  saveCard,
  type SavedCardDetails,
} from '@/lib/cardStorage'
import { fullNameSchema, phoneSchema } from '@/lib/validation'
import {
  canPayWithLoyalty,
  loyaltyShortfallMessage,
  pointsRequiredForTotal,
} from '@/lib/loyalty'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api.types'

const checkoutSchema = z
  .object({
    full_name: fullNameSchema,
    phone: phoneSchema,
    address: z.string().min(5, 'Delivery address must be at least 5 characters'),
    payment_method: z.enum(['cash', 'card', 'loyalty']),
    notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
    cardholder_name: z.string().optional(),
    card_number: z.string().optional(),
    expiry_month: z.string().optional(),
    expiry_year: z.string().optional(),
    cvv: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method !== 'card') return

    if (!data.cardholder_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cardholder name is required',
        path: ['cardholder_name'],
      })
    }
    const digits = (data.card_number ?? '').replace(/\D/g, '')
    if (!digits || !isValidCardNumber(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid card number',
        path: ['card_number'],
      })
    }
    const month = parseInt(data.expiry_month ?? '', 10)
    if (!month || month < 1 || month > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid expiry month (01–12)',
        path: ['expiry_month'],
      })
    }
    const year = parseInt(data.expiry_year ?? '', 10)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    if (!year || year < currentYear || (year === currentYear && month < currentMonth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Card has expired or invalid year',
        path: ['expiry_year'],
      })
    }
    const cvv = data.cvv ?? ''
    if (!/^\d{3,4}$/.test(cvv)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CVV must be 3 or 4 digits',
        path: ['cvv'],
      })
    }
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: customer?.full_name ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      payment_method: 'card',
      notes: '',
      cardholder_name: '',
      card_number: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
    },
  })

  const paymentMethod = watch('payment_method')

  useEffect(() => {
    const saved = loadSavedCard()
    if (saved) {
      setValue('cardholder_name', saved.cardholder_name)
      setValue('card_number', saved.card_number)
      setValue('expiry_month', saved.expiry_month)
      setValue('expiry_year', saved.expiry_year)
    }
  }, [setValue])

  useEffect(() => {
    if (customer) {
      reset((prev) => ({
        ...prev,
        full_name: customer.full_name ?? prev.full_name,
        phone: customer.phone ?? prev.phone,
        address: customer.address ?? prev.address,
      }))
    }
  }, [customer, reset])

  const orderTotal = total()
  const loyaltyPoints = customer?.loyalty_points ?? 0
  const loyaltyQualified = canPayWithLoyalty(loyaltyPoints, orderTotal)
  const paymentOptions = useMemo(
    () =>
      CUSTOMER_PAYMENT_METHODS.filter(
        (m) => m.value !== 'loyalty' || loyaltyQualified,
      ),
    [loyaltyQualified],
  )

  useEffect(() => {
    if (paymentMethod === 'loyalty' && !loyaltyQualified) {
      setValue('payment_method', 'card')
    }
  }, [loyaltyQualified, paymentMethod, setValue])

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

    if (values.payment_method === 'loyalty' && !loyaltyQualified) {
      setSubmitError(loyaltyShortfallMessage(loyaltyPoints, orderTotal))
      return
    }

    if (values.payment_method === 'card') {
      const cardDetails: SavedCardDetails = {
        cardholder_name: values.cardholder_name!.trim(),
        card_number: values.card_number!.replace(/\D/g, ''),
        expiry_month: values.expiry_month!.padStart(2, '0'),
        expiry_year: values.expiry_year!,
      }
      saveCard(cardDetails)
    }

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
              <Input
                label="Phone"
                placeholder="0XXXXXXXXX"
                maxLength={10}
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input label="Delivery address" error={errors.address?.message} {...register('address')} />
              <Input label="Order notes (optional)" error={errors.notes?.message} {...register('notes')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectField
                label="How would you like to pay?"
                value={paymentMethod}
                onValueChange={(v) => {
                  const method = v as CheckoutForm['payment_method']
                  if (method === 'loyalty' && !loyaltyQualified) {
                    setSubmitError(loyaltyShortfallMessage(loyaltyPoints, orderTotal))
                    return
                  }
                  setSubmitError(null)
                  setValue('payment_method', method)
                }}
                options={paymentOptions.map((m) => ({ value: m.value, label: m.label }))}
              />

              {!loyaltyQualified && (
                <p className="text-xs text-gray-500">
                  Loyalty points payment requires {pointsRequiredForTotal(orderTotal).toLocaleString()}{' '}
                  points (you have {loyaltyPoints.toLocaleString()}).
                </p>
              )}

              {paymentMethod === 'loyalty' && loyaltyQualified && (
                <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-sm text-brand-800">
                  <p className="flex items-center gap-2 font-medium">
                    <Gift className="h-4 w-4" />
                    Pay with loyalty points
                  </p>
                  <p className="mt-1 text-xs text-brand-700">
                    {pointsRequiredForTotal(orderTotal).toLocaleString()} points will be redeemed from
                    your balance of {loyaltyPoints.toLocaleString()} points.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CreditCard className="h-4 w-4 text-brand-600" />
                    Card Details
                  </p>
                  <p className="text-xs text-gray-500">
                    Card details are saved on this device only for your convenience. They are not
                    stored on our servers.
                  </p>
                  <Input
                    label="Name on card"
                    autoComplete="cc-name"
                    error={errors.cardholder_name?.message}
                    {...register('cardholder_name')}
                  />
                  <Input
                    label="Card number"
                    placeholder="1234 5678 9012 3456"
                    autoComplete="cc-number"
                    error={errors.card_number?.message}
                    {...register('card_number')}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Month"
                      placeholder="MM"
                      maxLength={2}
                      autoComplete="cc-exp-month"
                      error={errors.expiry_month?.message}
                      {...register('expiry_month')}
                    />
                    <Input
                      label="Year"
                      placeholder="YYYY"
                      maxLength={4}
                      autoComplete="cc-exp-year"
                      error={errors.expiry_year?.message}
                      {...register('expiry_year')}
                    />
                    <Input
                      label="CVV"
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      autoComplete="cc-csc"
                      error={errors.cvv?.message}
                      {...register('cvv')}
                    />
                  </div>
                </div>
              )}

              <p className="flex items-center gap-2 text-xs text-gray-500">
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
