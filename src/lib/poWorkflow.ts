import type { POStatus } from '@/types/order.types'
import { PO_STATUS_LABELS } from '@/lib/constants'

export interface PoStatusAction {
  status: POStatus
  label: string
  variant: 'primary' | 'secondary' | 'outline' | 'danger'
  confirm?: string
}

export function getManagerPoActions(status: POStatus): PoStatusAction[] {
  switch (status) {
    case 'draft':
      return [
        {
          status: 'submitted',
          label: 'Submit to Supplier',
          variant: 'primary',
          confirm: 'Send this purchase order to the supplier?',
        },
      ]
    case 'submitted':
      return [
        {
          status: 'approved',
          label: 'Approve Order',
          variant: 'primary',
          confirm: 'Approve this order so the supplier can ship it?',
        },
      ]
    default:
      return []
  }
}

export function canCancelPo(status: POStatus): boolean {
  return status === 'draft' || status === 'submitted' || status === 'approved'
}

export function canEditPoDetails(status: POStatus): boolean {
  return status === 'draft'
}

export function getSupplierPoActions(status: POStatus): PoStatusAction[] {
  if (status === 'approved') {
    return [
      {
        status: 'shipped',
        label: 'Mark as Shipped',
        variant: 'primary',
        confirm: 'Confirm that this order has been dispatched?',
      },
    ]
  }
  return []
}

export function canSupplierAddNotes(status: POStatus): boolean {
  return ['submitted', 'approved', 'shipped'].includes(status)
}

export function getPoStatusHint(status: POStatus, role: 'manager' | 'supplier'): string {
  if (role === 'manager') {
    switch (status) {
      case 'draft':
        return 'Save the PO, then submit it to notify the supplier.'
      case 'submitted':
        return 'Waiting for approval before the supplier can ship.'
      case 'approved':
        return 'Approved — waiting for the supplier to mark as shipped.'
      case 'shipped':
        return 'In transit — receive stock under Inventory → Stock Receiving.'
      case 'received':
        return 'All items received into inventory.'
      case 'cancelled':
        return 'This purchase order was cancelled.'
      default:
        return ''
    }
  }

  switch (status) {
    case 'draft':
      return 'This order has not been sent to you yet.'
    case 'submitted':
      return 'The store has sent this order — awaiting manager approval.'
    case 'approved':
      return 'Approved — mark as shipped once goods are dispatched.'
    case 'shipped':
      return 'Marked as shipped — awaiting store receipt.'
    case 'received':
      return 'The store has received this delivery.'
    case 'cancelled':
      return 'This order was cancelled by the store.'
    default:
      return ''
  }
}

export function getPoStatusLabel(status: POStatus): string {
  return PO_STATUS_LABELS[status]
}
