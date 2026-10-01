import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import { getRoleHome } from './role-home'

export default function GuestRoute() {
  const { user, isReady } = useAuth()
  if (!isReady) return null
  return user ? <Navigate to={getRoleHome(user)} replace /> : <Outlet />
}
