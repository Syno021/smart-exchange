import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { AuthLayout } from './layouts/AuthLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { ManagerLayout } from './layouts/ManagerLayout'
import { CashierLayout } from './layouts/CashierLayout'
import { CustomerLayout } from './layouts/CustomerLayout'
import { SupplierLayout } from './layouts/SupplierLayout'
import { LoginPage } from './portals/auth/LoginPage'
import { RegisterPage } from './portals/auth/RegisterPage'
import { ROLE_HOME } from './lib/rolePaths'

function RoleRedirect() {
  const role = useAuthStore((s) => s.role)
  return <Navigate to={role ? (ROLE_HOME[role] ?? '/login') : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/manager/*" element={<ManagerLayout />} />
      <Route path="/cashier/*" element={<CashierLayout />} />
      <Route path="/shop/*" element={<CustomerLayout />} />
      <Route path="/supplier/*" element={<SupplierLayout />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  )
}
