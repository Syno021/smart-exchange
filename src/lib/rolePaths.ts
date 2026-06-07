import type { UserRole } from '../types/auth.types'

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  cashier: '/cashier/pos',
  customer: '/shop',
  supplier: '/supplier/dashboard',
}
