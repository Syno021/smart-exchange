import { useRequireRole } from '../hooks/useRequireRole'
import { NAV } from '../lib/constants'
import { AdminRoutes } from '../portals/admin/routes'
import { SidebarLayout } from './SidebarLayout'

const adminTheme = {
  sidebarBg: '#1A1D23',
  sidebarText: '#FFFFFF',
  sidebarMuted: '#A0A8B3',
  accent: '#00843D',
  accentHover: '#00732F',
  activeBg: '#00843D',
  activeText: '#FFFFFF',
  navbarBg: '#FFFFFF',
  navbarBorder: '#E5E7EB',
  logoVariant: 'light' as const,
}

export function AdminLayout() {
  const { isAuthorized } = useRequireRole('admin')

  if (!isAuthorized) return null

  return (
    <SidebarLayout role="admin" navItems={NAV.admin} theme={adminTheme}>
      <AdminRoutes />
    </SidebarLayout>
  )
}
