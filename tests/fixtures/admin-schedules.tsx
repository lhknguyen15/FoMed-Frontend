// Local-only browser QA: real page/Radix/Sonner, synthetic mutable data, all HTTP blocked.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import ScheduleManagementPage from '../../src/cms/schedules/pages/ScheduleManagementPage'
import { scheduleAdminApi } from '../../src/features/schedules/api/schedule-api'
import { doctorAdminApi } from '../../src/features/doctors/api/doctor-api'
import { ApiError } from '../../src/shared/api/api-error'
import AppToaster from '../../src/shared/notifications/AppToaster'
import type { AdminDoctorSchedule, DoctorTimeOff } from '../../src/features/schedules/types/schedule'
import '../../src/index.css'

const blocked = async (): Promise<never> => { throw new Error('DEMO không cho phép gọi hệ thống thật.') }
window.fetch = blocked
for (const api of [scheduleAdminApi, doctorAdminApi]) for (const key of Object.keys(api)) Object.assign(api, { [key]: blocked })
window.confirm = () => { throw new Error('Không được mở xác nhận trình duyệt trong kiểm thử này.') }
let mode = 'success'
let calls = 0
let readFails = false
let leaves: DoctorTimeOff[] = []
let schedules: AdminDoctorSchedule[] = []
const doctor = { doctorId: 1, userId: 1, fullName: 'Bác sĩ DEMO — dữ liệu giả', specialtyId: 1, specialtyName: 'Chuyên khoa DEMO', isActive: true, consultationFee: 100000 }
function reset(count = 1) {
  calls = 0; readFails = false
  leaves = Array.from({ length: count }, (_, index) => ({ id: index + 1, doctorId: index === 0 ? null : 1, startAt: '2030-01-03T01:00:00Z', endAt: '2030-01-03T05:00:00Z', reason: `Đào tạo DEMO ${index + 1}` }))
  schedules = [1, 3, 5].map((dayOfWeek, index) => ({ id: index + 1, version: `demo-version-${index}`, doctorId: 1, doctorName: doctor.fullName, dayOfWeek, startTime: '08:00:00', endTime: '12:00:00', slotMinutes: 30, isActive: true }))
}
reset()
async function read<T>(data: T): Promise<T> { if (readFails) throw new Error('SQL DEMO secret must be hidden'); return structuredClone(data) }
async function write() {
  calls++
  document.getElementById('schedule-demo-calls')!.textContent = `Số lần gửi mô phỏng: ${calls}`
  const current = mode
  if (current === 'pending') await new Promise(resolve => setTimeout(resolve, 15_000))
  if (current === 'error') throw new Error('SQL DEMO secret must be hidden')
  if (current === 'conflict') throw new ApiError('Khoảng nghỉ đang có lịch hẹn, cần xử lý lịch bị ảnh hưởng trước.', 409)
  readFails = current === 'reload-error'
}
doctorAdminApi.list = () => read([doctor])
scheduleAdminApi.schedules = () => read(schedules)
scheduleAdminApi.timeOff = () => read(leaves)
scheduleAdminApi.deleteTimeOff = async id => { await write(); leaves = leaves.filter(item => item.id !== id); return null }
scheduleAdminApi.deleteSchedule = async id => { await write(); schedules = schedules.filter(item => item.id !== id); return null }
scheduleAdminApi.createTimeOff = async input => { await write(); const item = { id: Date.now(), ...input }; leaves.push(item); return item }
scheduleAdminApi.updateTimeOff = async (id, input) => { await write(); const item = { id, ...input }; leaves = leaves.map(old => old.id === id ? item : old); return item }
scheduleAdminApi.createSchedules = async input => { await write(); const items = input.dayOfWeeks.map((dayOfWeek, index) => ({ ...input, id: Date.now() + index, version: 'demo-created', dayOfWeek, doctorName: doctor.fullName })); schedules.push(...items); return items }
scheduleAdminApi.updateSchedule = async (id, input) => { await write(); const item = { ...input, id, version: 'demo-updated', doctorName: doctor.fullName }; schedules = schedules.map(old => old.id === id ? item : old); return item }

export default function Preview() {
  const [revision, setRevision] = useState(0)
  return <MemoryRouter initialEntries={['/admin/schedules?tab=leave']}><AppToaster />
    <aside className="space-y-2 border-b border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-bold">KIỂM THỬ LỊCH QUẢN TRỊ — chỉ dữ liệu tổng hợp trong bộ nhớ. HTTP bị chặn; không sửa Azure.</p>
      <p id="schedule-demo-calls">Số lần gửi mô phỏng: {calls}</p>
      <label>Kết quả mô phỏng <select aria-label="Kết quả mô phỏng" defaultValue={mode} onChange={event => { mode = event.target.value }} className="rounded-lg border border-amber-300 bg-white p-2">
        <option value="success">Thành công</option><option value="error">Lỗi nội bộ</option><option value="conflict">Trùng lịch hẹn</option><option value="pending">Phản hồi sau 15 giây</option><option value="reload-error">Xóa được nhưng tải lại lỗi</option>
      </select></label>{' '}
      <button className="rounded-lg border bg-white px-3 py-2" onClick={() => { reset(); setRevision(value => value + 1) }}>Khôi phục 1 lịch nghỉ mẫu</button>{' '}
      <button className="rounded-lg border bg-white px-3 py-2" onClick={() => { reset(11); setRevision(value => value + 1) }}>Tạo 11 lịch nghỉ mẫu</button>
    </aside>
    <main className="mx-auto max-w-7xl p-4 sm:p-6"><ScheduleManagementPage key={revision} /></main>
  </MemoryRouter>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
