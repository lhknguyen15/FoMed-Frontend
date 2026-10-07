import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'
import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, LoaderCircle, ShieldCheck, UserRound } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { authApi } from '../../../features/auth/api/auth-api'
import type { UserProfile } from '../../../features/auth/types/auth'
import { useAuth } from '../../../features/auth/hooks/useAuth'

export default function AccountProfilePage() {
  const { updateFullName } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void authApi.getProfile().then((data) => {
      if (!active) return
      setProfile(data)
      setFullName(data.fullName ?? '')
      setPhone(data.phone ?? '')
    }).catch((reason: unknown) => {
      if (active) setError(displayError(reason, 'Không thể tải hồ sơ.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!fullName.trim()) { setError('Vui lòng nhập họ và tên.'); return }
    if (profile?.phone && !phone.trim()) { setError('Hệ thống hiện chưa hỗ trợ xóa số điện thoại. Hãy nhập số mới hoặc giữ nguyên số hiện tại.'); return }
    setSaving(true); setError('')
    try {
      const updated = await authApi.updateProfile({ fullName: fullName.trim(), phone: phone.trim() || undefined })
      setProfile(updated)
      setFullName(updated.fullName)
      setPhone(updated.phone ?? '')
      updateFullName(updated.fullName)
      notify.success('Thông tin hồ sơ đã được cập nhật.')
    } catch (reason) {
      setError(displayError(reason, 'Không thể cập nhật hồ sơ.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Card className="grid min-h-64 place-items-center"><span className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" />Đang tải hồ sơ…</span></Card>
  if (!profile) return <Card className="p-5 sm:p-6">{error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}</Card>

  const initials = fullName.trim().split(/\s+/).map((part) => part[0]).slice(-2).join('').toUpperCase()
  return <>
    {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.7fr)] xl:gap-5">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-4 lg:flex-col lg:items-start">
          <span aria-label="Ảnh đại diện" className="grid size-[76px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 font-display text-2xl font-bold text-teal-800 ring-4 ring-teal-50">{initials || <UserRound className="size-8" />}</span>
          <div className="min-w-0"><h2 className="truncate font-display text-lg font-bold text-slate-900">{profile.fullName}</h2><p className="mt-1 break-all text-sm text-slate-500">{profile.email || 'Chưa có email'}</p></div>
        </div>
        <div className="my-5 border-t border-slate-100" />
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck className="size-4" />{profile.isActive ? 'Tài khoản đang hoạt động' : 'Tài khoản tạm khóa'}</div>
        <div className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Vai trò</p><div className="flex flex-wrap gap-2">{profile.roles.map((role) => <span key={role} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{role}</span>)}</div></div>
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5"><p className="text-xs font-semibold text-slate-600">Ảnh đại diện</p><p className="mt-1 text-xs leading-5 text-slate-500">Chức năng thay ảnh đại diện sẽ sớm được bổ sung.</p></div>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">Thông tin cá nhân</h2><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin nhận diện và liên hệ.</p></div>
        <form onSubmit={(event) => void submit(event)} className="space-y-5 p-5 sm:p-6">
          <label className="block"><span className="field-label">Họ và tên *</span><input autoComplete="name" required maxLength={150} value={fullName} onChange={(event) => setFullName(event.target.value)} className="input-base" /></label>
          <label className="block"><span className="field-label">Số điện thoại</span><input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="input-base" placeholder="Chưa cập nhật" /></label>
          <label className="block"><span className="field-label">Email</span><input type="email" value={profile.email ?? ''} readOnly className="input-base bg-slate-50 text-slate-500" /><span className="mt-1 block text-xs text-slate-400">Email hiện chưa hỗ trợ chỉnh sửa.</span></label>
          <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" disabled={saving || !fullName.trim()}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div>
        </form>
      </Card>
    </div>
  </>
}
