import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Pencil, Plus, RefreshCw } from 'lucide-react'
import AppShell from '../../../components/AppShell'
import { Button, Card, PageTitle } from '../../../components/ui'
import { receptionScheduleApi } from '../../../features/schedules/api/reception-schedule-api'
import type { SaveAdminDoctorScheduleBatchInput } from '../../../features/schedules/api/schedule-api'
import type { AdminDoctorSchedule } from '../../../features/schedules/types/schedule'
import ScheduleForm from '../../../cms/schedules/components/ScheduleForm'
import ScheduleDialog from '../../../cms/schedules/components/ScheduleDialog'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { displayError } from '../../../shared/api/user-messages'
import { notify } from '../../../shared/notifications/notify'
import { formatDateTime } from '../../../shared/utils/format-date'

const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const pageSize = 10

export default function ReceptionSchedulePage() {
  const [params, setParams] = useSearchParams()
  const rawDoctor = Number(params.get('doctor'))
  const doctorId = /^\d+$/.test(params.get('doctor') ?? '') && Number.isSafeInteger(rawDoctor) && rawDoctor > 0 ? rawDoctor : undefined
  const day = /^[0-6]$/.test(params.get('day') ?? '') ? Number(params.get('day')) : undefined
  const status = ['active', 'inactive'].includes(params.get('status') ?? '') ? params.get('status') : 'all'
  const tab = params.get('tab') === 'leave' ? 'leave' : 'work'
  const rawPage = Number(params.get('page') ?? 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const [form, setForm] = useState<AdminDoctorSchedule | null | undefined>(undefined)
  const [confirmation, setConfirmation] = useState<AdminDoctorSchedule | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const doctors = useApiQuery('reception-schedule-doctors', receptionScheduleApi.doctors)
  const key = `reception-schedules-${doctorId ?? 'all'}`
  const schedules = useApiQuery(key, async () => ({ key, items: await receptionScheduleApi.schedules(doctorId) }))
  const leaveKey = `reception-time-off-${doctorId ?? 'all'}`
  const leave = useApiQuery(leaveKey, async () => ({ key: leaveKey, items: await receptionScheduleApi.timeOff(doctorId) }))
  const rows = schedules.data?.key === key ? schedules.data.items.filter(row =>
    (day === undefined || row.dayOfWeek === day) && (status === 'all' || row.isActive === (status === 'active')))
    .sort((a, b) => a.doctorName.localeCompare(b.doctorName, 'vi') || ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7) || a.startTime.localeCompare(b.startTime) || a.id - b.id) : []
  const leaves = leave.data?.key === leaveKey ? leave.data.items : []
  const total = tab === 'work' ? rows.length : leaves.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const waiting = tab === 'work' ? schedules.loading || schedules.data?.key !== key : leave.loading || leave.data?.key !== leaveKey
  const loadError = tab === 'work' ? schedules.error : leave.error
  const change = (field: string, value: string) => {
    if (pending.current) return
    const next = new URLSearchParams(params)
    if (value) next.set(field, value); else next.delete(field)
    if (field !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }
  const close = () => { if (pending.current) return; setForm(undefined); setConfirmation(null); setError('') }
  const refresh = () => { if (pending.current) return; schedules.refresh(); leave.refresh(); doctors.refresh() }
  const save = async (input: SaveAdminDoctorScheduleBatchInput) => {
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try {
      if (form) {
        if (!form.version) throw new Error('Hãy đóng cửa sổ và tải lại danh sách trước khi sửa ca.')
        await receptionScheduleApi.update(form.id, { ...input, dayOfWeek: input.dayOfWeeks[0], expectedVersion: form.version })
      } else await receptionScheduleApi.create(input)
      notify.success(form ? 'Đã cập nhật ca làm việc.' : 'Đã thêm lịch làm việc bác sĩ.')
      setForm(undefined); schedules.refresh()
    } catch (reason) { setError(displayError(reason, 'Không thể lưu lịch làm việc.')) }
    finally { pending.current = false; setBusy(false) }
  }
  const deactivate = async () => {
    if (pending.current || !confirmation) return
    pending.current = true; setBusy(true); setError('')
    try {
      if (!confirmation.version) throw new Error('Hãy đóng cửa sổ và tải lại danh sách trước khi ngừng áp dụng ca.')
      await receptionScheduleApi.deactivate(confirmation.id, confirmation.version)
      notify.success('Đã ngừng áp dụng ca làm việc.'); setConfirmation(null); schedules.refresh()
    } catch (reason) { setError(displayError(reason, 'Không thể ngừng áp dụng ca làm việc.')) }
    finally { pending.current = false; setBusy(false) }
  }
  const open = (value: AdminDoctorSchedule | null) => { if (pending.current) return; setError(''); setForm(value) }

  return <AppShell>
    <PageTitle eyebrow="Bàn tiếp đón · Điều phối khám" title="Lịch bác sĩ" description="Quản lý ca làm việc hằng tuần và xem lịch nghỉ để điều phối lịch hẹn. Giờ hiển thị theo giờ Việt Nam." action={<Button disabled={busy || doctors.loading || !!doctors.error || !doctors.data?.some(d => d.isActive)} onClick={() => open(null)}><Plus className="size-4" /> Thêm ca làm việc</Button>} />
    <Card className="mb-5 p-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loại lịch"><Button role="tab" aria-selected={tab === 'work'} variant={tab === 'work' ? 'primary' : 'secondary'} disabled={busy} onClick={() => change('tab', 'work')}>Ca làm việc</Button><Button role="tab" aria-selected={tab === 'leave'} variant={tab === 'leave' ? 'primary' : 'secondary'} disabled={busy} onClick={() => change('tab', 'leave')}>Lịch nghỉ (chỉ xem)</Button></div>
      <fieldset disabled={busy} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">Bác sĩ<select className="input-base mt-2" value={doctorId ?? ''} onChange={e => change('doctor', e.target.value)}><option value="">Tất cả bác sĩ</option>{doctors.data?.map(d => <option key={d.doctorId} value={d.doctorId}>{d.fullName}{!d.isActive ? ' (ngừng hoạt động)' : ''}</option>)}</select></label>
        {tab === 'work' && <><label className="text-sm font-semibold">Ngày trong tuần<select className="input-base mt-2" value={day ?? ''} onChange={e => change('day', e.target.value)}><option value="">Tất cả các ngày</option>{days.map((label, index) => <option key={index} value={index}>{label}</option>)}</select></label><label className="text-sm font-semibold">Trạng thái<select className="input-base mt-2" value={status ?? 'all'} onChange={e => change('status', e.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang áp dụng</option><option value="inactive">Ngừng áp dụng</option></select></label></>}
        <div className="flex items-end"><Button variant="secondary" disabled={busy} onClick={refresh}><RefreshCw className="size-4" /> Tải lại danh sách</Button></div>
      </fieldset>
      {doctors.error && <p role="alert" className="mt-3 text-sm text-rose-700">Không tải được danh sách bác sĩ. Vui lòng thử tải lại.</p>}
    </Card>
    <p className="mb-4 text-sm text-slate-600">{tab === 'work' ? 'Ca lặp lại mỗi tuần. Không thể làm mất khung khám của lịch hẹn chưa hoàn tất từ hôm nay hoặc lượt đang khám. Lịch nghỉ được ưu tiên khi đặt lịch.' : 'Lịch nghỉ của bác sĩ và lịch nghỉ toàn phòng khám. Để điều chỉnh, hãy liên hệ quản trị viên hoặc bác sĩ phụ trách.'}</p>
    <Card className="overflow-hidden">
      {loadError ? <p role="alert" className="p-6 text-rose-700">{loadError}</p> : waiting ? <p role="status" className="p-6 text-slate-500">Đang tải lịch bác sĩ…</p> : total === 0 ? <div className="p-8 text-center"><CalendarDays className="mx-auto mb-3 size-8 text-teal-600" /><p>Không có lịch phù hợp với lựa chọn hiện tại.</p></div> : page > pageCount ? <div className="p-6"><p>Trang này không còn dữ liệu.</p><Button variant="secondary" onClick={() => change('page', '1')}>Về trang đầu</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{(tab === 'work' ? ['Bác sĩ', 'Ngày làm việc', 'Khung giờ', 'Mỗi lượt', 'Trạng thái', 'Thao tác'] : ['Bác sĩ', 'Bắt đầu nghỉ', 'Kết thúc nghỉ', 'Lý do']).map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
        {tab === 'work' ? rows.slice((page - 1) * pageSize, page * pageSize).map(row => <tr key={row.id}><td className="px-4 py-4 font-semibold">{row.doctorName}</td><td className="px-4 py-4">{days[row.dayOfWeek]}</td><td className="px-4 py-4">{row.startTime.slice(0, 5)}–{row.endTime.slice(0, 5)}</td><td className="px-4 py-4">{row.slotMinutes} phút</td><td className="px-4 py-4"><span className={row.isActive ? 'text-teal-700' : 'text-slate-500'}>{row.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}</span></td><td className="px-4 py-4"><div className="flex gap-2"><Button variant="secondary" disabled={busy || !row.version || !doctors.data || !!doctors.error} onClick={() => open(row)} aria-label={`Sửa ca ${days[row.dayOfWeek]} của ${row.doctorName}`}><Pencil className="size-4" /> Sửa</Button>{row.isActive && <Button variant="ghost" disabled={busy || !row.version} onClick={() => { setError(''); setConfirmation(row) }}>Ngừng áp dụng</Button>}</div></td></tr>) : leaves.slice((page - 1) * pageSize, page * pageSize).map(row => <tr key={row.id}><td className="px-4 py-4 font-semibold">{row.doctorId == null ? 'Toàn phòng khám' : doctors.data?.find(d => d.doctorId === row.doctorId)?.fullName ?? `Bác sĩ #${row.doctorId}`}</td><td className="px-4 py-4">{formatDateTime(row.startAt)}</td><td className="px-4 py-4">{formatDateTime(row.endAt)}</td><td className="px-4 py-4">{row.reason || 'Không có ghi chú'}</td></tr>)}
      </tbody></table></div>}
      {!waiting && !loadError && total > 0 && page <= pageCount && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm"><p>{total} {tab === 'work' ? 'ca làm việc' : 'lịch nghỉ'} · Trang {page}/{pageCount}</p><div className="flex gap-2"><Button variant="secondary" disabled={busy || page <= 1} onClick={() => change('page', String(page - 1))}>Trước</Button><Button variant="secondary" disabled={busy || page >= pageCount} onClick={() => change('page', String(page + 1))}>Sau</Button></div></div>}
    </Card>
    {form !== undefined && <ScheduleForm schedule={form} doctors={doctors.data ?? []} submitting={busy} error={error} onCancel={close} onSubmit={save} />}
    {confirmation && <ScheduleDialog title="Ngừng áp dụng ca làm việc?" busy={busy} onClose={close}><p className="text-sm text-slate-600">{confirmation.doctorName} · {days[confirmation.dayOfWeek]} · {confirmation.startTime.slice(0, 5)}–{confirmation.endTime.slice(0, 5)}. Ca này sẽ không nhận lịch mới; lịch sử vẫn được giữ lại.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-6 flex justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={close}>Hủy</Button><Button variant="danger" disabled={busy} onClick={deactivate}>{busy ? 'Đang xử lý…' : 'Ngừng áp dụng'}</Button></div></ScheduleDialog>}
  </AppShell>
}
