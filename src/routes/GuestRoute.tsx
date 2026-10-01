import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../modules/auth/hooks/useAuth'
import { getRoleHome } from '../modules/auth/utils/get-role-home'

export default function GuestRoute() {
  const { user, isReady } = useAuth()
  if (!isReady) return null
  return user ? <Navigate to={getRoleHome(user)} replace /> : <Outlet />
}
