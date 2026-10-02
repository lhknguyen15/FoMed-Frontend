import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import type { Appointment } from '../../../features/appointments/types/appointment'
import { catalogApi } from '../../../features/catalogs/api/catalog-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime, toDateInput } from '../../../shared/utils/format-date'
import ReceptionReasonModal from '../components/ReceptionReasonModal'

const today = toDateInput(new Date())
const labels: Record<number, { label: string; tone: 'warning' | 'info' | 'success' | 'danger' | 'neutral' }> = {
  0: { label: 'Chờ xác nhận', tone: 'warning' },
  1: { label: 'Chờ đến', tone: 'warning' },
  2: { label: 'Đang khám', tone: 'info' },
  3: { label: 'Đã khám xong', tone: 'success' },
  4: { label: 'Đã hủy', tone: 'danger' },
  5: { label: 'Không đến', tone: 'neutral' },
}

export default function ReceptionDashboardPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(today)
  const [doctorId, setDoctorId] = useState('')
  const [action, setAction] = useState<{ appointment: Appointment } | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pageSize = 10
  const [page, setPage] = useState(1)
  const doctors = useApiQuery('reception-doctors', catalogApi.doctors)
  const appointments = useApiQuery(`reception-appointments-${date}-${doctorId}`, () => appointmentApi.staffAppointments({ date, doctorId: doctorId ? Number(doctorId) : undefined }))
  const rows = useMemo(() => appointments.data ?? [], [appointments.data])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, rows])
  useEffect(() => { setPage(1) }, [date, doctorId])
  useEffect(() => { setPage((current) => Math.min(current, pageCount)) }, [pageCount])
  const counts = useMemo(() => ({
    total: rows.length,
    waiting: rows.filter((item) => item.status === 1 && !item.checkedInAt).length,
    checkedIn: rows.filter((item) => item.checkedInAt && item.status === 1).length,
    completed: rows.filter((item) => item.status === 3).length,
    noShow: rows.filter((item) => item.status === 5).length,
  }), [rows])

  const checkIn = async (appointment: Appointment) => {
    setError('')
    setSuccess('')
    try {
      await appointmentApi.checkIn(appointment.id)
      setSuccess(`Đã check-in ${appointment.patientName}.`)
      appointments.refresh()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Không thể check-in bệnh nhân.')
    }
  }

  const noShow = async (reason: string) => {
    if (!action) return
    setSubmitting(true)
    setError('')
    try {
      await appointmentApi.noShow(action.appointment.id, { reason })
      setAction(null)
      setSuccess(`Đã đánh dấu không đến cho ${action.appointment.patientName}.`)
      appointments.refresh()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Không thể cập nhật trạng thái.')
    } finally {
      setSubmitting(false)
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Bàn tiếp đón" title="Lịch hẹn trong ngày" description="Theo dõi lịch hẹn, check-in và điều phối bệnh nhân tại quầy." action={<Button onClick={() => navigate('/reception/booking')}><CalendarDays className="size-4" /> Đặt lịch hộ</Button>} />
    {success && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</p>}
    {error && <p role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><XCircle className="size-5" />{error}</p>}
    <Card className="mb-5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1"><span className="field-label">Ngày xem</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="input-base" /></label>
      <label className="flex-1"><span className="field-label">Bác sĩ</span><select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="input-base"><option value="">Tất cả bác sĩ</option>{doctors.data?.map((doctor) => <option key={doctor.doctorId} value={doctor.doctorId}>{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}</option>)}</select></label>
      <Button variant="secondary" onClick={() => { setDate(today); setDoctorId('') }}><Clock3 className="size-4" /> Hôm nay</Button>
    </div></Card>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Summary label="Tổng lịch hẹn" value={counts.total} /><Summary label="Chờ đến" value={counts.waiting} tone="amber" /><Summary label="Đã check-in" value={counts.checkedIn} tone="sky" /><Summary label="Đã khám xong" value={counts.completed} tone="emerald" /><Summary label="Không đến" value={counts.noShow} tone="rose" /></div>
    {appointments.loading ? <Card className="grid min-h-72 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : appointments.error ? <Card className="p-8 text-center"><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{appointments.error}</p><Button className="mt-5" onClick={appointments.refresh}>Thử lại</Button></Card> : <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5"><h2 className="font-display text-lg font-bold text-slate-900">Danh sách lịch hẹn</h2><p className="mt-1 text-sm text-slate-500">{date === today ? 'Hôm nay' : date} · {rows.length} lịch hẹn</p></div>
      {rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Không có lịch hẹn phù hợp.</p> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Giờ</th><th>STT</th><th>Bệnh nhân</th><th>Mã BN</th><th>Bác sĩ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visibleRows.map((item) => { const status = labels[item.status] ?? { label: item.statusName, tone: 'neutral' as const }; return <tr key={item.id}><td className="whitespace-nowrap font-semibold">{new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(new Date(item.startTime))}</td><td>{item.queueNumber ?? '—'}</td><td><strong className="block">{item.patientName}</strong><small>{item.patientPhone || '—'}</small></td><td>{item.patientId}</td><td>{item.doctorName}</td><td><Badge tone={status.tone}>{item.checkedInAt && item.status === 1 ? 'Đã check-in' : status.label}</Badge></td><td><div className="flex min-w-max gap-2">{item.status === 1 && !item.checkedInAt && <Button className="h-8 px-3 text-xs" onClick={() => void checkIn(item)}>Check-in</Button>}{item.status === 1 && item.checkedInAt && <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => navigate('/reception/queue')}>Hàng chờ</Button>}{item.status === 1 && !item.checkedInAt && new Date(item.startTime).getTime() < Date.now() && <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => { setError(''); setAction({ appointment: item }) }}>Không đến</Button>}{item.status === 3 && <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => navigate('/reception/patients')}>Xem hồ sơ</Button>}</div></td></tr> })}</tbody></table></div><div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-semibold text-slate-500">Trang {page}/{pageCount} · Hiển thị {visibleRows.length}/{rows.length} lịch hẹn</span><div className="flex gap-2"><Button type="button" variant="secondary" className="h-8 px-3 text-xs" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Trước</Button><Button type="button" variant="secondary" className="h-8 px-3 text-xs" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Sau <ChevronRight className="size-4" /></Button></div></div></>}
    </Card>}
    {action && <ReceptionReasonModal title="Đánh dấu không đến" description={`Xác nhận ${action.appointment.patientName} không đến lịch ${formatDateTime(action.appointment.startTime)}.`} submitLabel="Xác nhận" danger error={error} submitting={submitting} onClose={() => setAction(null)} onSubmit={noShow} />}
  </AppShell>
}

function Summary({ label, value, tone = 'teal' }: { label: string; value: number; tone?: 'teal' | 'amber' | 'sky' | 'emerald' | 'rose' }) {
  const colors = { teal: 'text-teal-700', amber: 'text-amber-700', sky: 'text-sky-700', emerald: 'text-emerald-700', rose: 'text-rose-700' }
  return <Card className="p-4"><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 font-display text-2xl font-bold ${colors[tone]}`}>{value}</p></Card>
}
