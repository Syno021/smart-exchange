import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { ROLES } from '@/lib/constants'
import {
  generateStrongPassword,
  getPasswordStrength,
  validateStrongPassword,
} from '@/lib/password'
import type { UserRole } from '@/types/auth.types'
import type { User } from '@/types/user.types'

const roleOptions = (Object.keys(ROLES) as UserRole[]).map((role) => ({
  value: role,
  label: ROLES[role].label,
}))

const baseSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'customer', 'supplier']),
  is_active: z.enum(['1', '0']),
})

type UserFormValues = z.infer<typeof baseSchema>

export interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  isLoading?: boolean
  onSubmit: (values: {
    full_name: string
    username: string
    email?: string
    phone?: string
    password?: string
    role: UserRole
    is_active: boolean
  }) => void
}

export function UserFormModal({
  open,
  onOpenChange,
  user,
  isLoading = false,
  onSubmit,
}: UserFormModalProps) {
  const { toast } = useToast()
  const isEdit = !!user
  const [passwordMode, setPasswordMode] = useState<'manual' | 'auto'>('auto')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      full_name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: 'cashier',
      is_active: '1',
    },
  })

  const role = watch('role')
  const isActive = watch('is_active')
  const password = watch('password') ?? ''

  const passwordStrength = useMemo(
    () => (password ? getPasswordStrength(password) : null),
    [password]
  )

  const applyGeneratedPassword = () => {
    const generated = generateStrongPassword()
    setValue('password', generated, { shouldValidate: true })
    setShowPassword(true)
  }

  useEffect(() => {
    if (open) {
      setPasswordMode('auto')
      setShowPassword(false)
      reset(
        user
          ? {
              full_name: user.full_name,
              username: user.username,
              email: user.email ?? '',
              phone: user.phone ?? '',
              password: '',
              role: user.role,
              is_active: user.is_active ? '1' : '0',
            }
          : {
              full_name: '',
              username: '',
              email: '',
              phone: '',
              password: '',
              role: 'cashier',
              is_active: '1',
            }
      )
      if (!user) {
        applyGeneratedPassword()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, reset])

  useEffect(() => {
    if (open && !isEdit && passwordMode === 'auto' && !password) {
      applyGeneratedPassword()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordMode, open, isEdit])

  const handleFormSubmit = (values: UserFormValues) => {
    const trimmedPassword = values.password?.trim()

    if (!isEdit) {
      if (!trimmedPassword) {
        toast({ title: 'Password is required', variant: 'error' })
        return
      }
      const passwordError = validateStrongPassword(trimmedPassword)
      if (passwordError) {
        toast({ title: passwordError, variant: 'error' })
        return
      }
    } else if (trimmedPassword) {
      const passwordError = validateStrongPassword(trimmedPassword)
      if (passwordError) {
        toast({ title: passwordError, variant: 'error' })
        return
      }
    }

    onSubmit({
      full_name: values.full_name.trim(),
      username: values.username.trim(),
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      password: trimmedPassword || undefined,
      role: values.role,
      is_active: values.is_active === '1',
    })
  }

  const copyPassword = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    toast({ title: 'Password copied to clipboard', variant: 'success' })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit User' : 'Create User'}
      description={isEdit ? 'Update account details and role.' : 'Add a new system user.'}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {isEdit ? 'New Password (optional)' : 'Password'}
            </label>
            {!isEdit && (
              <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
                <button
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    passwordMode === 'auto'
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setPasswordMode('auto')}
                >
                  Auto-generate
                </button>
                <button
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    passwordMode === 'manual'
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setPasswordMode('manual')
                    setValue('password', '')
                    setShowPassword(false)
                  }}
                >
                  Manual
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyGeneratedPassword}
              title="Generate strong password"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {password && (
              <Button type="button" variant="outline" size="sm" onClick={copyPassword} title="Copy password">
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>

          {password && passwordStrength && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full ${
                      passwordStrength.score >= level * 1.5
                        ? passwordStrength.label === 'Strong'
                          ? 'bg-brand-600'
                          : passwordStrength.label === 'Good'
                            ? 'bg-blue-500'
                            : passwordStrength.label === 'Fair'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Strength: {passwordStrength.label}. Must include 8+ chars, upper & lower case, number, and symbol.
              </p>
            </div>
          )}

          {!isEdit && passwordMode === 'auto' && (
            <button
              type="button"
              className="text-xs text-brand-600 hover:underline"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          )}
        </div>

        <SelectField
          label="Role"
          value={role}
          onValueChange={(v) => setValue('role', v as UserRole)}
          options={roleOptions}
          error={errors.role?.message}
        />
        <SelectField
          label="Status"
          value={isActive}
          onValueChange={(v) => setValue('is_active', v as '1' | '0')}
          options={[
            { value: '1', label: 'Active' },
            { value: '0', label: 'Inactive' },
          ]}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
