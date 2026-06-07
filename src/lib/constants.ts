import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  ClipboardList,
  CreditCard,
  Database,
  Gift,
  History,
  Home,
  LayoutDashboard,
  Package,
  PackageCheck,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  User,
  Users,
  Warehouse,
} from 'lucide-react'
import type { UserRole } from '../types/auth.types'
import type { PaymentMethod } from '../types/sale.types'
import type { POStatus } from '../types/order.types'
import type { SaleStatus } from '../types/sale.types'

export const ROLES: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: '#FFFFFF', bg: '#1A1D23' },
  manager: { label: 'Manager', color: '#FFFFFF', bg: '#00843D' },
  cashier: { label: 'Cashier', color: '#1A1D23', bg: '#FFFFFF' },
  customer: { label: 'Customer', color: '#1A1D23', bg: '#FFFFFF' },
  supplier: { label: 'Supplier', color: '#FFFFFF', bg: '#1C2B3A' },
}

export const STATUS_COLORS: Record<string, string> = {
  // Sale statuses
  completed: 'bg-brand-100 text-brand-700',
  voided: 'bg-gray-100 text-gray-600',
  refunded: 'bg-warning-100 text-warning-500',
  pending: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-brand-100 text-brand-800',
  // PO statuses
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-brand-100 text-brand-700',
  shipped: 'bg-purple-100 text-purple-700',
  received: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-danger-100 text-danger-600',
  // Stock statuses
  active: 'bg-brand-100 text-brand-700',
  inactive: 'bg-gray-100 text-gray-500',
  low: 'bg-warning-100 text-warning-500',
  out: 'bg-danger-100 text-danger-600',
  // Backup
  success: 'bg-brand-100 text-brand-700',
  failed: 'bg-danger-100 text-danger-600',
}

export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'loyalty', label: 'Loyalty Points' },
]

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  shipped: 'Shipped',
  received: 'Received',
  cancelled: 'Cancelled',
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  completed: 'Completed',
  voided: 'Voided',
  refunded: 'Refunded',
  pending: 'Pending',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Activity', path: '/admin/activity', icon: Activity },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Backup', path: '/admin/backup', icon: Database },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ],
  manager: [
    { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/manager/products', icon: Package },
    { label: 'Inventory', path: '/manager/inventory', icon: Warehouse },
    { label: 'Stock Receiving', path: '/manager/stock-receiving', icon: PackageCheck },
    { label: 'Purchase Orders', path: '/manager/purchase-orders', icon: ClipboardList },
    { label: 'Sales Monitor', path: '/manager/sales', icon: Receipt },
    { label: 'Product Trends', path: '/manager/trends', icon: TrendingUp },
    { label: 'Suppliers', path: '/manager/suppliers', icon: Truck },
  ],
  cashier: [
    { label: 'POS', path: '/cashier/pos', icon: CreditCard },
    { label: 'Deliveries', path: '/cashier/deliveries', icon: Truck },
    { label: 'Transactions', path: '/cashier/transactions', icon: History },
    { label: 'Products', path: '/cashier/products', icon: Store },
  ],
  customer: [
    { label: 'Home', path: '/shop', icon: Home },
    { label: 'Shop', path: '/shop/browse', icon: ShoppingBag },
    { label: 'Cart', path: '/shop/cart', icon: ShoppingCart },
    { label: 'Orders', path: '/shop/orders', icon: ClipboardList },
    { label: 'Loyalty', path: '/shop/loyalty', icon: Gift },
    { label: 'Profile', path: '/shop/profile', icon: User },
  ],
  supplier: [
    { label: 'Dashboard', path: '/supplier/dashboard', icon: LayoutDashboard },
    { label: 'Purchase Orders', path: '/supplier/orders', icon: ClipboardList },
    { label: 'Products', path: '/supplier/products', icon: Package },
    { label: 'Deliveries', path: '/supplier/deliveries', icon: Truck },
    { label: 'Profile', path: '/supplier/profile', icon: User },
  ],
}

export const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE ?? 0.15)
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Ubuntu Smart Mart'
export const CURRENCY = import.meta.env.VITE_CURRENCY ?? 'R'
export const STORE_ADDRESS =
  import.meta.env.VITE_STORE_ADDRESS ?? 'Chesterville, Durban, KZN'
