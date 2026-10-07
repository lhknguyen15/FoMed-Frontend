import { ArrowRight, RefreshCw, Stethoscope, XCircle } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'
import type { DoctorInProgress } from '../../../features/appointments/types/appointment'
import { formatDateTime } from '../../../shared/utils/format-date'

type Props = {
  visits: DoctorInProgress[]
  loading: boolean
  error: string
  onRefresh: () => void
  onResume: (visit: DoctorInProgress) => void
}

export default function DoctorInProgressPanel({ visits, loading, error, onRefresh, onResume }: Props) {
  return <Card className="mb-6 overflow-hidden border-teal-200">
    <div className="flex flex-col gap-3 border-b border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div><h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900"><Stethoscope className="size-5 text-teal-700" />Đang khám</h2><p className="mt-1 text-sm text-slate-600">Các lượt chưa chốt bệnh án, gồm cả ngày trước. Mở lại để tiếp tục khám.</p></div>
      {!loading && !error && <Badge tone="info">{visits.length} lượt đang khám</Badge>}
    </div>
    {loading ? <p role="status" className="p-5 text-sm text-slate-500">Đang tải lượt khám chưa hoàn tất...</p>
      : error ? <div role="alert" className="p-5"><p className="flex items-start gap-2 text-sm text-rose-700"><XCircle className="mt-0.5 size-4 shrink-0" />{error}</p><Button variant="secondary" className="mt-3" onClick={onRefresh}><RefreshCw className="size-4" />Thử tải lại lượt đang khám</Button></div>
        : !visits.length ? <p className="p-5 text-sm text-slate-500">Không có lượt khám chưa hoàn tất.</p>
          : <div className="divide-y divide-slate-100">{visits.map(visit => <div key={visit.medicalRecordId} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-display font-bold text-slate-900">{visit.appointment.patientName}</h3><Badge tone="info">Đang khám</Badge></div><p className="mt-1 break-words text-sm text-slate-500">{visit.appointment.appointmentCode} · Bệnh án #{visit.medicalRecordId}</p><p className="mt-1 text-sm text-slate-500">Lịch khám: {formatDateTime(visit.appointment.startTime)}</p></div>
            <Button className="w-full shrink-0 sm:w-auto" onClick={() => onResume(visit)}><ArrowRight className="size-4" />Tiếp tục khám</Button>
          </div>)}</div>}
  </Card>
}
