import { Navigate, Route, Routes } from 'react-router-dom'
import { POSPage } from './POSPage'
import { ProductBrowserPage } from './ProductBrowserPage'
import { TransactionHistoryPage } from './TransactionHistoryPage'
import { DeliveryOrdersPage } from './DeliveryOrdersPage'

export function CashierRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="pos" replace />} />
      <Route path="pos" element={<POSPage />} />
      <Route path="deliveries" element={<DeliveryOrdersPage />} />
      <Route path="transactions" element={<TransactionHistoryPage />} />
      <Route path="products" element={<ProductBrowserPage />} />
      <Route path="*" element={<Navigate to="pos" replace />} />
    </Routes>
  )
}
