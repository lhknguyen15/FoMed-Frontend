import { useState } from 'react'
import { AlertCircle, KeyRound, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { AdminUser } from '../../../features/auth/types/auth'

type Props = {
  user: AdminUser
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: (password: string) => Promise<void>
}

export default function ResetPasswordForm({ user, submitting, apiError, onCancel, onSubmit }: Props) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [validationError, setValidationError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 8) { setValidationError('Mật khẩu phải có ít nhất 8 ký tự.'); return }
    if (password !== confirmation) { setValidationError('Mật khẩu xác nhận không khớp.'); return }
    setValidationError('')
    await onSubmit(password)
  }
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Bảo mật tài khoản</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h2><p className="mt-1 text-sm text-slate-500">{user.fullName || user.username}</p></div><button type="button" onClick={onCancel} aria-label="Đóng" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
      <div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu mới *</span><span className="relative block"><KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input autoFocus type="password" value={password} onChange={(event) => { setPassword(event.target.value); setValidationError('') }} className="input-base pl-10" autoComplete="new-password" /></span></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu *</span><input type="password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setValidationError('') }} className="input-base" autoComplete="new-password" /></label></div>
      {(validationError || apiError) && <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{validationError || apiError}</p>}
      <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</Button></div>
    </form>
  </div>
}
