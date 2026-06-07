import { useCallback, useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types/auth.types'

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['users', 'reports', 'backup', 'audit', 'settings', 'all'],
  manager: ['products', 'inventory', 'purchase-orders', 'suppliers', 'sales', 'stock'],
  cashier: ['pos', 'sales', 'products-read'],
  customer: ['shop', 'cart', 'orders', 'loyalty', 'profile'],
  supplier: ['purchase-orders', 'products', 'deliveries', 'profile'],
}

export function usePermissions() {
  const role = useAuthStore((s) => s.role)

  const permissions = useMemo(
    () => (role ? ROLE_PERMISSIONS[role] : []),
    [role],
  )

  const canAccess = useCallback(
    (roles: UserRole[]) => (role ? roles.includes(role) : false),
    [role],
  )

  const hasPermission = useCallback(
    (permission: string) =>
      permissions.includes('all') || permissions.includes(permission),
    [permissions],
  )

  return {
    role,
    permissions,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isCashier: role === 'cashier',
    isCustomer: role === 'customer',
    isSupplier: role === 'supplier',
    isStaff: role === 'admin' || role === 'manager' || role === 'cashier',
    canAccess,
    hasPermission,
  }
}
