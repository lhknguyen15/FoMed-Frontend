import { ArrowLeft, LogOut, ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { getRoleHome } from '../../../routes/role-home'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  return <main className="grid min-h-screen place-items-center bg-[#f4f8f7] p-6"><div className="max-w-md text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-600"><ShieldX className="size-8" /></span><p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-rose-600">403 · Không có quyền truy cập</p><h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Không gian này không thuộc vai trò của bạn</h1><p className="mt-3 text-sm leading-6 text-slate-500">Tài khoản hiện tại không có quyền mở trang này. Hãy quay lại không gian làm việc được cấp.</p><div className="mt-7 flex justify-center gap-3"><button onClick={() => user && navigate(getRoleHome(user))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white"><ArrowLeft className="size-4" /> Về trang chính</button><button onClick={() => { logout(); navigate('/login') }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600"><LogOut className="size-4" /> Đăng xuất</button></div></div></main>
}
