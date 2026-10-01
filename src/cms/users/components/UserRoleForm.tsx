import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { AdminRole, AdminUser } from '../../../features/auth/types/auth'

type Props = {
  user: AdminUser
  roles: AdminRole[]
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: (roles: string[]) => Promise<void>
}

export default function UserRoleForm({ user, roles, submitting, apiError, onCancel, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>(user.roles)
  const [validationError, setValidationError] = useState('')
  const toggle = (role: string) => {
    setSelected((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])
    setValidationError('')
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected.length) { setValidationError('Phải chọn ít nhất một quyền.'); return }
    await onSubmit(selected)
  }
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Phân quyền tài khoản</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Cập nhật vai trò</h2><p className="mt-1 text-sm text-slate-500">{user.fullName || user.username}</p></div><button type="button" onClick={onCancel} aria-label="Đóng" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
      <div className="mt-6 space-y-3">{roles.map((role) => <label key={role.roleId} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-teal-300"><span><strong className="block text-sm text-slate-800">{role.name}</strong><small className="text-slate-500">{role.userCount} tài khoản</small></span><input type="checkbox" checked={selected.includes(role.name)} onChange={() => toggle(role.name)} className="size-4 accent-teal-700" /></label>)}</div>
      {(validationError || apiError) && <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{validationError || apiError}</p>}
      <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu vai trò'}</Button></div>
    </form>
  </div>
}
