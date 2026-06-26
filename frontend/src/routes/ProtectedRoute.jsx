import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { canAccessRoute } from '@/data/navigation'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function RoleGuard({ children }) {
  const { user } = useAuth()
  const path = window.location.pathname

  if (!canAccessRoute(user?.role, path)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
