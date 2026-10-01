import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField } from '../components/AuthField'
import { useAuth } from '../hooks/useAuth'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Vui lòng nhập một địa chỉ email hợp lệ.')
      return
    }
    setLoading(true)
    setError('')
    try {
      setMessage(await forgotPassword(email.trim()))
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : 'Không thể gửi yêu cầu.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="w-full max-w-[430px]">
    <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft className="size-4" /> Quay lại đăng nhập</Link>
    <span className="grid size-13 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Mail className="size-6" /></span>
    <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-slate-900">Quên mật khẩu?</h2>
    <p className="mt-3 text-sm leading-6 text-slate-500">Nhập email đã đăng ký. Chúng tôi sẽ tiếp nhận yêu cầu khôi phục tài khoản của bạn.</p>

    {message ? <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="size-6 text-emerald-600" /><h3 className="mt-3 font-display font-bold text-emerald-900">Yêu cầu đã được tiếp nhận</h3><p className="mt-1 text-sm leading-6 text-emerald-700">{message}</p><Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800">Trở về đăng nhập <ArrowRight className="size-4" /></Link></div> : <form onSubmit={submit} className="mt-7 space-y-5">{error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><AlertCircle className="size-[18px] shrink-0" />{error}</div>}<AuthField label="Email" icon={<Mail className="size-[18px]" />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" autoComplete="email" disabled={loading} /><button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-800/15 hover:bg-teal-800 disabled:opacity-60">{loading ? 'Đang gửi yêu cầu...' : <>Gửi yêu cầu <ArrowRight className="size-[18px]" /></>}</button></form>}
  </div>
}
