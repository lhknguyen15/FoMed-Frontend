import { useState } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '../../../assets/images/FoMed_Logo.png'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField } from '../components/AuthField'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { getRoleHome } from '../utils/get-role-home'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 8) return setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if (newPassword !== confirmPassword) return setError('Xác nhận mật khẩu mới không khớp.')
    if (oldPassword === newPassword) return setError('Mật khẩu mới phải khác mật khẩu hiện tại.')
    setLoading(true)
    setError('')
    setMessage('')
    try {
      setMessage(await authApi.changePassword({ oldPassword, newPassword, confirmPassword }))
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : 'Không thể đổi mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f4f8f7] p-5">
    <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
      <div className="flex items-center justify-between"><button onClick={() => user && navigate(getRoleHome(user))} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft className="size-4" /> Quay lại</button><img src={logo} alt="FoMed" className="size-11 object-contain" /></div>
      <span className="mt-7 grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><ShieldCheck className="size-6" /></span>
      <h1 className="mt-4 font-display text-3xl font-bold text-slate-900">Đổi mật khẩu</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Sử dụng mật khẩu mạnh và không chia sẻ mật khẩu với người khác.</p>
      {error && <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><AlertCircle className="size-[18px] shrink-0" />{error}</div>}
      {message && <div role="status" className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"><CheckCircle2 className="size-[18px] shrink-0" />{message}</div>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthField label="Mật khẩu hiện tại" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" disabled={loading} />
        <AuthField label="Mật khẩu mới" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" disabled={loading} trailing={<button type="button" onClick={() => setVisible(!visible)} className="text-slate-400">{visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button>} />
        <AuthField label="Xác nhận mật khẩu mới" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" disabled={loading} />
        <button disabled={loading || !oldPassword || !newPassword || !confirmPassword} className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-800/15 hover:bg-teal-800 disabled:opacity-50">{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
      </form>
    </section>
  </main>
}
