import { useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/auth.service'
import type { LoginPayload, RegisterPayload } from '../types/auth.types'

export function useAuth() {
  const { user, token, role, setAuth, logout } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token)
    },
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  })

  const login = useCallback(
    (payload: LoginPayload) => loginMutation.mutateAsync(payload),
    [loginMutation],
  )

  const register = useCallback(
    (payload: RegisterPayload) => registerMutation.mutateAsync(payload),
    [registerMutation],
  )

  const fetchMe = useCallback(async () => {
    const { data } = await authService.me()
    if (data.data) {
      useAuthStore.setState({ user: data.data, role: data.data.role })
    }
    return data.data
  }, [])

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled: !!token && !user,
    retry: false,
  })

  return {
    user,
    token,
    role,
    isAuthenticated: !!token,
    isLoading: loginMutation.isPending || meQuery.isLoading,
    login,
    register,
    logout,
    fetchMe,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}
