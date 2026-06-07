import api from '../lib/axios'
import type { ApiResponse, AuditLogEntry } from '../types/api.types'

export interface SalesSummaryReport {
  period: string
  date_from: string
  date_to: string
  summary: {
    total_sales: number
    total_revenue: number
    total_discounts: number
    total_tax: number
    avg_sale_value: number
  }
  trend: Array<{
    period_label: string
    sales_count: number
    revenue: number
  }>
}

export interface TopProductsReport {
  date_from: string
  date_to: string
  products: Array<{
    product_id: number
    name: string
    sku: string
    barcode?: string
    units_sold: number
    revenue: number
    order_count: number
  }>
}

export interface RevenueExpensesReport {
  date_from: string
  date_to: string
  total_revenue: number
  total_expenses: number
  net_profit: number
  expenses_by_category: Array<{
    category: string
    total: number
  }>
  monthly: Array<{
    month_label: string
    revenue: number
    expenses: number
  }>
}

export interface CashierPerformanceReport {
  date_from: string
  date_to: string
  cashiers: Array<{
    user_id: number
    full_name: string
    username: string
    total_sales: number
    total_revenue: number
    avg_sale_value: number
    total_discounts: number
  }>
}

export interface StockValueReport {
  totals: {
    total_products: number
    total_units: number
    cost_value: number
    retail_value: number
    potential_margin: number
  }
  by_category: Array<{
    category_id: number
    category_name: string
    product_count: number
    total_units: number
    cost_value: number
    retail_value: number
  }>
  low_stock_count: number
}

export interface DatabaseOverviewReport {
  date_from: string
  date_to: string
  users: {
    total: number
    active: number
    inactive: number
    by_role: Array<{ role: string; count: number }>
  }
  products: {
    total: number
    active: number
    low_stock: number
  }
  customers: number
  suppliers: number
  categories: number
  sales: {
    period: {
      total_sales: number
      total_revenue: number
      avg_sale_value: number
    }
    today: {
      count: number
      revenue: number
    }
  }
  purchase_orders: {
    total: number
    pending: number
    approved: number
    received: number
  }
  expenses_total: number
  stock_movements: number
}

export interface RecentChangesReport {
  since: string
  generated_at: string
  audit_entries: AuditLogEntry[]
  recent_sales: Array<{
    sale_id: number
    sale_ref: string
    total_amt: number
    status: string
    created_at: string
    cashier_name?: string
  }>
  stock_movements: Array<{
    movement_id: number
    movement_type: string
    qty_change: number
    created_at: string
    product_name: string
    user_name?: string
  }>
  updated_products: Array<{
    product_id: number
    name: string
    sku: string
    stock_qty: number
    updated_at: string
  }>
  changes_summary: {
    audit_count: number
    new_users: number
    sales_current: { count: number; revenue: number }
    sales_previous: { count: number; revenue: number }
    sales_count_delta: number
    sales_revenue_delta: number
  }
}

export const reportService = {
  salesSummary: (params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    date_from?: string
    date_to?: string
  }) => api.get<ApiResponse<SalesSummaryReport>>('/reports/sales-summary', { params }),

  topProducts: (params?: { date_from?: string; date_to?: string; limit?: number }) =>
    api.get<ApiResponse<TopProductsReport>>('/reports/top-products', { params }),

  revenueExpenses: (params?: { date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<RevenueExpensesReport>>('/reports/revenue-expenses', { params }),

  cashierPerformance: (params?: { date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<CashierPerformanceReport>>('/reports/cashier-performance', { params }),

  stockValue: () => api.get<ApiResponse<StockValueReport>>('/reports/stock-value'),

  overview: (params?: { date_from?: string; date_to?: string }) =>
    api.get<ApiResponse<DatabaseOverviewReport>>('/reports/overview', { params }),

  recentChanges: (params?: { since?: string; limit?: number }) =>
    api.get<ApiResponse<RecentChangesReport>>('/reports/recent-changes', { params }),
}
