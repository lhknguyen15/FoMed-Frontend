import { notify } from '../../../shared/notifications/notify'
import { CalendarOff, PencilLine, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
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
import CMSConfirmDialog from '../../components/CMSConfirmDialog'
import { displayError } from '../../../shared/api/user-messages'

export default function TimeOffManagementPage() {
  const timeOff = useApiQuery('admin-time-off', () => scheduleAdminApi.timeOff())
  const doctors = useApiQuery('admin-doctors-time-off', doctorAdminApi.list)
  const mutation = useTimeOffAdmin()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DoctorTimeOff | null>(null)
  const [deleting, setDeleting] = useState<DoctorTimeOff | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const deleteFocus = useRef<HTMLElement | null>(null)
  const pending = useRef(false)
  const names = new Map(doctors.data?.map((doctor) => [doctor.doctorId, doctor.fullName]))
  const openCreate = () => { mutation.clearError(); setEditing(null); setFormOpen(true) }
  const openEdit = (item: DoctorTimeOff) => { mutation.clearError(); setEditing(item); setFormOpen(true) }
  const save = async (values: TimeOffFormValues) => {
    if (pending.current) return
    pending.current = true
    const request = { doctorId: values.doctorId ? Number(values.doctorId) : undefined, startAt: new Date(values.startAt).toISOString(), endAt: new Date(values.endAt).toISOString(), reason: values.reason.trim() || undefined }
    try {
      if (editing) await mutation.update(editing.id, request)
      else await mutation.create(request)
      setFormOpen(false)
      notify.success(editing ? 'Đã cập nhật lịch nghỉ.' : 'Đã tạo lịch nghỉ.')
      timeOff.refresh()
    } catch { /* lỗi API được hiển thị trong form */ }
    finally { pending.current = false }
  }
  const remove = async () => {
    if (!deleting || pending.current) return
    pending.current = true; setDeleteError('')
    try { await mutation.remove(deleting.id); setDeleting(null); notify.success('Đã xóa lịch nghỉ.'); timeOff.refresh() }
    catch (reason) { setDeleteError(displayError(reason, 'Không thể xóa lịch nghỉ.')) }
    finally { pending.current = false }
  }
  return <><CMSPageHeader title="Lịch nghỉ" description="Theo dõi thời gian bác sĩ tạm ngưng nhận lịch khám." action={<Button data-schedule-create onClick={openCreate} disabled={!doctors.data}><Plus className="size-4" /> Tạo lịch nghỉ</Button>} />{timeOff.loading ? <CMSLoading /> : timeOff.error || !timeOff.data ? <CMSError message={timeOff.error} retry={timeOff.refresh} /> : <Card className="overflow-hidden">{timeOff.data.length === 0 ? <CMSEmpty label="lịch nghỉ" /> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Bắt đầu</th><th>Kết thúc</th><th>Lý do</th><th /></tr></thead><tbody>{timeOff.data.map((item) => <tr key={item.id}><td><span className="flex items-center gap-2"><CalendarOff className="size-4 text-amber-600" /><strong>{item.doctorId ? names.get(item.doctorId) || `Bác sĩ #${item.doctorId}` : 'Toàn phòng khám'}</strong></span></td><td>{formatDateTime(item.startAt)}</td><td>{formatDateTime(item.endAt)}</td><td>{item.reason || '—'}</td><td><span className="flex items-center gap-1"><button onClick={() => openEdit(item)} aria-label="Sửa lịch nghỉ" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-teal-700"><PencilLine className="size-4" /></button><button disabled={mutation.submitting} onClick={event => { if (pending.current) return; deleteFocus.current = event.currentTarget; setDeleteError(''); setDeleting(item) }} aria-label="Xóa lịch nghỉ" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button></span></td></tr>)}</tbody></table></div>}</Card>}{formOpen && doctors.data && <TimeOffForm key={editing?.id ?? 'new'} timeOff={editing} doctors={doctors.data} submitting={mutation.submitting} apiError={mutation.error} onCancel={() => { if (!pending.current) setFormOpen(false) }} onSubmit={save} />}{deleting && <CMSConfirmDialog title="Xóa lịch nghỉ?" description="Kiểm tra đúng bác sĩ và khoảng thời gian trước khi xóa lịch nghỉ." confirmLabel="Xóa lịch nghỉ" submitting={mutation.submitting} error={deleteError} returnFocus={deleteFocus.current} onCancel={() => { if (!pending.current) setDeleting(null) }} onConfirm={remove}><p className="font-semibold">{deleting.doctorId ? names.get(deleting.doctorId) ?? `Bác sĩ #${deleting.doctorId}` : 'Toàn phòng khám'}</p><p>{formatDateTime(deleting.startAt)} – {formatDateTime(deleting.endAt)}</p><p>{deleting.reason || 'Không có lý do bổ sung.'}</p></CMSConfirmDialog>}</>
}
