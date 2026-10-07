import { RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { PatientHistorySummary } from '../../../features/appointments/types/appointment'
import { formatDateTime } from '../../../shared/utils/format-date'

type Props = {
  history: PatientHistorySummary[]
  loading: boolean
  error: string
  onRetry: () => void
}

export default function DoctorHistoryEntries({ history, loading, error, onRetry }: Props) {
  if (loading) return <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Đang tải lịch sử khám...</p>
  if (error) return <div role="alert" className="rounded-lg bg-rose-50 p-3"><p className="text-sm text-rose-700">{error}</p><Button variant="secondary" className="mt-3 h-9 px-3 text-xs" onClick={onRetry}><RefreshCw className="size-4" />Tải lại lịch sử</Button></div>
  if (!history.length) return <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Chưa có lần khám đã chốt trước lượt khám này.</p>
  return <div className="space-y-3">{history.map(item => <div key={item.medicalRecordId} className="min-w-0 border-l-2 border-teal-200 pl-3"><p className="break-words text-sm font-semibold text-slate-800">{item.diagnosis || 'Chưa ghi chẩn đoán'}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(item.visitAt)}</p>{item.note && <p className="mt-1 break-words text-xs text-slate-500">{item.note}</p>}</div>)}</div>
}
