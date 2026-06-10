import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ROLE_HOME } from '../../lib/rolePaths'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/authStore'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '../../types/api.types'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginForm) => {
    setServerError(null)
    try {
      const { data } = await authService.login(values)
      setAuth(data.data.user, data.data.token)
      navigate(ROLE_HOME[data.data.user.role], { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      setServerError(
        axiosErr.response?.data?.message ?? 'Invalid username or password. Please try again.',
      )
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-gray-900">Welcome back</h1>
      <p className="mt-1 text-sm text-gray-500">Sign in to your Ubuntu Smart Mart account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <p className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{serverError}</p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New customer?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  )
}
