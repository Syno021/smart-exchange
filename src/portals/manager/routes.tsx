import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { InventoryPage } from './InventoryPage'
import { ProductFormPage } from './ProductFormPage'
import { ProductsPage } from './ProductsPage'
import { ProductTrendsPage } from './ProductTrendsPage'
import { PurchaseOrderFormPage } from './PurchaseOrderFormPage'
import { PurchaseOrdersPage } from './PurchaseOrdersPage'
import { SalesMonitorPage } from './SalesMonitorPage'
import { StockReceivingPage } from './StockReceivingPage'
import { SuppliersPage } from './SuppliersPage'

export function ManagerRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/new" element={<ProductFormPage />} />
      <Route path="products/:id/edit" element={<ProductFormPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="stock-receiving" element={<StockReceivingPage />} />
      <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />
      <Route path="sales" element={<SalesMonitorPage />} />
      <Route path="trends" element={<ProductTrendsPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  )
}
