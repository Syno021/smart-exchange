import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { validateStrongPassword } from '../../lib/password'
import { authService } from '../../services/auth.service'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '../../types/api.types'

const resetSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().superRefine((value, ctx) => {
      const error = validateStrongPassword(value)
      if (error) {
        ctx.addIssue({ code: 'custom', message: error })
      }
    }),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type ResetForm = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', username: '', password: '', confirm_password: '' },
  })

  const onSubmit = async (values: ResetForm) => {
    setServerError(null)
    try {
      await authService.resetPassword({
        email: values.email,
        username: values.username,
        password: values.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      setServerError(
        axiosErr.response?.data?.message ?? 'Unable to reset your password. Please try again.',
      )
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-gray-900">Password updated</h1>
        <p className="mt-2 text-sm text-gray-500">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Reset your password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter your account email and username, then choose a new password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {serverError && (
          <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{serverError}</p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
