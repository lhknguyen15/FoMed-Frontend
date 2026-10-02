import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { validateTimeOff, type TimeOffFormValues } from '../../../features/schedules/schemas/time-off-schema'
import type { DoctorTimeOff } from '../../../features/schedules/types/schedule'
import type { Doctor } from '../../../features/doctors/types/doctor'

type Props = {
  timeOff?: DoctorTimeOff | null
  doctors: Doctor[]
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: (values: TimeOffFormValues) => Promise<void>
}

function toDateTimeInput(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const empty: TimeOffFormValues = { doctorId: '', startAt: '', endAt: '', reason: '' }

export default function TimeOffForm({ timeOff, doctors, submitting, apiError, onCancel, onSubmit }: Props) {
  const [values, setValues] = useState<TimeOffFormValues>(() => timeOff ? { doctorId: timeOff.doctorId ? String(timeOff.doctorId) : '', startAt: toDateTimeInput(timeOff.startAt), endAt: toDateTimeInput(timeOff.endAt), reason: timeOff.reason ?? '' } : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof TimeOffFormValues, string>>>({})
  const update = (key: keyof TimeOffFormValues, value: string) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validateTimeOff(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    await onSubmit(values)
  }
  const field = (key: 'startAt' | 'endAt', label: string) => <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label} *</span><input type="datetime-local" value={values[key]} onChange={(event) => update(key, event.target.value)} className="input-base" />{errors[key] && <small className="mt-1 block text-rose-600">{errors[key]}</small>}</label>

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="grid min-h-full place-items-center py-4"><form onSubmit={submit} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Lịch nghỉ bác sĩ</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{timeOff ? 'Cập nhật lịch nghỉ' : 'Tạo lịch nghỉ'}</h2></div><button type="button" onClick={onCancel} aria-label="Đóng" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
    {apiError && <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{apiError}</div>}
    <div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Bác sĩ</span><select value={values.doctorId} onChange={(event) => update('doctorId', event.target.value)} className="input-base"><option value="">Nghỉ toàn phòng khám</option>{doctors.filter((doctor) => doctor.isActive).map((doctor) => <option key={doctor.doctorId} value={doctor.doctorId}>{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2">{field('startAt', 'Bắt đầu')}{field('endAt', 'Kết thúc')}</div><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Lý do</span><textarea value={values.reason} onChange={(event) => update('reason', event.target.value)} maxLength={255} rows={3} className="input-base resize-none" placeholder="Ví dụ: Nghỉ phép, đào tạo..." />{errors.reason && <small className="mt-1 block text-rose-600">{errors.reason}</small>}</label></div>
    <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : timeOff ? 'Lưu thay đổi' : 'Tạo lịch nghỉ'}</Button></div>
  </form></div></div>
}
