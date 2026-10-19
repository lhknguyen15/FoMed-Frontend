import { useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '../../../components/ui'
import { validateTimeOff, type TimeOffFormValues } from '../../../features/schedules/schemas/time-off-schema'
import type { DoctorTimeOff } from '../../../features/schedules/types/schedule'
import type { Doctor } from '../../../features/doctors/types/doctor'
import ScheduleDialog from '../../schedules/components/ScheduleDialog'

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
  const pending = useRef(false)
  const close = () => { if (!pending.current && !submitting) onCancel() }
  const update = (key: keyof TimeOffFormValues, value: string) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending.current || submitting) return
    const nextErrors = validateTimeOff(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    pending.current = true
    try { await onSubmit(values) } finally { pending.current = false }
  }
  const field = (key: 'startAt' | 'endAt', label: string) => <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label} *</span><input type="datetime-local" value={values[key]} onChange={(event) => update(key, event.target.value)} className="input-base" />{errors[key] && <small className="mt-1 block text-rose-600">{errors[key]}</small>}</label>

  return <ScheduleDialog title={timeOff ? 'Cập nhật lịch nghỉ' : 'Tạo lịch nghỉ'} busy={submitting} onClose={close}><form onSubmit={submit}>
    {apiError && <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{apiError}</div>}
    <fieldset disabled={submitting} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Bác sĩ</span><select value={values.doctorId} onChange={(event) => update('doctorId', event.target.value)} className="input-base"><option value="">Nghỉ toàn phòng khám</option>{doctors.filter((doctor) => doctor.isActive || doctor.doctorId === timeOff?.doctorId).map((doctor) => <option key={doctor.doctorId} value={doctor.doctorId}>{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</option>)}</select>{errors.doctorId && <small className="mt-1 block text-rose-600">{errors.doctorId}</small>}</label><div className="grid gap-4 sm:grid-cols-2">{field('startAt', 'Bắt đầu')}{field('endAt', 'Kết thúc')}</div><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Lý do</span><textarea value={values.reason} onChange={(event) => update('reason', event.target.value)} maxLength={255} rows={3} className="input-base resize-none" placeholder="Ví dụ: Nghỉ phép, đào tạo..." />{errors.reason && <small className="mt-1 block text-rose-600">{errors.reason}</small>}</label></fieldset>
    <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={close} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : timeOff ? 'Lưu thay đổi' : 'Tạo lịch nghỉ'}</Button></div>
  </form></ScheduleDialog>
}
