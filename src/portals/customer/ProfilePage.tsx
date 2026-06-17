import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/shared/PageHeader'
import { useCustomerProfile } from '@/portals/customer/hooks/useCustomerProfile'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/authStore'
import { fullNameSchema, phoneOptionalSchema } from '@/lib/validation'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api.types'

const profileSchema = z.object({
  full_name: fullNameSchema,
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: phoneOptionalSchema,
  address: z.string().max(255, 'Address is too long').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: customer, isLoading } = useCustomerProfile()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (customer || user) {
      reset({
        full_name: customer?.full_name ?? user?.full_name ?? '',
        email: customer?.email ?? user?.email ?? '',
        phone: customer?.phone ?? '',
        address: customer?.address ?? '',
      })
    }
  }, [customer, user, reset])

  const mutation = useMutation({
    mutationFn: (values: ProfileForm) =>
      userService.update(user!.user_id, {
        full_name: values.full_name,
        email: values.email || undefined,
        phone: values.phone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  const onSubmit = (values: ProfileForm) => {
    mutation.mutate(values)
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Profile" subtitle="Manage your account information" />

      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-brand-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input
                label="Phone"
                placeholder="0XXXXXXXXX"
                maxLength={10}
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input label="Delivery address" error={errors.address?.message} {...register('address')} />

              {user && (
                <p className="text-xs text-gray-500">Username: {user.username}</p>
              )}

              {mutation.isSuccess && (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Profile updated successfully.
                </p>
              )}
              {mutation.isError && (
                <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">
                  {(mutation.error as AxiosError<ApiResponse<unknown>>).response?.data?.message ??
                    'Failed to update profile.'}
                </p>
              )}

              <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
                Save Changes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
