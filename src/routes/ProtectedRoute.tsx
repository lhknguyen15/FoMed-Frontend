import { Navigate, Outlet, useLocation } from 'react-router-dom'
import logo from '../assets/images/FoMed_Logo.png'
import { useAuth } from '../modules/auth/hooks/useAuth'

export default function ProtectedRoute() {
  const { isAuthenticated, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) return <div className="grid min-h-screen place-items-center bg-[#f4f8f7]"><div className="text-center"><img src={logo} alt="FoMed" className="mx-auto size-16 object-contain" /><span className="mt-3 block text-sm font-semibold text-slate-500">Đang khôi phục phiên đăng nhập...</span></div></div>
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
  }
  return <Outlet />
}
