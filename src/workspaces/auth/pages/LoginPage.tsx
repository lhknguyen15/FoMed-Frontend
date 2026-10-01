import { useState } from 'react'
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../../assets/images/FoMed_Logo.png'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField } from '../../../features/auth/components/AuthField'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { getRoleHome } from '../../../routes/role-home'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await login({ username: username.trim(), password }, remember)
      const params = new URLSearchParams(location.search)
      navigate(params.get('returnUrl') || getRoleHome(user), { replace: true })
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : 'Đăng nhập không thành công.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="w-full max-w-[430px]">
    <div className="mb-9 flex items-center gap-3 lg:hidden"><span className="grid size-11 place-items-center rounded-2xl bg-white shadow-sm"><img src={logo} alt="FoMed" className="size-9 object-contain" /></span><span className="font-display text-2xl font-extrabold text-slate-900">Fo<span className="text-teal-700">Med</span></span></div>
    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-teal-700">Chào mừng trở lại</p>
    <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900">Đăng nhập</h2>
    <p className="mt-3 text-sm leading-6 text-slate-500">Sử dụng tài khoản FoMed để truy cập không gian làm việc của bạn.</p>

    {error && <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><AlertCircle className="mt-0.5 size-[18px] shrink-0" /><span>{error}</span></div>}

    <form onSubmit={submit} className="mt-7 space-y-5">
      <AuthField label="Tên đăng nhập hoặc email" icon={<Mail className="size-[18px]" />} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Nhập tên đăng nhập" disabled={loading} />
      <AuthField label="Mật khẩu" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Nhập mật khẩu" disabled={loading} trailing={<button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(!visible)} className="text-slate-400 hover:text-slate-700">{visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button>} />
      <div className="flex items-center justify-between text-sm"><label className="flex cursor-pointer items-center gap-2 text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 rounded accent-teal-700" />Ghi nhớ đăng nhập</label><Link to="/forgot-password" className="font-semibold text-teal-700 hover:text-teal-900">Quên mật khẩu?</Link></div>
      <button disabled={loading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-800/15 transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-70">{loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang xác thực...</> : <>Đăng nhập <ArrowRight className="size-[18px] transition group-hover:translate-x-0.5" /></>}</button>
    </form>
    <p className="mt-8 text-center text-sm text-slate-500">Bạn chưa có tài khoản? <Link to="/register" className="font-bold text-teal-700 hover:text-teal-900">Đăng ký ngay</Link></p>
    <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của FoMed.</p>
  </div>
}
