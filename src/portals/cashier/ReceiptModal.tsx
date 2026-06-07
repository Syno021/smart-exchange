import { CheckCircle2, Printer } from 'lucide-react'
import { Button, Modal, RandAmount } from '@/components'
import { formatDate } from '@/lib/utils'
import type { CartItem, PaymentMethod } from '@/types/sale.types'

export interface ReceiptData {
  sale_ref: string
  items: CartItem[]
  subtotal: number
  discount_amt: number
  tax_amt: number
  total_amt: number
  amount_paid: number
  change_given: number
  payment_method: PaymentMethod
  customer_name?: string
  created_at: string
}

export interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: ReceiptData | null
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  ewallet: 'E-Wallet',
  loyalty: 'Loyalty Points',
}

export function ReceiptModal({ open, onOpenChange, receipt }: ReceiptModalProps) {
  if (!receipt) return null

  const handlePrint = () => window.print()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Sale Complete"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 rounded-lg bg-brand-50 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-brand-600" />
          <p className="font-display text-lg font-bold text-gray-900">{receipt.sale_ref}</p>
          <p className="text-xs text-gray-500">
            {formatDate(receipt.created_at, 'dd MMM yyyy · HH:mm')}
          </p>
        </div>

        {receipt.customer_name && (
          <p className="text-sm text-gray-600">
            Customer: <span className="font-medium text-gray-900">{receipt.customer_name}</span>
          </p>
        )}

        <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {receipt.items.map((item) => (
            <div key={item.product_id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.qty} × <RandAmount amount={item.unit_price} />
                </p>
              </div>
              <RandAmount amount={item.line_total} className="text-sm font-medium text-gray-900" />
            </div>
          ))}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <RandAmount amount={receipt.subtotal} />
          </div>
          {receipt.discount_amt > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <RandAmount amount={-receipt.discount_amt} showSign />
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>VAT (15%)</span>
            <RandAmount amount={receipt.tax_amt} />
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
            <span>Total</span>
            <RandAmount amount={receipt.total_amt} />
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Paid ({PAYMENT_LABELS[receipt.payment_method]})</span>
            <RandAmount amount={receipt.amount_paid} />
          </div>
          {receipt.change_given > 0 && (
            <div className="flex justify-between font-medium text-brand-700">
              <span>Change</span>
              <RandAmount amount={receipt.change_given} />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            New Sale
          </Button>
        </div>
      </div>
    </Modal>
  )
}
