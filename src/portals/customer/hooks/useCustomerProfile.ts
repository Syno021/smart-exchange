import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/services/customer.service'
import { useAuthStore } from '@/stores/authStore'
import type { Customer } from '@/types/customer.types'

export function useCustomerProfile() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['customer', 'profile', user?.user_id],
    queryFn: async (): Promise<Customer | undefined> => {
      if (!user) return undefined
      const { data } = await customerService.getAll({ search: user.username, per_page: 100 })
      return data.data.find((c) => c.user_id === user.user_id)
    },
    enabled: !!user,
  })
}
