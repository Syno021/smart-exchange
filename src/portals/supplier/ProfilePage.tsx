import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/shared/PageHeader'
import { useSupplierProfile } from '@/portals/supplier/hooks/useSupplierProfile'
import { supplierService } from '@/services/supplier.service'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/authStore'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api.types'

const profileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_number: z.string().optional(),
  payment_terms: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: supplier, isLoading } = useSupplierProfile()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      tax_number: '',
      payment_terms: '',
    },
  })

  useEffect(() => {
    if (supplier) {
      reset({
        company_name: supplier.company_name,
        contact_name: supplier.contact_name ?? user?.full_name ?? '',
        email: supplier.email ?? user?.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? '',
        tax_number: supplier.tax_number ?? '',
        payment_terms: supplier.payment_terms ?? '',
      })
    }
  }, [supplier, user, reset])

  const mutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      if (supplier) {
        await supplierService.update(supplier.supplier_id, values)
      }
      if (user) {
        await userService.update(user.user_id, {
          full_name: values.contact_name || values.company_name,
          email: values.email || undefined,
          phone: values.phone,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', 'profile'] })
    },
  })

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Profile" subtitle="Manage your supplier account details" />

      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-warning-500" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          ) : !supplier ? (
            <p className="text-sm text-gray-500">
              No supplier account is linked to your login. Ask a manager to link your user to a
              supplier record.
            </p>
          ) : (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              <Input label="Company name" error={errors.company_name?.message} {...register('company_name')} />
              <Input label="Contact name" error={errors.contact_name?.message} {...register('contact_name')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input label="Address" error={errors.address?.message} {...register('address')} />
              <Input label="Tax number" error={errors.tax_number?.message} {...register('tax_number')} />
              <Input label="Payment terms" error={errors.payment_terms?.message} {...register('payment_terms')} />

              {supplier && (
                <p className="text-xs text-gray-500">
                  Rating: {Number(supplier.rating).toFixed(1)} / 5 ·{' '}
                  {supplier.is_active ? 'Active account' : 'Inactive'}
                </p>
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
