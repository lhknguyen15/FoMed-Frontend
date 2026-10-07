import { notify } from '../../../shared/notifications/notify'
import { displayError } from '../../../shared/api/user-messages'
import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, CalendarOff, ChevronDown, ChevronRight, PencilLine, Plus, Trash2 } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { doctorAdminApi } from '../../../features/doctors/api/doctor-api'
import { scheduleAdminApi } from '../../../features/schedules/api/schedule-api'
import { useTimeOffAdmin } from '../../../features/schedules/hooks/useTimeOffAdmin'
import type { AdminDoctorSchedule, DoctorTimeOff } from '../../../features/schedules/types/schedule'
import type { TimeOffFormValues } from '../../../features/schedules/schemas/time-off-schema'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import CMSPagination from '../../components/CMSPagination'
import ScheduleForm from '../components/ScheduleForm'
import TimeOffForm from '../../time-off/components/TimeOffForm'

const PAGE_SIZE = 10
const weekDays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export default function ScheduleManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTabState] = useState<'work' | 'leave'>(searchParams.get('tab') === 'leave' ? 'leave' : 'work')
  const setTab = (next: 'work' | 'leave') => { setTabState(next); setSearchParams(next === 'leave' ? { tab: 'leave' } : {}, { replace: true }) }
  const [page, setPage] = useState(1)
  const [expandedScheduleGroups, setExpandedScheduleGroups] = useState<Set<string>>(new Set())
  const [scheduleForm, setScheduleForm] = useState<AdminDoctorSchedule | null | undefined>(undefined)
  const [leaveForm, setLeaveForm] = useState<DoctorTimeOff | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const schedules = useApiQuery('admin-doctor-schedules', scheduleAdminApi.schedules)
  const timeOff = useApiQuery('admin-time-off', () => scheduleAdminApi.timeOff())
  const doctors = useApiQuery('admin-schedule-doctors', doctorAdminApi.list)
  const leaveMutation = useTimeOffAdmin()
  const scheduleGroups = schedules.data?.reduce<Array<{ key: string; doctorName: string; startTime: string; endTime: string; slotMinutes: number; isActive: boolean; items: AdminDoctorSchedule[] }>>((groups, item) => {
    const key = [item.doctorId, item.startTime, item.endTime, item.slotMinutes, item.isActive].join('|')
    const group = groups.find(candidate => candidate.key === key)
    if (group) group.items.push(item)
    else groups.push({ key, doctorName: item.doctorName, startTime: item.startTime, endTime: item.endTime, slotMinutes: item.slotMinutes, isActive: item.isActive, items: [item] })
    return groups
  }, []).map(group => ({
    ...group,
    items: group.items.sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek)),
  })).sort((a, b) => a.doctorName.localeCompare(b.doctorName, 'vi') || a.startTime.localeCompare(b.startTime)) ?? []
  const pagedSchedules = scheduleGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pagedLeave = timeOff.data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []
  const saveSchedule = async (input: { doctorId: number; dayOfWeeks: number[]; startTime: string; endTime: string; slotMinutes: number; isActive: boolean }) => {
    setBusy(true); setError('')
    try {
      if (scheduleForm) {
        await scheduleAdminApi.updateSchedule(scheduleForm.id, { ...input, dayOfWeek: input.dayOfWeeks[0] })
        setScheduleForm(undefined); notify.success('Đã cập nhật khung giờ làm việc.')
      } else {
        await scheduleAdminApi.createSchedules(input)
        setScheduleForm(undefined); notify.success(`Đã thêm lịch làm việc cho ${input.dayOfWeeks.length} ngày.`)
      }
      schedules.refresh()
    } catch (e) { setError(displayError(e, 'Không thể lưu lịch làm việc.')) } finally { setBusy(false) }
  }
  const saveLeave = async (values: TimeOffFormValues) => {
    setError('')
    const input = { doctorId: values.doctorId ? Number(values.doctorId) : undefined, startAt: new Date(values.startAt).toISOString(), endAt: new Date(values.endAt).toISOString(), reason: values.reason.trim() || undefined }
    try {
      if (leaveForm) await leaveMutation.update(leaveForm.id, input)
      else await leaveMutation.create(input)
      setLeaveForm(undefined); notify.success(leaveForm ? 'Đã cập nhật lịch nghỉ.' : 'Đã tạo lịch nghỉ.'); timeOff.refresh()
    } catch { /* lỗi hiển thị trong form */ }
  }
  const removeSchedule = async (item: AdminDoctorSchedule) => {
    if (!window.confirm(`Ngừng áp dụng lịch ${weekDays[item.dayOfWeek]} ${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)} của ${item.doctorName}?`)) return
    try { await scheduleAdminApi.deleteSchedule(item.id); notify.success('Đã ngừng áp dụng lịch làm việc.'); schedules.refresh() } catch (e) { notify.error(e, 'Không thể ngừng áp dụng lịch làm việc.') }
  }
  const removeLeave = async (item: DoctorTimeOff) => {
    if (!window.confirm(`Xóa lịch nghỉ ${formatDateTime(item.startAt)} – ${formatDateTime(item.endAt)}?`)) return
    try { await leaveMutation.remove(item.id); notify.success('Đã xóa lịch nghỉ.'); timeOff.refresh() } catch (e) { notify.error(e, 'Không thể xóa lịch nghỉ.') }
  }

  return <>
    <CMSPageHeader title="Lịch làm việc & lịch nghỉ" description="Quản lý khung giờ nhận khám theo tuần và các khoảng thời gian bác sĩ hoặc phòng khám nghỉ." action={<Button onClick={() => { setError(''); leaveMutation.clearError(); if (tab === 'work') setScheduleForm(null); else setLeaveForm(null) }} disabled={!doctors.data}><Plus className="size-4" />{tab === 'work' ? 'Thêm khung giờ' : 'Tạo lịch nghỉ'}</Button>} />

    <Card className="overflow-hidden">
      <div className="flex gap-2 border-b border-slate-100 p-4"><button onClick={() => { setTab('work'); setPage(1) }} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'work' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><CalendarDays className="size-4" />Lịch làm việc</button><button onClick={() => { setTab('leave'); setPage(1) }} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'leave' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><CalendarOff className="size-4" />Lịch nghỉ</button></div>
      {tab === 'work' ? schedules.loading ? <CMSLoading /> : schedules.error || !schedules.data ? <CMSError message={schedules.error} retry={schedules.refresh} /> : scheduleGroups.length === 0 ? <CMSEmpty label="khung giờ làm việc" /> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Ngày làm việc</th><th>Khung giờ</th><th>Thời lượng lượt khám</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead><tbody>{pagedSchedules.map(group => {
        const expanded = expandedScheduleGroups.has(group.key)
        return <Fragment key={group.key}>
          <tr>
            <td className="font-semibold">{group.doctorName}</td>
            <td><div className="flex max-w-sm flex-wrap gap-1.5">{group.items.map(item => <span key={item.id} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">{weekDays[item.dayOfWeek] ?? '—'}</span>)}</div></td>
            <td className="whitespace-nowrap">{group.startTime.slice(0, 5)} – {group.endTime.slice(0, 5)}</td>
            <td className="whitespace-nowrap">{group.slotMinutes} phút</td>
            <td><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${group.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{group.isActive ? 'Đang áp dụng' : 'Tạm ngưng'}</span></td>
            <td><button type="button" aria-expanded={expanded} onClick={() => setExpandedScheduleGroups(current => { const next = new Set(current); if (next.has(group.key)) next.delete(group.key); else next.add(group.key); return next })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal-800 hover:bg-teal-50">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}{group.items.length} ngày</button></td>
          </tr>
          {expanded && <tr><td colSpan={6} className="bg-slate-50/70 px-5 py-3"><ul className="divide-y divide-slate-200">{group.items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"><span className="text-sm font-medium text-slate-700">{weekDays[item.dayOfWeek] ?? '—'} <span className="font-normal text-slate-500">· {item.startTime.slice(0, 5)} – {item.endTime.slice(0, 5)}</span></span><span className="flex gap-1"><button onClick={() => { setError(''); setScheduleForm(item) }} aria-label={`Sửa lịch ${weekDays[item.dayOfWeek]}`} title="Sửa riêng ngày này" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-white"><PencilLine className="size-4" /></button><button onClick={() => void removeSchedule(item)} aria-label={`Xóa lịch ${weekDays[item.dayOfWeek]}`} title="Xóa riêng ngày này" className="grid size-9 place-items-center rounded-lg text-rose-600 hover:bg-white"><Trash2 className="size-4" /></button></span></li>)}</ul></td></tr>}
        </Fragment>
      })}</tbody></table></div><CMSPagination page={page} pageSize={PAGE_SIZE} totalItems={scheduleGroups.length} onPageChange={setPage} label="nhóm lịch" /></> : timeOff.loading ? <CMSLoading /> : timeOff.error || !timeOff.data ? <CMSError message={timeOff.error} retry={timeOff.refresh} /> : timeOff.data.length === 0 ? <CMSEmpty label="lịch nghỉ" /> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Bác sĩ</th><th>Bắt đầu</th><th>Kết thúc</th><th>Lý do</th><th>Thao tác</th></tr></thead><tbody>{pagedLeave.map(item => <tr key={item.id}><td className="font-semibold">{item.doctorId ? doctors.data?.find(d => d.doctorId === item.doctorId)?.fullName ?? `Bác sĩ #${item.doctorId}` : 'Toàn phòng khám'}</td><td>{formatDateTime(item.startAt)}</td><td>{formatDateTime(item.endAt)}</td><td>{item.reason || '—'}</td><td><span className="flex gap-1"><button onClick={() => { setError(''); leaveMutation.clearError(); setLeaveForm(item) }} aria-label="Sửa lịch nghỉ" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><PencilLine className="size-4" /></button><button onClick={() => void removeLeave(item)} aria-label="Xóa lịch nghỉ" className="grid size-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="size-4" /></button></span></td></tr>)}</tbody></table></div><CMSPagination page={page} pageSize={PAGE_SIZE} totalItems={timeOff.data.length} onPageChange={setPage} label="lịch nghỉ" /></>}
    </Card>
    {scheduleForm !== undefined && doctors.data && <ScheduleForm schedule={scheduleForm} doctors={doctors.data} submitting={busy} error={error} onCancel={() => { if (!busy) setScheduleForm(undefined) }} onSubmit={saveSchedule} />}
    {leaveForm !== undefined && doctors.data && <TimeOffForm timeOff={leaveForm} doctors={doctors.data} submitting={leaveMutation.submitting} apiError={leaveMutation.error} onCancel={() => { if (!leaveMutation.submitting) setLeaveForm(undefined) }} onSubmit={saveLeave} />}
  </>
}
