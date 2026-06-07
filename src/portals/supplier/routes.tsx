import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { PurchaseOrdersPage } from './PurchaseOrdersPage'
import { PODetailPage } from './PODetailPage'
import { ProductsPage } from './ProductsPage'
import { DeliveryHistoryPage } from './DeliveryHistoryPage'
import { ProfilePage } from './ProfilePage'

export function SupplierRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="orders" element={<PurchaseOrdersPage />} />
      <Route path="orders/:id" element={<PODetailPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="deliveries" element={<DeliveryHistoryPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  )
}
