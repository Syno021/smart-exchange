import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/Button'
import { purchaseOrderService } from '@/services/purchaseOrder.service'
import { useToast } from '@/components/ui/Toast'
import type { PoStatusAction } from '@/lib/poWorkflow'
import type { POStatus } from '@/types/order.types'
import type { ApiResponse } from '@/types/api.types'

interface PoStatusActionBarProps {
  poId: number
  actions: PoStatusAction[]
  showCancel?: boolean
  size?: 'sm' | 'md'
  onSuccess?: () => void
}

export function invalidatePurchaseOrderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  poId?: number,
) {
  queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
  if (poId != null) {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders', String(poId)] })
  }
  queryClient.invalidateQueries({ queryKey: ['supplier', 'orders'] })
  queryClient.invalidateQueries({ queryKey: ['supplier', 'deliveries'] })
}

export function PoStatusActionBar({
  poId,
  actions,
  showCancel = false,
  size = 'md',
  onSuccess,
}: PoStatusActionBarProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const statusMutation = useMutation({
    mutationFn: (status: POStatus) => purchaseOrderService.update(poId, { status }),
    onSuccess: (_data, status) => {
      invalidatePurchaseOrderQueries(queryClient, poId)
      toast({
        title: `Order marked as ${status}`,
        variant: 'success',
      })
      onSuccess?.()
    },
    onError: (err: AxiosError<ApiResponse<unknown>>) => {
      toast({
        title: err.response?.data?.message ?? 'Failed to update order status',
        variant: 'error',
      })
    },
  })

  const handleAction = (action: PoStatusAction) => {
    if (action.confirm && !window.confirm(action.confirm)) return
    statusMutation.mutate(action.status)
  }

  const handleCancel = () => {
    if (!window.confirm('Cancel this purchase order?')) return
    statusMutation.mutate('cancelled')
  }

  if (actions.length === 0 && !showCancel) return null

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          type="button"
          variant={action.variant}
          size={size}
          loading={statusMutation.isPending}
          onClick={() => handleAction(action)}
        >
          {action.label}
        </Button>
      ))}
      {showCancel && (
        <Button
          type="button"
          variant="danger"
          size={size}
          loading={statusMutation.isPending}
          onClick={handleCancel}
        >
          Cancel Order
        </Button>
      )}
    </div>
  )
}
