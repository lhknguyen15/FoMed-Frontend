import { useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/images/FoMed_Logo.png'
import { ApiError } from '../../../shared/api/api-error'
import { AuthField } from '../components/AuthField'
import { useAuth } from '../hooks/useAuth'

type FormState = { fullName: string; phone: string; email: string; dateOfBirth: string; password: string; confirmPassword: string }
const initialForm: FormState = { fullName: '', phone: '', email: '', dateOfBirth: '', password: '', confirmPassword: '' }

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [accepted, setAccepted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const canSubmit = useMemo(() => Boolean(form.fullName && form.phone && form.password && form.confirmPassword && accepted), [accepted, form])
  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const errors: Partial<Record<keyof FormState, string>> = {}
    if (form.fullName.trim().length < 2) errors.fullName = 'Họ tên phải có ít nhất 2 ký tự.'
    if (!/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Số điện thoại không hợp lệ.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email không hợp lệ.'
    if (form.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Xác nhận mật khẩu không khớp.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate() || !accepted) return
    setLoading(true)
    setError('')
    try {
      await register({
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\s/g, ''),
        email: form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth ? `${form.dateOfBirth}T00:00:00` : undefined,
        password: form.password,
      })
      navigate('/booking', { replace: true })
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : 'Không thể tạo tài khoản.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="w-full max-w-[560px] py-4">
    <div className="mb-6 flex items-center justify-between"><Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft className="size-4" /> Đăng nhập</Link><div className="flex items-center gap-2 lg:hidden"><img src={logo} alt="FoMed" className="size-9 object-contain" /><span className="font-display text-xl font-extrabold">FoMed</span></div></div>
    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-teal-700">Cổng bệnh nhân</p>
    <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tạo tài khoản FoMed</h2>
    <p className="mt-2 text-sm text-slate-500">Đăng ký một lần để đặt lịch và quản lý hành trình khám bệnh.</p>

    {error && <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><AlertCircle className="mt-0.5 size-[18px] shrink-0" />{error}</div>}

    <form onSubmit={submit} className="mt-6 grid gap-x-4 gap-y-4 sm:grid-cols-2">
      <AuthField label="Họ và tên *" icon={<UserRound className="size-[18px]" />} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Nguyễn Văn An" autoComplete="name" error={fieldErrors.fullName} disabled={loading} />
      <AuthField label="Số điện thoại *" icon={<Phone className="size-[18px]" />} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0901 234 567" autoComplete="tel" error={fieldErrors.phone} disabled={loading} />
      <AuthField label="Email" icon={<Mail className="size-[18px]" />} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="ban@email.com" autoComplete="email" error={fieldErrors.email} disabled={loading} />
      <AuthField label="Ngày sinh" icon={<CalendarDays className="size-[18px]" />} type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} max={new Date().toISOString().slice(0, 10)} error={fieldErrors.dateOfBirth} disabled={loading} />
      <AuthField label="Mật khẩu *" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" error={fieldErrors.password} disabled={loading} trailing={<button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(!visible)} className="text-slate-400">{visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button>} />
      <AuthField label="Xác nhận mật khẩu *" icon={<LockKeyhole className="size-[18px]" />} type={visible ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" error={fieldErrors.confirmPassword} disabled={loading} />
      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/60 p-3 text-xs leading-5 text-slate-500 sm:col-span-2"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-teal-700" /><span>Tôi đồng ý với <button type="button" className="font-semibold text-teal-700">điều khoản sử dụng</button> và chính sách bảo mật dữ liệu y tế của FoMed.</span></label>
      <button disabled={!canSubmit || loading} className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-800/15 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">{loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang tạo tài khoản...</> : <>Tạo tài khoản <ArrowRight className="size-[18px]" /></>}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link to="/login" className="font-bold text-teal-700">Đăng nhập</Link></p>
  </div>
}
