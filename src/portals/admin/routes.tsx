import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { DatabaseBackupPage } from './pages/DatabaseBackupPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SystemActivityPage } from './pages/SystemActivityPage'
import { UserManagementPage } from './pages/UserManagementPage'

export function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<UserManagementPage />} />
      <Route path="activity" element={<SystemActivityPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="backup" element={<DatabaseBackupPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  )
}
