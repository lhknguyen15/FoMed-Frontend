import { useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField } from '../../../features/auth/components/AuthField'
import { authApi } from '../../../features/auth/api/auth-api'

export default function ChangePasswordPage() {
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

  return <Card className="overflow-hidden">
    <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><ShieldCheck className="size-5" /></span>
      <div><h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">Đổi mật khẩu</h2><p className="mt-1 text-sm leading-5 text-slate-500">Sử dụng mật khẩu mạnh và không chia sẻ với người khác.</p></div>
    </div>
    <div className="p-5 sm:p-6">
      {error && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><AlertCircle className="size-[18px] shrink-0" />{error}</div>}
      {message && <div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"><CheckCircle2 className="size-[18px] shrink-0" />{message}</div>}
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <AuthField label="Mật khẩu hiện tại" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" disabled={loading} />
        <AuthField label="Mật khẩu mới" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" disabled={loading} trailing={<button type="button" onClick={() => setVisible(!visible)} className="text-slate-400">{visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button>} />
        <AuthField label="Xác nhận mật khẩu mới" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" disabled={loading} />
        <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" disabled={loading || !oldPassword || !newPassword || !confirmPassword}>{loading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}</Button></div>
      </form>
    </div>
  </Card>
}
