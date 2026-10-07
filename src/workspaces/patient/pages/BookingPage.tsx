import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { CalendarDays, Clock3, Stethoscope, UserRound, XCircle } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import { patientApi } from '../../../features/patients/api/patient-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { toDateInput } from '../../../shared/utils/format-date'

const today = toDateInput(new Date())

export default function BookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [specialtyId, setSpecialtyId] = useState('')
  const [doctorId, setDoctorId] = useState(() => searchParams.get('doctorId') ?? '')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(today)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)
  const specialties = useApiQuery('public-specialties', catalogApi.specialties)
  const doctors = useApiQuery(`public-doctors-${specialtyId}`, () => catalogApi.doctors(specialtyId ? Number(specialtyId) : undefined))
  const services = useApiQuery('public-services', catalogApi.services)
  const profile = useApiQuery('patient-profile-for-booking', patientApi.me)
  const slots = useApiQuery(`available-slots-${doctorId}-${date}-${serviceId}`, () => doctorId ? appointmentApi.availableSlots(Number(doctorId), date, serviceId ? Number(serviceId) : undefined) : Promise.resolve([]))
  const doctor = doctors.data?.find((item) => item.doctorId === Number(doctorId))
  const available = useMemo(() => (slots.data ?? []).filter((slot) => slot.isAvailable), [slots.data])
  const book = async () => {
    if (pending.current || submitting || slots.loading || slots.error || !doctorId || !selectedSlot || !available.some(slot => slot.startTime === selectedSlot) || reason.trim().length < 3) return
    pending.current = true
    setSubmitting(true); setError(''); setMessage('')
    try {
      await appointmentApi.book({ doctorId: Number(doctorId), startTime: selectedSlot, serviceId: serviceId ? Number(serviceId) : undefined, reason: reason.trim() || undefined })
      setMessage('Lịch đang chờ lễ tân xác nhận. Theo dõi trạng thái trong mục “Lịch hẹn của tôi”.')
      setSelectedSlot(null); slots.refresh(); notify.success('Đã gửi yêu cầu đặt lịch.')
    } catch (reasonValue) { setError(displayError(reasonValue, 'Không thể đặt lịch vào thời điểm này.')); slots.refresh() }
    finally { pending.current = false; setSubmitting(false) }
  }
  const changeSpecialty = (value: string) => { setSpecialtyId(value); setDoctorId(''); setSelectedSlot(null) }
  return <AppShell><PageTitle eyebrow="Đặt lịch trực tuyến" title="Chọn lịch khám phù hợp" description="Chọn chuyên khoa, bác sĩ và một khung giờ còn trống." action={<Button variant="secondary" disabled={submitting} onClick={() => navigate('/my-appointments')}>Xem lịch hẹn của tôi</Button>} />
    {message && <div role="status" className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-800">{message}</div>}
    {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><XCircle className="mt-0.5 size-5 shrink-0" />{error}</div>}
    <fieldset disabled={submitting} className="min-w-0"><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><Card className="p-5 sm:p-6"><div className="grid gap-4 md:grid-cols-2"><label><span className="field-label"><Stethoscope className="size-4 text-teal-700" />Chuyên khoa</span><select className="input-base" value={specialtyId} onChange={(event) => changeSpecialty(event.target.value)}><option value="">Tất cả chuyên khoa</option>{specialties.data?.map((item) => <option key={item.specialtyId} value={item.specialtyId}>{item.name}</option>)}</select></label><label><span className="field-label"><UserRound className="size-4 text-teal-700" />Bác sĩ</span><select className="input-base" value={doctorId} onChange={(event) => { setDoctorId(event.target.value); setSelectedSlot(null) }}><option value="">Chọn bác sĩ</option>{doctors.data?.map((item) => <option key={item.doctorId} value={item.doctorId}>{item.title ? `${item.title} ` : ''}{item.fullName} · {item.specialtyName}</option>)}</select></label><label><span className="field-label"><CalendarDays className="size-4 text-teal-700" />Ngày khám</span><input type="date" min={today} className="input-base" value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(null) }} /></label><label><span className="field-label">Dịch vụ (không bắt buộc)</span><select className="input-base" value={serviceId} onChange={(event) => { setServiceId(event.target.value); setSelectedSlot(null) }}><option value="">Khám với bác sĩ</option>{services.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.price.toLocaleString('vi-VN')} đ</option>)}</select></label></div>
      {doctor && <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-display font-bold text-slate-900">{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</p><p className="mt-1 text-sm text-slate-500">{doctor.specialtyName} · Phí khám {doctor.consultationFee.toLocaleString('vi-VN')} đ</p></div><Badge tone="success">Đang nhận lịch</Badge></div>}
      <div className="mt-7"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-slate-900">Khung giờ còn trống</h2>{doctorId && <span className="text-sm text-slate-500">{available.length} khung giờ</span>}</div>{!doctorId ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Chọn bác sĩ để xem lịch trống.</p> : slots.loading ? <p className="mt-4 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Đang tải khung giờ...</p> : slots.error ? <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{slots.error}</p> : available.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Ngày này chưa có khung giờ phù hợp. Hãy thử ngày khác.</p> : <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{available.map((slot) => { const active = selectedSlot === slot.startTime; return <button type="button" key={slot.startTime} onClick={() => setSelectedSlot(slot.startTime)} className={`rounded-xl border px-3 py-3 text-left transition ${active ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/15' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'}`}><span className="flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4" />{new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(slot.startTime))}</span><span className="mt-1 block text-xs text-slate-400">{new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(slot.endTime))}</span></button> })}</div>}</div>
    </Card><Card className="h-fit p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-slate-900">Xác nhận lịch khám</h2><p className="mt-1 text-sm text-slate-500">Kiểm tra thông tin trước khi đặt lịch.</p><div className="my-5 space-y-3 border-y border-slate-100 py-5 text-sm"><p className="flex justify-between gap-4"><span className="text-slate-500">Bác sĩ</span><strong className="text-right text-slate-800">{doctor?.fullName || 'Chưa chọn'}</strong></p><p className="flex justify-between gap-4"><span className="text-slate-500">Ngày</span><strong className="text-right text-slate-800">{new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))}</strong></p><p className="flex justify-between gap-4"><span className="text-slate-500">Giờ</span><strong className="text-right text-slate-800">{selectedSlot ? new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(selectedSlot)) : 'Chưa chọn'}</strong></p><p className="flex justify-between gap-4"><span className="text-slate-500">Thẻ BHYT</span><strong className="text-right text-slate-800">{profile.data?.insuranceNumber || 'Chưa cập nhật'}</strong></p></div><label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Lý do khám *</span><textarea required className="input-base resize-none" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: đau ngực, khó thở khi gắng sức..." /></label>{reason.length > 0 && reason.trim().length < 3 && <p className="mt-1 text-xs font-semibold text-rose-600">Lý do khám cần ít nhất 3 ký tự.</p>}<Button className="mt-5 w-full" disabled={!doctorId || !selectedSlot || reason.trim().length < 3 || submitting || slots.loading || !!slots.error || !available.some(slot => slot.startTime === selectedSlot)} onClick={() => void book()}>{submitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}</Button><p className="mt-3 text-xs leading-5 text-amber-700">Khung giờ có thể vừa được người khác đặt. Nếu giờ đã chọn không còn trống, vui lòng chọn giờ khác.</p></Card></div></fieldset>
  </AppShell>
}
