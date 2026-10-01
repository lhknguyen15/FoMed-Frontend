import { CalendarOff, CheckCircle2, PencilLine, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { scheduleAdminApi } from '../../../features/schedules/api/schedule-api'
import { useTimeOffAdmin } from '../../../features/schedules/hooks/useTimeOffAdmin'
import type { TimeOffFormValues } from '../../../features/schedules/schemas/time-off-schema'
import type { DoctorTimeOff } from '../../../features/schedules/types/schedule'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import TimeOffForm from '../components/TimeOffForm'

export default function TimeOffManagementPage() {
  const timeOff = useApiQuery('admin-time-off', () => scheduleAdminApi.timeOff())
  const doctors = useApiQuery('admin-doctors-time-off', doctorAdminApi.list)
  const mutation = useTimeOffAdmin()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DoctorTimeOff | null>(null)
  const [success, setSuccess] = useState('')
  const names = new Map(doctors.data?.map((doctor) => [doctor.doctorId, doctor.fullName]))
  const openCreate = () => { mutation.clearError(); setEditing(null); setSuccess(''); setFormOpen(true) }
  const openEdit = (item: DoctorTimeOff) => { mutation.clearError(); setEditing(item); setSuccess(''); setFormOpen(true) }
  const save = async (values: TimeOffFormValues) => {
    const request = { doctorId: values.doctorId ? Number(values.doctorId) : undefined, startAt: new Date(values.startAt).toISOString(), endAt: new Date(values.endAt).toISOString(), reason: values.reason.trim() || undefined }
    try {
      if (editing) await mutation.update(editing.id, request)
      else await mutation.create(request)
      setFormOpen(false)
      setSuccess(editing ? 'Đã cập nhật lịch nghỉ.' : 'Đã tạo lịch nghỉ.')
      timeOff.refresh()
    } catch { /* lỗi API được hiển thị trong form */ }
  }
  const remove = async (item: DoctorTimeOff) => {
    if (!window.confirm(`Xóa lịch nghỉ ${formatDateTime(item.startAt)} - ${formatDateTime(item.endAt)}?`)) return
    try { await mutation.remove(item.id); setSuccess('Đã xóa lịch nghỉ.'); timeOff.refresh() } catch { setSuccess(mutation.error) }
  }
  return <><CMSPageHeader title="Lịch nghỉ" description="Theo dõi thời gian bác sĩ tạm ngưng nhận lịch khám." action={<Button onClick={openCreate} disabled={!doctors.data}><Plus className="size-4" /> Tạo lịch nghỉ</Button>} />{success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5" />{success}</div>}{timeOff.loading ? <CMSLoading /> : timeOff.error || !timeOff.data ? <CMSError message={timeOff.error} retry={timeOff.refresh} /> : <Card className="overflow-hidden">{timeOff.data.length === 0 ? <CMSEmpty label="lịch nghỉ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Bắt đầu</th><th>Kết thúc</th><th>Lý do</th><th /></tr></thead><tbody>{timeOff.data.map((item) => <tr key={item.id}><td><span className="flex items-center gap-2"><CalendarOff className="size-4 text-amber-600" /><strong>{item.doctorId ? names.get(item.doctorId) || `Bác sĩ #${item.doctorId}` : 'Toàn phòng khám'}</strong></span></td><td>{formatDateTime(item.startAt)}</td><td>{formatDateTime(item.endAt)}</td><td>{item.reason || '—'}</td><td><span className="flex items-center gap-1"><button onClick={() => openEdit(item)} aria-label="Sửa lịch nghỉ" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-teal-700"><PencilLine className="size-4" /></button><button onClick={() => void remove(item)} aria-label="Xóa lịch nghỉ" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button></span></td></tr>)}</tbody></table></div>}</Card>}{formOpen && doctors.data && <TimeOffForm key={editing?.id ?? 'new'} timeOff={editing} doctors={doctors.data} submitting={mutation.submitting} apiError={mutation.error} onCancel={() => setFormOpen(false)} onSubmit={save} />}</>
}
