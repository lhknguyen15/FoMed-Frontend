import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { validateDoctor, type DoctorFormValues } from '../../../features/doctors/schemas/doctor-schema'
import type { Doctor, Specialty } from '../../../features/doctors/types/doctor'
import DoctorForm from '../../../features/doctors/components/DoctorForm'

type Props = {
  doctor?: Doctor | null
  specialties: Specialty[]
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: (values: DoctorFormValues) => Promise<void>
}

const empty: DoctorFormValues = { username: '', password: '', email: '', fullName: '', specialtyId: '', title: '', licenseNumber: '', phone: '', room: '', consultationFee: '0', isActive: true, avatarUrl: '', biography: '', practiceStartYear: '' }

export default function DoctorAdminForm({ doctor, specialties, submitting, apiError, onCancel, onSubmit }: Props) {
  const [values, setValues] = useState<DoctorFormValues>(() => doctor ? {
    ...empty,
    fullName: doctor.fullName,
    specialtyId: String(doctor.specialtyId),
    title: doctor.title ?? '',
    licenseNumber: doctor.licenseNumber ?? '',
    phone: doctor.phone ?? '',
    room: doctor.room ?? '',
    consultationFee: String(doctor.consultationFee),
    isActive: doctor.isActive,
    avatarUrl: doctor.avatarUrl ?? '',
    biography: doctor.biography ?? '',
    practiceStartYear: doctor.practiceStartYear == null ? '' : String(doctor.practiceStartYear),
  } : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof DoctorFormValues, string>>>({})
  const update = (key: keyof DoctorFormValues, value: string | boolean) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validateDoctor(values, Boolean(doctor))
    const selectedSpecialty = specialties.find((item) => item.specialtyId === Number(values.specialtyId))
    if (selectedSpecialty && !selectedSpecialty.isActive) nextErrors.specialtyId = 'Hãy chọn một chuyên khoa đang hoạt động.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    await onSubmit(values)
  }
  const field = (key: keyof DoctorFormValues, label: string, options: { type?: string; placeholder?: string; required?: boolean } = {}) => <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{options.required && ' *'}</span><input type={options.type ?? 'text'} value={String(values[key])} onChange={(event) => update(key, event.target.value)} placeholder={options.placeholder} className="input-base" />{errors[key] && <small className="mt-1 block text-rose-600">{errors[key]}</small>}</label>

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="grid min-h-full place-items-center py-4"><form onSubmit={submit} className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Hồ sơ bác sĩ</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{doctor ? 'Cập nhật bác sĩ' : 'Thêm bác sĩ'}</h2></div><button type="button" onClick={onCancel} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
    {apiError && <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{apiError}</div>}
    {!doctor && <div className="mt-6 grid gap-4 sm:grid-cols-2">{field('username', 'Tên đăng nhập', { required: true })}{field('password', 'Mật khẩu ban đầu', { type: 'password', required: true })}{field('email', 'Email', { type: 'email', placeholder: 'bacsi@fomed.vn' })}</div>}
    <div className={`${doctor ? 'mt-6' : 'mt-4'} grid gap-4 sm:grid-cols-2`}>{field('fullName', 'Họ và tên', { required: true })}<label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Chuyên khoa *</span><select value={values.specialtyId} onChange={(event) => update('specialtyId', event.target.value)} className="input-base"><option value="">Chọn chuyên khoa</option>{specialties.map((item) => <option key={item.specialtyId} value={item.specialtyId} disabled={!item.isActive}>{item.name}{item.isActive ? '' : ' (ngừng hoạt động)'}</option>)}</select>{errors.specialtyId && <small className="mt-1 block text-rose-600">{errors.specialtyId}</small>}</label>{field('title', 'Học hàm / chức danh', { placeholder: 'BS.CKI, TS.BS...' })}{field('licenseNumber', 'Số chứng chỉ hành nghề')}{field('phone', 'Số điện thoại')}{field('room', 'Phòng khám')}{field('consultationFee', 'Phí khám', { type: 'number', required: true })}{doctor && <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={values.isActive} onChange={(event) => update('isActive', event.target.checked)} className="size-4 accent-teal-700" /><span className="text-sm font-semibold text-slate-700">Bác sĩ đang hoạt động</span></label>}</div>
    <div className="mt-6 border-t border-slate-100 pt-5"><DoctorForm values={values} errors={errors} onChange={update} disabled={submitting} /></div>
    <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : doctor ? 'Lưu thay đổi' : 'Tạo bác sĩ'}</Button></div>
  </form></div></div>
}
