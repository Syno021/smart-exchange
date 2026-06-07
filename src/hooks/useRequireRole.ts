import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types/auth.types'

export function useRequireRole(requiredRole: UserRole) {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const user = useAuthStore((s) => s.user)

  const isAuthorized = Boolean(token && role === requiredRole)

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
    } else if (role !== requiredRole) {
      navigate('/login', { replace: true })
    }
  }, [token, role, requiredRole, navigate])

  return { user, role, token, isAuthorized }
}
