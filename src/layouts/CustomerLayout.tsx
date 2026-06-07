import { NavLink } from 'react-router-dom'
import { LogOut, Menu, ShoppingCart } from 'lucide-react'
import { AppLogo } from '../components/shared/AppLogo'
import { NotificationBell } from '../components/shared/NotificationBell'
import { useRequireRole } from '../hooks/useRequireRole'
import { NAV } from '../lib/constants'
import { CustomerRoutes } from '../portals/customer/routes'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { cn } from '../lib/utils'

export function CustomerLayout() {
  const { isAuthorized } = useRequireRole('customer')
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const cartCount = useCartStore((s) => s.items.length)

  if (!isAuthorized) return null

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-[var(--navbar-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <AppLogo />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.customer.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/shop'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NavLink
              to="/shop/cart"
              className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </NavLink>
            <NotificationBell />
            {user && (
              <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                {user.full_name}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-lg p-2 hover:bg-gray-100 md:hidden">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1">
        <CustomerRoutes />
      </main>
    </div>
  )
}
