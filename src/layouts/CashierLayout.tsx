import { useQuery } from '@tanstack/react-query'
import { useRequireRole } from '../hooks/useRequireRole'
import { NAV } from '../lib/constants'
import { CashierRoutes } from '../portals/cashier/routes'
import { saleService } from '../services/sale.service'
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

  const deliveryQueueQuery = useQuery({
    queryKey: ['sales', 'delivery-queue-count'],
    queryFn: async () => {
      const { data } = await saleService.getAll({ per_page: 100, delivery_queue: 1 })
      return data.data.filter((o) => o.status === 'pending').length
    },
    refetchInterval: 30_000,
    enabled: isAuthorized,
  })

  const navItems = NAV.cashier.map((item) =>
    item.path === '/cashier/deliveries'
      ? { ...item, badge: deliveryQueueQuery.data ?? 0 }
      : item,
  )

  if (!isAuthorized) return null

  return (
    <SidebarLayout role="cashier" navItems={navItems} theme={cashierTheme}>
      <CashierRoutes />
    </SidebarLayout>
  )
}
