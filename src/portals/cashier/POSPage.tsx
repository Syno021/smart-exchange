import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Barcode,
  Minus,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  RandAmount,
  useToast,
} from '@/components'
import { customerService } from '@/services/customer.service'
import { productService } from '@/services/product.service'
import { saleService } from '@/services/sale.service'
import { useCartStore } from '@/stores/cartStore'
import type { Customer } from '@/types/customer.types'
import type { Product } from '@/types/product.types'
import type { PaymentMethod } from '@/types/sale.types'
import { cn, toNumber } from '@/lib/utils'
import { decrementProductStockInCache } from '@/lib/productStockCache'
import { ReceiptModal, type ReceiptData } from './ReceiptModal'

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'loyalty', label: 'Loyalty Points' },
]

function productToCartItem(product: Product) {
  const price = toNumber(product.selling_price)
  return {
    product_id: product.product_id,
    name: product.name,
    unit_price: price,
    qty: 1,
    discount_pct: 0,
    line_total: price,
    stock_qty: product.stock_qty,
    image_url: product.image_url,
  }
}

export function POSPage() {
  const searchRef = useRef<HTMLInputElement>(null)
  const discountRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const items = useCartStore((s) => s.items)
  const customerId = useCartStore((s) => s.customerId)
  const discount = useCartStore((s) => s.discount)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const setDiscount = useCartStore((s) => s.setDiscount)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.subtotal)
  const tax = useCartStore((s) => s.tax)
  const total = useCartStore((s) => s.total)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const productsQuery = useQuery({
    queryKey: ['products', 'pos', debouncedSearch],
    queryFn: async () => {
      const { data } = await productService.getAll({
        search: debouncedSearch || undefined,
        status: 'active',
        per_page: 48,
      })
      return data.data
    },
  })

  const customersQuery = useQuery({
    queryKey: ['customers', 'lookup', customerSearch],
    queryFn: async () => {
      const { data } = await customerService.getAll({
        search: customerSearch || undefined,
        per_page: 10,
      })
      return data.data
    },
    enabled: customerModalOpen,
  })

  const completeSaleMutation = useMutation({
    mutationFn: saleService.create,
    onSuccess: ({ data }) => {
      const result = data.data
      const cartSnapshot = [...items]
      const discountAmt = discount
      const sub = subtotal()
      const taxAmt = tax()
      const totalAmt = total()
      const paid = parseFloat(amountPaid) || totalAmt

      setReceipt({
        sale_ref: result.sale_ref,
        items: cartSnapshot,
        subtotal: sub,
        discount_amt: discountAmt,
        tax_amt: taxAmt,
        total_amt: result.total_amt,
        amount_paid: paid,
        change_given: result.change_given,
        payment_method: paymentMethod,
        customer_name: selectedCustomer?.full_name,
        created_at: new Date().toISOString(),
      })

      decrementProductStockInCache(
        queryClient,
        cartSnapshot.map((item) => ({ product_id: item.product_id, qty: item.qty })),
      )

      clearCart()
      setSelectedCustomer(null)
      setAmountPaid('')
      setPaymentMethod('cash')
      setReceiptOpen(true)
      toast({ title: 'Sale completed', description: result.sale_ref, variant: 'success' })
    },
    onError: () => {
      toast({ title: 'Sale failed', description: 'Could not complete the transaction.', variant: 'error' })
    },
  })

  const getAvailableStock = useCallback(
    (product: Product) => {
      const inCart = items.find((i) => i.product_id === product.product_id)?.qty ?? 0
      return Math.max(0, toNumber(product.stock_qty) - inCart)
    },
    [items],
  )

  const handleAddProduct = useCallback(
    (product: Product) => {
      const available = getAvailableStock(product)
      if (available <= 0) {
        toast({ title: 'Out of stock', description: product.name, variant: 'warning' })
        return
      }
      addItem(productToCartItem(product))
    },
    [addItem, getAvailableStock, toast],
  )

  const handleSearchSubmit = useCallback(() => {
    const term = search.trim().toLowerCase()
    if (!term) return

    const products = productsQuery.data ?? []
    const byBarcode = products.find((p) => p.barcode?.toLowerCase() === term)
    const bySku = products.find((p) => p.sku?.toLowerCase() === term)

    if (byBarcode) {
      handleAddProduct(byBarcode)
      setSearch('')
      return
    }
    if (bySku) {
      handleAddProduct(bySku)
      setSearch('')
    }
  }, [search, productsQuery.data, handleAddProduct])

  const handleCompleteSale = useCallback(() => {
    if (items.length === 0) {
      toast({ title: 'Empty cart', description: 'Add items before completing the sale.', variant: 'warning' })
      return
    }

    const totalAmt = total()
    const paid = parseFloat(amountPaid) || totalAmt

    if (paymentMethod === 'cash' && paid < totalAmt) {
      toast({ title: 'Insufficient payment', description: 'Amount paid must cover the total.', variant: 'warning' })
      return
    }

    completeSaleMutation.mutate({
      items: items.map((i) => ({
        product_id: i.product_id,
        qty: i.qty,
        unit_price: i.unit_price,
        discount_pct: i.discount_pct,
        line_total: i.line_total,
      })),
      customer_id: customerId ?? undefined,
      discount_amt: discount,
      amount_paid: paid,
      payment_method: paymentMethod,
    })
  }, [items, total, amountPaid, paymentMethod, customerId, discount, completeSaleMutation, toast])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      } else if (e.key === 'F4') {
        e.preventDefault()
        setCustomerModalOpen(true)
      } else if (e.key === 'F8') {
        e.preventDefault()
        discountRef.current?.focus()
        discountRef.current?.select()
      } else if (e.key === 'F12') {
        e.preventDefault()
        handleCompleteSale()
      } else if (e.key === 'Escape') {
        if (items.length > 0 && !clearConfirmOpen && !customerModalOpen && !receiptOpen) {
          e.preventDefault()
          setClearConfirmOpen(true)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleCompleteSale, items.length, clearConfirmOpen, customerModalOpen, receiptOpen])

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomer(customer.customer_id)
    setCustomerModalOpen(false)
    setCustomerSearch('')
    toast({ title: 'Customer linked', description: customer.full_name ?? customer.email })
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setCustomer(null)
  }

  const products = productsQuery.data ?? []

  const changeDue = Math.max(0, (parseFloat(amountPaid) || total()) - total())

  return (
    <div className="flex h-[calc(100vh-var(--navbar-height))] min-h-0 flex-col gap-3 overflow-hidden p-4 lg:flex-row">
      {/* Left — product search & grid */}
      <div className="flex min-h-0 flex-col lg:min-h-0 lg:flex-1">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Search by name or scan barcode… (F2)"
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </div>
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            <Barcode className="mr-1 h-3 w-3" />
            Enter to scan
          </Badge>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-100 bg-white p-3 max-h-[42vh] lg:max-h-none">
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description={debouncedSearch ? 'Try a different search term.' : 'No active products available.'}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const available = getAvailableStock(product)
                const outOfStock = available <= 0
                return (
                  <button
                    key={product.product_id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => handleAddProduct(product)}
                    className={cn(
                      'flex flex-col rounded-lg border border-gray-100 p-3 text-left transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-sm',
                      outOfStock && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <div className="mb-2 flex aspect-square items-center justify-center rounded bg-gray-50 text-2xl">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-full w-full rounded object-cover" />
                      ) : (
                        '📦'
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <RandAmount amount={product.selling_price} className="text-sm font-bold text-brand-700" />
                      <span className="text-xs text-gray-400">{available} left</span>
                    </div>
                    {product.barcode && (
                      <p className="mt-0.5 truncate text-[10px] text-gray-400">{product.barcode}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-1 shrink-0 text-xs text-gray-400">
          F2 Search · F4 Customer · F8 Discount · F12 Complete · Esc Clear cart
        </p>
      </div>

      {/* Right — cart & checkout */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden lg:max-h-full lg:w-[360px] lg:flex-none lg:shrink-0">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2">
          <h2 className="font-display font-semibold text-gray-900">Current Sale</h2>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setClearConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {selectedCustomer && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-brand-50/50 px-3 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-brand-600" />
              <span className="font-medium text-gray-900">{selectedCustomer.full_name}</span>
              <span className="text-xs text-gray-500">{selectedCustomer.loyalty_points} pts</span>
            </div>
            <button type="button" onClick={handleClearCustomer} className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
          {items.length === 0 ? (
            <EmptyState title="Cart is empty" description="Search or click products to add items." className="border-0 py-6" />
          ) : (
            <ul className="divide-y divide-gray-50">
              {items.map((item) => (
                <li key={item.product_id} className="flex items-center gap-1.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <RandAmount amount={item.unit_price} className="text-xs text-gray-500" />
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQty(item.product_id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQty(item.product_id, 1)}
                      disabled={item.qty >= item.stock_qty}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <RandAmount amount={item.line_total} className="w-16 shrink-0 text-right text-sm font-medium" />
                  <button type="button" onClick={() => removeItem(item.product_id)} className="shrink-0 rounded p-1 text-gray-400 hover:text-danger-600">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-gray-100 px-3 py-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Payment</p>
            <div className="grid grid-cols-4 gap-1">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value as PaymentMethod)}
                  className={cn(
                    'rounded border px-1 py-1.5 text-[11px] font-medium transition-colors',
                    paymentMethod === option.value
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              ref={discountRef}
              label="Discount (R)"
              type="number"
              min={0}
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="h-8 px-2 py-1 text-sm"
            />
            <Input
              label="Amount paid"
              type="number"
              min={0}
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={total().toFixed(2)}
              className="h-8 px-2 py-1 text-sm"
            />
          </div>

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <RandAmount amount={subtotal()} />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <RandAmount amount={-discount} showSign />
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>VAT (15%)</span>
              <RandAmount amount={tax()} />
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <RandAmount amount={total()} />
            </div>
            {paymentMethod === 'cash' && amountPaid && (
              <div className="flex justify-between font-medium text-brand-700">
                <span>Change</span>
                <RandAmount amount={changeDue} />
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleCompleteSale}
            loading={completeSaleMutation.isPending}
            disabled={items.length === 0}
          >
            Complete Sale (F12)
          </Button>
        </div>
      </Card>

      <Modal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        title="Customer Lookup (F4)"
        description="Search by name, email, or phone to link a loyalty customer."
        className="max-w-md"
      >
        <Input
          autoFocus
          placeholder="Search customers…"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="mb-4"
        />
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {customersQuery.isLoading ? (
            <p className="py-4 text-center text-sm text-gray-500">Searching…</p>
          ) : (customersQuery.data ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No customers found.</p>
          ) : (
            (customersQuery.data ?? []).map((customer) => (
              <button
                key={customer.customer_id}
                type="button"
                onClick={() => handleSelectCustomer(customer)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-brand-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{customer.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{customer.email ?? customer.phone}</p>
                </div>
                <Badge variant="secondary">{customer.loyalty_tier}</Badge>
              </button>
            ))
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Clear cart?"
        description="This will remove all items from the current sale."
        confirmLabel="Clear cart"
        variant="danger"
        onConfirm={() => {
          clearCart()
          setSelectedCustomer(null)
          setAmountPaid('')
          setClearConfirmOpen(false)
        }}
      />

      <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} receipt={receipt} />
    </div>
  )
}
