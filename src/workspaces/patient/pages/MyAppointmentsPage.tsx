import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'
import { CalendarClock, CalendarDays, Clock3, FileText, MapPin, RefreshCw, Stethoscope, X, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import type { Appointment } from '../../../features/appointments/types/appointment'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { appointmentTimestamp, canChangePatientAppointment, clinicDateInput, filterPatientAppointments, formatAppointmentTime, patientAppointmentGroups, type PatientAppointmentGroup } from '../../../features/appointments/utils/patient-appointment-groups'

const statusMeta: Record<number, { label: string; tone: 'warning' | 'info' | 'success' | 'danger' | 'neutral' }> = {
  0: { label: 'Chờ xác nhận', tone: 'warning' },
  1: { label: 'Đã xác nhận', tone: 'info' },
  2: { label: 'Đang khám', tone: 'success' },
  3: { label: 'Đã hoàn tất', tone: 'success' },
  4: { label: 'Đã hủy', tone: 'danger' },
  5: { label: 'Vắng mặt', tone: 'neutral' },
}

const statusInfo = (appointment: Appointment) => statusMeta[appointment.status] ?? { label: 'Chưa xác định trạng thái', tone: 'neutral' as const }

function AppointmentCard({ appointment, now, onCancel, onReschedule, onRecord }: { appointment: Appointment; now: number; onCancel: (value: Appointment) => void; onReschedule: (value: Appointment) => void; onRecord: (value: Appointment) => void }) {
  const status = statusInfo(appointment)
  const validStart = Number.isFinite(appointmentTimestamp(appointment.startTime))
  return <Card className="overflow-hidden"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-center text-teal-800"><span className="text-xs font-bold uppercase">{validStart ? formatAppointmentTime(appointment.startTime, { weekday: 'short' }) : 'Ngày'}</span><strong className="font-display text-xl leading-5">{validStart ? formatAppointmentTime(appointment.startTime, { day: 'numeric' }) : '—'}</strong></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-display text-lg font-bold text-slate-900">{appointment.doctorName}</h2><Badge tone={status.tone}>{status.label}</Badge></div><p className="mt-1 text-sm text-slate-500">{appointment.doctorSpecialty || 'Khám tổng quát'}</p><p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-700"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 shrink-0 text-teal-700" />{formatAppointmentTime(appointment.startTime)} – {formatAppointmentTime(appointment.endTime, { timeStyle: 'short' })}</span>{appointment.doctorRoom && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-slate-400" />{appointment.doctorRoom}</span>}</p></div></div><span className="break-all font-mono text-xs font-semibold text-slate-400">{appointment.appointmentCode}</span></div><div className="flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-x-5 gap-y-2 text-slate-500"><span className="inline-flex items-center gap-2"><Stethoscope className="size-4 text-slate-400" />{appointment.serviceName || 'Lịch khám'}</span>{appointment.queueNumber && <span>Số thứ tự: <strong className="text-slate-700">{appointment.queueNumber}</strong></span>}{appointment.feeSnapshot !== null && appointment.feeSnapshot !== undefined && <span>Phí dự kiến: <strong className="text-slate-700">{appointment.feeSnapshot.toLocaleString('vi-VN')} đ</strong></span>}</div><div className="flex flex-wrap gap-2">{(appointment.status === 0 || appointment.status === 1) && appointmentTimestamp(appointment.startTime) > now && !canChangePatientAppointment(appointment, now) && <p className="max-w-sm text-xs leading-5 text-slate-500">Trong 24 giờ trước lịch hẹn, vui lòng liên hệ lễ tân nếu cần đổi hoặc hủy lịch.</p>}{canChangePatientAppointment(appointment, now) && <><Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => onReschedule(appointment)}><CalendarClock className="size-4" /> Đổi giờ</Button><Button variant="danger" className="h-9 px-3 text-xs" onClick={() => onCancel(appointment)}><XCircle className="size-4" /> Hủy lịch</Button></>}{appointment.status === 3 && <Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => onRecord(appointment)}><FileText className="size-4" /> Xem bệnh án</Button>}</div></div></Card>
}

function RescheduleModal({ appointment, onClose, onDone }: { appointment: Appointment; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(clinicDateInput(appointmentTimestamp(appointment.startTime)))
  const [startTime, setStartTime] = useState('')
  const [reason, setReason] = useState('Thay đổi thời gian khám')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const slots = useApiQuery(`reschedule-slots-${appointment.id}-${date}`, () => appointmentApi.availableSlots(appointment.doctorId, date, appointment.serviceId ?? undefined))
  const available = slots.data?.filter((slot) => slot.isAvailable) ?? []
  const submit = async () => { if (!startTime) return; if (!canChangePatientAppointment(appointment, Date.now())) { setError('Lịch đã gần hoặc qua giờ hẹn. Vui lòng liên hệ lễ tân để đổi hoặc hủy lịch.'); return } setSubmitting(true); setError(''); try { await appointmentApi.reschedule(appointment.id, { startTime, reason: reason.trim() || undefined }); onDone() } catch (value) { setError(displayError(value, 'Không thể đổi giờ lịch hẹn.')) } finally { setSubmitting(false) } }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Đổi giờ lịch hẹn</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">{appointment.appointmentCode}</h2><p className="mt-1 text-sm text-slate-500">{appointment.doctorName}</p></div><button aria-label="Đóng" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div><label className="mt-5 block"><span className="field-label">Ngày khám mới</span><input type="date" min={clinicDateInput(Date.now())} value={date} onChange={(event) => { setDate(event.target.value); setStartTime('') }} className="input-base" /></label><div className="mt-5"><p className="text-sm font-semibold text-slate-700">Khung giờ còn trống</p>{slots.loading ? <p className="mt-3 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Đang tải khung giờ...</p> : slots.error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{slots.error}</p> : available.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">Không còn khung giờ phù hợp trong ngày này.</p> : <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{available.map((slot) => <button key={slot.startTime} type="button" onClick={() => setStartTime(slot.startTime)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${startTime === slot.startTime ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}>{formatAppointmentTime(slot.startTime, { timeStyle: 'short' })}</button>)}</div>}</div><label className="mt-5 block"><span className="field-label">Lý do đổi giờ</span><textarea rows={2} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="input-base resize-none" /></label>{error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}<div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button disabled={!startTime || submitting} onClick={() => void submit()}>{submitting ? 'Đang cập nhật...' : 'Xác nhận đổi giờ'}</Button></div></div></div>
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [tab, setTab] = useState<PatientAppointmentGroup>('upcoming')
  const [now, setNow] = useState(() => Date.now())
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [reason, setReason] = useState('Thay đổi kế hoạch')
  const [mutationError, setMutationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const appointments = useApiQuery(`patient-appointments-${date}`, () => appointmentApi.myAppointments({ date: date || undefined }))
  useEffect(() => {
    const updateClock = () => setNow(Date.now())
    const timer = setInterval(updateClock, 30000)
    window.addEventListener('focus', updateClock)
    document.addEventListener('visibilitychange', updateClock)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', updateClock)
      document.removeEventListener('visibilitychange', updateClock)
    }
  }, [])
  const filtered = useMemo(() => filterPatientAppointments(appointments.data ?? [], tab, now), [appointments.data, tab, now])
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleAppointments = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const group = patientAppointmentGroups.find(item => item.value === tab)!
  const cancel = async () => {
    if (!cancelling || reason.trim().length < 3 || submitting) return
    if (!canChangePatientAppointment(cancelling, Date.now())) {
      setMutationError('Lịch đã gần hoặc qua giờ hẹn. Vui lòng liên hệ lễ tân để đổi hoặc hủy lịch.')
      setNow(Date.now())
      return
    }
    setSubmitting(true); setMutationError('')
    try {
      await appointmentApi.cancel(cancelling.id, { reason: reason.trim() })
      setCancelling(null); notify.success('Đã hủy lịch hẹn và trả lại khung giờ.'); appointments.refresh()
    } catch (error) { setMutationError(displayError(error, 'Không thể hủy lịch hẹn.')) }
    finally { setSubmitting(false) }
  }
  const changeTab = (value: PatientAppointmentGroup) => { setTab(value); setPage(1) }
  const openChange = (appointment: Appointment, action: 'cancel' | 'reschedule') => {
    if (!canChangePatientAppointment(appointment, Date.now())) {
      notify.info('Lịch đã gần hoặc qua giờ hẹn. Vui lòng liên hệ lễ tân để đổi hoặc hủy lịch.')
      setNow(Date.now())
      return
    }
    setMutationError('')
    if (action === 'cancel') setCancelling(appointment)
    else setRescheduling(appointment)
  }
  // The sidebar count covers all upcoming appointments, never a date-filtered subset.
  const navigationCounts = !date && !appointments.loading && !appointments.error && appointments.data !== null
    ? { 'patient-upcoming': filterPatientAppointments(appointments.data, 'upcoming', now).length } : undefined
  return <AppShell navigationCounts={navigationCounts}>
    <PageTitle eyebrow="Cổng bệnh nhân" title="Lịch hẹn của tôi" description="Theo dõi lịch sắp tới, lượt đang khám và các lịch cần xử lý; xem lại bệnh án đã hoàn tất." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setNow(Date.now()); appointments.refresh() }}><RefreshCw className="size-4" />Làm mới</Button><Button onClick={() => navigate('/booking')}><CalendarDays className="size-4" />Đặt lịch mới</Button></div>} />
    <Card className="mb-5 overflow-hidden">
      <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-end xl:justify-between">
        <div role="group" aria-label="Nhóm lịch hẹn" className="flex min-w-0 flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {patientAppointmentGroups.map(({ value, label }) => <button type="button" key={value} aria-pressed={tab === value} onClick={() => changeTab(value)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === value ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>{label}</button>)}
        </div>
        <label className="w-full shrink-0 sm:w-56"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Lọc theo ngày</span><input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1) }} className="input-base" /></label>
      </div>
      <div className="border-t border-slate-100 px-4 py-3"><p className="text-sm leading-6 text-slate-600">{group.description}</p><p className="mt-1 text-xs text-slate-500">Giờ hẹn được hiển thị theo giờ Việt Nam.</p></div>
    </Card>
    {appointments.loading ? <Card className="grid min-h-72 place-items-center p-8"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card>
      : appointments.error ? <Card className="grid min-h-64 place-items-center p-8 text-center"><div><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{appointments.error}</p><Button className="mt-5" onClick={appointments.refresh}><RefreshCw className="size-4" />Thử lại</Button></div></Card>
      : filtered.length === 0 ? <EmptyState icon={<CalendarDays className="size-6" />} title="Không có lịch hẹn" body="Không có lịch hẹn phù hợp trong nhóm và ngày đang chọn." />
      : <div className="space-y-4">
        {visibleAppointments.map(appointment => <AppointmentCard key={appointment.id} appointment={appointment} now={now} onCancel={value => openChange(value, 'cancel')} onReschedule={value => openChange(value, 'reschedule')} onRecord={value => navigate(`/my-records?appointmentId=${value.id}`)} />)}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center">
          <span>Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length} lịch hẹn</span>
          <span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Trước</Button><span>Trang {currentPage} / {totalPages}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Sau</Button></span>
        </div>
      </div>}
    {cancelling && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-rose-600">Xác nhận hủy lịch</p><h2 className="mt-1 font-display text-xl font-bold text-slate-900">Hủy lịch {cancelling.appointmentCode}</h2></div><button aria-label="Đóng" onClick={() => setCancelling(null)} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div><p className="mt-4 text-sm text-slate-600">Lịch với <strong>{cancelling.doctorName}</strong> vào {formatAppointmentTime(cancelling.startTime)}.</p><label className="mt-5 block"><span className="field-label">Lý do hủy *</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="input-base resize-none" /></label>{mutationError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{mutationError}</p>}<div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setCancelling(null)}>Giữ lịch</Button><Button variant="danger" disabled={submitting || reason.trim().length < 3} onClick={() => void cancel()}>{submitting ? 'Đang xử lý...' : 'Xác nhận hủy'}</Button></div></div></div>}{rescheduling && <RescheduleModal appointment={rescheduling} onClose={() => setRescheduling(null)} onDone={() => { setRescheduling(null); notify.success('Đã đổi giờ lịch hẹn thành công.'); appointments.refresh() }} />}
  </AppShell>
}
