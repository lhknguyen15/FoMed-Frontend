import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../modules/auth/hooks/useAuth'

export default function RoleRoute({ roles }: { roles: string[] }) {
  const { user } = useAuth()
  const allowed = user?.roles.some((userRole) => roles.some((role) => role.toLowerCase() === userRole.toLowerCase()))
  return allowed ? <Outlet /> : <Navigate to="/forbidden" replace />
}
