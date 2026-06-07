import { useRequireRole } from '../hooks/useRequireRole'
import { NAV } from '../lib/constants'
import { SupplierProfileGate } from '../portals/supplier/SupplierProfileGate'
import { SupplierRoutes } from '../portals/supplier/routes'
import { SidebarLayout } from './SidebarLayout'

const supplierTheme = {
  sidebarBg: '#1C2B3A',
  sidebarText: '#FFFFFF',
  sidebarMuted: '#94A3B8',
  accent: '#F59E0B',
  accentHover: '#D97706',
  activeBg: '#F59E0B',
  activeText: '#1C2B3A',
  navbarBg: '#FFFFFF',
  navbarBorder: '#E5E7EB',
  logoVariant: 'light' as const,
  bellIconClass: 'text-gray-600 hover:text-warning-500',
}

export function SupplierLayout() {
  const { isAuthorized } = useRequireRole('supplier')

  if (!isAuthorized) return null

  return (
    <SidebarLayout role="supplier" navItems={NAV.supplier} theme={supplierTheme}>
      <SupplierProfileGate>
        <SupplierRoutes />
      </SupplierProfileGate>
    </SidebarLayout>
  )
}
