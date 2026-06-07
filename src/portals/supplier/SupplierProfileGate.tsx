import type { ReactNode } from 'react'
import { useSupplierProfile } from '@/portals/supplier/hooks/useSupplierProfile'
import { Button } from '@/components/ui/Button'

export function SupplierProfileGate({ children }: { children: ReactNode }) {
  const { data: supplier, isLoading, isError, error, refetch, isFetching } = useSupplierProfile()

  if (isLoading || (isFetching && !supplier)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-gray-500">Loading supplier account…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-gray-600">
          {(error as Error).message || 'Could not load your supplier profile.'}
        </p>
        <Button variant="secondary" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="max-w-md text-center text-sm text-gray-500">
          No supplier account is linked to your login. Ask a manager to assign your user to a
          supplier record.
        </p>
      </div>
    )
  }

  return children
}
