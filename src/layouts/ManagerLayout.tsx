import { useRequireRole } from '../hooks/useRequireRole'
import { NAV } from '../lib/constants'
import { ManagerRoutes } from '../portals/manager/routes'
import { SidebarLayout } from './SidebarLayout'

const managerTheme = {
  sidebarBg: '#00843D',
  sidebarText: '#FFFFFF',
  sidebarMuted: '#C0E4CC',
  accent: '#FFFFFF',
  accentHover: '#E6F4EC',
  activeBg: '#FFFFFF',
  activeText: '#00843D',
  navbarBg: '#FFFFFF',
  navbarBorder: '#E5E7EB',
  logoVariant: 'light' as const,
}

export function ManagerLayout() {
  const { isAuthorized } = useRequireRole('manager')

  if (!isAuthorized) return null

  return (
    <SidebarLayout role="manager" navItems={NAV.manager} theme={managerTheme}>
      <ManagerRoutes />
    </SidebarLayout>
  )
}
