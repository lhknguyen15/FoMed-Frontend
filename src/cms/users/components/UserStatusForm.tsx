import { AlertTriangle, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { AdminUser } from '../../../features/auth/types/auth'

type Props = {
  user: AdminUser
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: () => Promise<void>
}

export default function UserStatusForm({ user, submitting, apiError, onCancel, onSubmit }: Props) {
  const activating = !user.isActive
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form onSubmit={(event) => { event.preventDefault(); void onSubmit() }} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Tài khoản người dùng</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{activating ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</h2></div><button type="button" onClick={onCancel} aria-label="Đóng" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
      <div className={`mt-6 flex gap-3 rounded-xl p-4 text-sm ${activating ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}><AlertTriangle className="size-5 shrink-0" /><p>Bạn có chắc muốn {activating ? 'mở khóa' : 'khóa'} tài khoản <strong>{user.fullName || user.username}</strong> không? {activating ? '' : 'Các phiên đăng nhập hiện tại sẽ bị thu hồi.'}</p></div>
      {apiError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{apiError}</p>}
      <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" variant={activating ? 'primary' : 'danger'} disabled={submitting}>{submitting ? 'Đang cập nhật...' : activating ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</Button></div>
    </form>
  </div>
}
