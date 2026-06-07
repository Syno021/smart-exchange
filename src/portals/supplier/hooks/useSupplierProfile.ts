import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { supplierService } from '@/services/supplier.service'
import { useAuthStore } from '@/stores/authStore'
import type { Supplier } from '@/types/supplier.types'

export function useSupplierProfile() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['supplier', 'profile', user?.user_id],
    queryFn: async (): Promise<Supplier | null> => {
      try {
        const { data } = await supplierService.getMe()
        return data.data
      } catch (err) {
        if ((err as AxiosError).response?.status === 404) return null
        throw err
      }
    },
    enabled: !!user,
  })
}
