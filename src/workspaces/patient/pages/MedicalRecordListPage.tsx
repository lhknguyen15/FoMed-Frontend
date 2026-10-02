import { ClipboardList, FileText, RefreshCw, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
import { Badge, Button, Card, EmptyState, PageTitle } from '../../../components/ui'
import { appointmentApi } from '../../../features/appointments/api/appointment-api'
import type { Appointment } from '../../../features/appointments/types/appointment'
import { clinicalApi } from '../../../features/clinical/api/clinical-api'
import type { MedicalRecord } from '../../../features/clinical/types/clinical'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import MedicalRecordDetailModal from '../components/MedicalRecordDetailModal'

type RecordBundle = { records: MedicalRecord[]; appointments: Appointment[] }

export default function MedicalRecordListPage() {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<MedicalRecord | null>(null)
  const [page, setPage] = useState(1)
  const bundle = useApiQuery<RecordBundle>(`patient-medical-records-${page}`, async () => {
    const [records, appointments] = await Promise.all([clinicalApi.records(page), appointmentApi.myAppointments()])
    return { records, appointments }
  })
  const appointmentById = useMemo(() => new Map(bundle.data?.appointments.map((item) => [item.id, item]) ?? []), [bundle.data])
  const records = useMemo(() => bundle.data?.records ?? [], [bundle.data])
  const hasNextPage = records.length === 20
  const requestedAppointmentId = Number(params.get('appointmentId'))

  useEffect(() => {
    if (!requestedAppointmentId || !records.length || selected) return
    const match = records.find((record) => record.appointmentId === requestedAppointmentId)
    if (match) setSelected(match)
  }, [records, requestedAppointmentId, selected])

  const closeDetail = () => {
    setSelected(null)
    if (params.has('appointmentId')) {
      const next = new URLSearchParams(params)
      next.delete('appointmentId')
      setParams(next, { replace: true })
    }
  }

  return <AppShell><PageTitle eyebrow="Cổng bệnh nhân" title="Lịch sử khám & đơn thuốc" description="Xem chẩn đoán, đơn thuốc và kết quả cận lâm sàng của các lần khám đã chốt." />{requestedAppointmentId > 0 && !bundle.loading && records.length > 0 && !records.some((record) => record.appointmentId === requestedAppointmentId) && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Bệnh án của lịch hẹn này không nằm trong trang hiện tại. Hãy chuyển trang để tìm hồ sơ tương ứng.</p>}{bundle.loading ? <Card className="grid min-h-72 place-items-center p-8"><span className="size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /></Card> : bundle.error ? <Card className="grid min-h-64 place-items-center p-8 text-center"><div><RefreshCw className="mx-auto size-10 text-rose-500" /><h2 className="mt-3 font-display text-lg font-bold text-slate-800">Không thể tải hồ sơ</h2><p className="mt-1 text-sm text-slate-500">{bundle.error}</p><Button className="mt-5" onClick={bundle.refresh}><RefreshCw className="size-4" /> Thử lại</Button></div></Card> : !records.length ? <EmptyState icon={<FileText className="size-6" />} title="Chưa có hồ sơ sức khỏe" body="Hồ sơ sẽ xuất hiện sau khi bác sĩ hoàn tất và chốt lượt khám của bạn." /> : <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-display text-lg font-bold text-slate-900">Lịch sử khám</h2><p className="mt-1 text-sm text-slate-500">Trang {page} · tối đa 20 hồ sơ</p></div><Badge tone="info">Chỉ hồ sơ đã chốt</Badge></div><div className="divide-y divide-slate-100">{records.map((record) => { const appointment = appointmentById.get(record.appointmentId); return <div key={record.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><ClipboardList className="size-5" /></span><span className="min-w-0"><strong className="block truncate font-display text-base text-slate-900">{record.diagnosis || 'Chưa ghi nhận chẩn đoán'}</strong><span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><Stethoscope className="size-4" />{appointment?.doctorName || `Bác sĩ #${record.doctorId}`}</span><span>{appointment ? formatDateTime(appointment.startTime) : formatDateTime(record.createdAt)}</span></span>{record.icd10Code && <span className="mt-1 block text-xs font-semibold text-slate-400">Mã ICD-10: {record.icd10Code}</span>}</span></div><Button variant="secondary" className="shrink-0" onClick={() => setSelected(record)}>Xem bệnh án</Button></div>})}</div><div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center"><span>Hiển thị {records.length} hồ sơ</span><span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setSelected(null) }}>Trước</Button><span>Trang {page}{hasNextPage ? '' : ' · cuối'}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={!hasNextPage} onClick={() => { setPage((value) => value + 1); setSelected(null) }}>Sau</Button></span></div></Card>}{selected && <MedicalRecordDetailModal record={selected} records={records} appointments={bundle.data?.appointments ?? []} onClose={closeDetail} />}</AppShell>
}
