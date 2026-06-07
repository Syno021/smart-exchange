import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './HomePage'
import { ShopPage } from './ShopPage'
import { ProductDetailPage } from './ProductDetailPage'
import { CartPage } from './CartPage'
import { CheckoutPage } from './CheckoutPage'
import { OrderHistoryPage } from './OrderHistoryPage'
import { LoyaltyCardPage } from './LoyaltyCardPage'
import { ProfilePage } from './ProfilePage'

export function CustomerRoutes() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="browse" element={<ShopPage />} />
      <Route path="browse/:id" element={<ProductDetailPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="orders" element={<OrderHistoryPage />} />
      <Route path="loyalty" element={<LoyaltyCardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  )
}
