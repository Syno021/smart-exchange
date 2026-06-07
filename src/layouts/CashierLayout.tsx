import { useRequireRole } from '../hooks/useRequireRole'
import { NAV } from '../lib/constants'
import { CashierRoutes } from '../portals/cashier/routes'
import { SidebarLayout } from './SidebarLayout'

const cashierTheme = {
  sidebarBg: '#FFFFFF',
  sidebarText: '#1A1D23',
  sidebarMuted: '#6B7280',
  accent: '#00843D',
  accentHover: '#00732F',
  activeBg: '#E6F4EC',
  activeText: '#00843D',
  navbarBg: '#FFFFFF',
  navbarBorder: '#E5E7EB',
  logoVariant: 'dark' as const,
}

export function CashierLayout() {
  const { isAuthorized } = useRequireRole('cashier')

  if (!isAuthorized) return null

  return (
    <SidebarLayout role="cashier" navItems={NAV.cashier} theme={cashierTheme}>
      <CashierRoutes />
    </SidebarLayout>
  )
}
