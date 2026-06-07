import { Navigate, Outlet } from 'react-router-dom'
import { AppLogo } from '../components/shared/AppLogo'
import { APP_NAME } from '../lib/constants'
import { ROLE_HOME } from '../lib/rolePaths'
import { useAuthStore } from '../stores/authStore'

export function AuthLayout() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)

  if (token && role) {
    return <Navigate to={ROLE_HOME[role]} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-[#F7F8FA] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <AppLogo className="justify-center" />
          <p className="mt-2 text-sm text-gray-500">{APP_NAME}</p>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-card">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
