import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut, Menu } from 'lucide-react'
import { AppLogo } from '../components/shared/AppLogo'
import { NotificationBell } from '../components/shared/NotificationBell'
import { RoleBadge } from '../components/shared/RoleBadge'
import type { NavItem } from '../lib/constants'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import type { UserRole } from '../types/auth.types'
import { cn } from '../lib/utils'

export interface SidebarTheme {
  sidebarBg: string
  sidebarText: string
  sidebarMuted: string
  accent: string
  accentHover: string
  activeBg: string
  activeText: string
  navbarBg: string
  navbarBorder: string
  logoVariant: 'light' | 'dark'
  bellIconClass?: string
}

interface SidebarLayoutProps {
  role: UserRole
  navItems: NavItem[]
  theme: SidebarTheme
  children: ReactNode
}

export function SidebarLayout({ role, navItems, theme, children }: SidebarLayoutProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUiStore()

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
        )}
        style={{ backgroundColor: theme.sidebarBg, color: theme.sidebarText }}
      >
        <div
          className={cn(
            'flex h-[var(--navbar-height)] items-center border-b px-4',
            sidebarCollapsed ? 'justify-center' : 'justify-between',
          )}
          style={{ borderColor: `${theme.sidebarMuted}33` }}
        >
          {!sidebarCollapsed && <AppLogo variant={theme.logoVariant} />}
          {sidebarCollapsed && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{ backgroundColor: theme.accent, color: theme.activeText }}
            >
              U
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ label, path, icon: Icon, badge }) => (
            <NavLink
              key={path}
              to={path}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                'block rounded-lg transition-colors hover:opacity-90',
                sidebarCollapsed && 'px-0',
              )}
            >
              {({ isActive }) => (
                <span
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium',
                    sidebarCollapsed && 'justify-center px-2',
                    isActive && 'shadow-sm',
                  )}
                  style={
                    isActive
                      ? { backgroundColor: theme.activeBg, color: theme.activeText }
                      : { color: theme.sidebarMuted }
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-[10px] font-bold text-white',
                        sidebarCollapsed && 'absolute -right-0.5 -top-0.5 h-4 min-w-4',
                      )}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3" style={{ borderColor: `${theme.sidebarMuted}33` }}>
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-90',
              sidebarCollapsed && 'justify-center',
            )}
            style={{ color: theme.sidebarMuted }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[var(--sidebar-collapsed)]' : 'ml-[var(--sidebar-width)]',
        )}
      >
        <header
          className="sticky top-0 z-20 flex h-[var(--navbar-height)] items-center justify-between border-b px-6"
          style={{ backgroundColor: theme.navbarBg, borderColor: theme.navbarBorder }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            {user && (
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                <RoleBadge role={role} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell className={theme.bellIconClass} />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
