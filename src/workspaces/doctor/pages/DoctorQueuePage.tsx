import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, History, PlayCircle, RefreshCw, Stethoscope, UserRound, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import type { DoctorQueuePatient } from '../../../features/appointments/types/appointment'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime, toDateInput } from '../../../shared/utils/format-date'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'

const today = toDateInput(new Date())

export default function DoctorQueuePage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(today)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const queue = useApiQuery(`doctor-queue-${date}`, () => appointmentApi.doctorQueue(date))
  const rows = queue.data ?? []

  const startExam = async (item: DoctorQueuePatient) => {
    setBusyId(item.appointment.id)
    setNotice(null)
    try {
      const record = await clinicalApi.createRecord(item.appointment.id)
      setNotice({ type: 'success', text: `Đã bắt đầu lượt khám cho ${item.appointment.patientName}.` })
      navigate(`/doctor/exam/${record.id}`, { state: { recentHistory: item.recentHistory, allergies: item.allergies, patientName: item.appointment.patientName } })
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể bắt đầu lượt khám.' })
    } finally {
      setBusyId(null)
    }
  }

  const callNext = async () => {
    setNotice(null)
    try {
      const appointment = await appointmentApi.callNext(date)
      setNotice({ type: 'success', text: `Đã gọi ${appointment.patientName}${appointment.queueNumber ? ` · STT ${appointment.queueNumber}` : ''}.` })
      queue.refresh()
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Không thể gọi bệnh nhân tiếp theo.' })
    }
  }

  return <AppShell>
    <PageTitle eyebrow="Không gian bác sĩ" title="Hàng chờ của tôi" description="Danh sách bệnh nhân đã check-in và sẵn sàng vào khám trong ngày." action={<Button variant="secondary" onClick={queue.refresh}><RefreshCw className="size-4" /> Làm mới</Button>} />
    {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{notice.type === 'error' ? <XCircle className="size-5" /> : <CheckCircle2 className="size-5" />}{notice.text}</p>}
    <Card className="mb-5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="max-w-xs flex-1"><span className="field-label"><CalendarDays className="size-4" /> Ngày khám</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="input-base" /></label><Button disabled={!rows.length} onClick={() => void callNext()}><PlayCircle className="size-4" /> Gọi bệnh nhân tiếp theo</Button></div></Card>
    {queue.loading ? <Card className="grid min-h-72 place-items-center"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : queue.error ? <Card className="p-8 text-center"><XCircle className="mx-auto size-10 text-rose-500" /><p className="mt-3 text-sm text-slate-500">{queue.error}</p><Button className="mt-5" onClick={queue.refresh}>Thử lại</Button></Card> : !rows.length ? <EmptyState icon={<Stethoscope className="size-6" />} title="Chưa có bệnh nhân trong hàng chờ" body="Lịch hẹn sẽ xuất hiện ở đây sau khi lễ tân check-in cho bệnh nhân." /> : <>
      <div className="mb-6 grid gap-4 md:grid-cols-3"><Card className="border-teal-200 bg-teal-50/60 p-5"><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Đầu hàng</p><p className="mt-2 font-display text-2xl font-bold text-slate-900">STT {rows[0].appointment.queueNumber ?? '—'}</p><p className="mt-1 text-sm text-slate-600">{rows[0].appointment.patientName}</p></Card><Card className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tiếp theo</p><p className="mt-2 font-display text-2xl font-bold text-slate-900">{rows[1] ? `STT ${rows[1].appointment.queueNumber ?? '—'}` : '—'}</p><p className="mt-1 text-sm text-slate-500">{rows[1]?.appointment.patientName || 'Chưa có'}</p></Card><Card className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đang chờ</p><p className="mt-2 font-display text-2xl font-bold text-teal-700">{rows.length}</p><p className="mt-1 text-sm text-slate-500">Lượt đã check-in</p></Card></div>
      <Card className="overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="font-display text-lg font-bold text-slate-900">Danh sách bệnh nhân</h2><p className="mt-1 text-sm text-slate-500">Sắp xếp theo số thứ tự và thời điểm check-in.</p></div><Badge tone="info">{rows.length} lượt chờ</Badge></div><div className="divide-y divide-slate-100">{rows.map((item) => <div key={item.appointment.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><UserRound className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-bold text-slate-900">{item.appointment.patientName}</h3><Badge tone="info">STT {item.appointment.queueNumber ?? '—'}</Badge></div><p className="mt-1 text-sm text-slate-500">{item.appointment.appointmentCode} · Hẹn lúc {formatDateTime(item.appointment.startTime)}</p>{item.allergies && <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-sm font-semibold text-amber-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> Dị ứng: {item.allergies}</p>}</div></div><Button disabled={busyId === item.appointment.id} onClick={() => void startExam(item)}><PlayCircle className="size-4" /> {busyId === item.appointment.id ? 'Đang mở...' : 'Bắt đầu khám'}</Button></div>{item.recentHistory.length > 0 && <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><History className="size-4" /> Lịch sử gần đây</p><div className="grid gap-2 sm:grid-cols-2">{item.recentHistory.slice(0, 2).map((history) => <div key={history.medicalRecordId} className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><p className="font-semibold text-slate-800">{history.diagnosis || 'Chưa ghi chẩn đoán'}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(history.visitAt)}{history.note ? ` · ${history.note}` : ''}</p></div>)}</div></div>}{!item.recentHistory.length && <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><ClipboardList className="size-4" /> Chưa có lịch sử khám trước đó.</p>}</div>)}</div></Card>
    </>}
  </AppShell>
}
