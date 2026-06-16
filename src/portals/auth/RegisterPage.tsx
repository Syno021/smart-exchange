import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authService } from '../../services/auth.service'
import {
  emailOptionalSchema,
  fullNameSchema,
  phoneSchema,
  strongPasswordSchema,
  usernameSchema,
} from '../../lib/validation'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '../../types/api.types'

const registerSchema = z
  .object({
    full_name: fullNameSchema,
    username: usernameSchema,
    email: emailOptionalSchema,
    phone: phoneSchema,
    password: strongPasswordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null)
    try {
      await authService.register({
        full_name: values.full_name,
        username: values.username,
        email: values.email || undefined,
        phone: values.phone,
        password: values.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      setServerError(
        axiosErr.response?.data?.message ?? 'Registration failed. Please try again.',
      )
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-gray-900">Account created!</h1>
        <p className="mt-2 text-sm text-gray-500">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Create account</h1>
      <p className="mt-1 text-sm text-gray-500">Register as a customer to shop and earn loyalty points</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Email (optional)"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone"
          placeholder="0XXXXXXXXX"
          maxLength={10}
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {serverError && (
          <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{serverError}</p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
