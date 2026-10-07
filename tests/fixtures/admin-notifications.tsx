// Real admin pages + real Sonner. Business APIs are in-memory; HTTP is blocked.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'
import DoctorManagementPage from '../../src/cms/doctors/pages/DoctorManagementPage'
import SpecialtyManagementPage from '../../src/cms/specialties/pages/SpecialtyManagementPage'
import ServiceManagementPage from '../../src/cms/services/pages/ServiceManagementPage'
import UserManagementPage from '../../src/cms/users/pages/UserManagementPage'
import ScheduleManagementPage from '../../src/cms/schedules/pages/ScheduleManagementPage'
import TimeOffManagementPage from '../../src/cms/time-off/pages/TimeOffManagementPage'
import { authApi } from '../../src/features/auth/api/auth-api'
import { doctorAdminApi } from '../../src/features/doctors/api/doctor-api'
import { serviceAdminApi } from '../../src/features/billing/api/billing-api'
import { scheduleAdminApi } from '../../src/features/schedules/api/schedule-api'
import type { AdminUser } from '../../src/features/auth/types/auth'
import type { Doctor, Specialty } from '../../src/features/doctors/types/doctor'
import type { MedicalService } from '../../src/features/billing/types/billing'
import type { AdminDoctorSchedule, DoctorTimeOff } from '../../src/features/schedules/types/schedule'
import AppToaster from '../../src/shared/notifications/AppToaster'
import '../../src/index.css'

const blocked = async (): Promise<never> => { throw new Error('DEMO: Không cho phép kết nối hệ thống thật.') }
window.fetch = blocked
for (const api of [authApi, doctorAdminApi, serviceAdminApi, scheduleAdminApi]) {
  for (const key of Object.keys(api)) Object.assign(api, { [key]: blocked })
}
const doctor: Doctor = { doctorId: 1, userId: 1, fullName: 'Bác sĩ DEMO', specialtyId: 1, specialtyName: 'Chuyên khoa DEMO', consultationFee: 100000, isActive: true }
const specialty: Specialty = { specialtyId: 1, name: 'Chuyên khoa DEMO', description: 'Dữ liệu tổng hợp', isActive: true }
const service: MedicalService = { serviceId: 1, code: 'DV-DEMO', name: 'Dịch vụ DEMO', price: 100000, durationMinutes: 30, isActive: true }
const schedule: AdminDoctorSchedule = { id: 1, doctorId: 1, doctorName: 'Bác sĩ DEMO', dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00', slotMinutes: 30, isActive: true }
const leave: DoctorTimeOff = { id: 1, doctorId: 1, startAt: '2026-10-20T08:00:00', endAt: '2026-10-20T12:00:00', reason: 'Đào tạo DEMO' }
let user: AdminUser = { userId: 1, username: 'demo', fullName: 'Người dùng DEMO', roles: ['Receptionist'], isActive: true, createdAt: '2026-10-01T08:00:00Z' }
let mode = 'success'
let writes = 0
let release: (() => void) | null = null
let reloadFails = false
const stats = () => { const node = document.getElementById('demo-writes'); if (node) node.textContent = `Lần gửi DEMO: ${writes}` }
async function mutation() {
  const outcome = mode
  writes++; stats()
  if (outcome === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (outcome === 'error') throw new Error('SqlClient exception: secret=DEMO')
  reloadFails = outcome === 'reload-error'
}
async function read<T>(value: T): Promise<T> {
  if (reloadFails) throw new Error('SqlClient exception: secret=DEMO')
  return structuredClone(value)
}
doctorAdminApi.list = () => read([doctor])
doctorAdminApi.specialties = () => read([specialty])
doctorAdminApi.create = async () => { await mutation(); return { ...doctor } }
doctorAdminApi.update = async (_id, input) => { await mutation(); return { ...doctor, ...input } }
doctorAdminApi.createSpecialty = async input => { await mutation(); return { ...specialty, ...input } }
doctorAdminApi.updateSpecialty = async (_id, input) => { await mutation(); return { ...specialty, ...input } }
serviceAdminApi.list = () => read([service])
serviceAdminApi.create = async input => { await mutation(); return { ...service, ...input } }
serviceAdminApi.update = async (_id, input) => { await mutation(); return { ...service, ...input } }
authApi.adminUsers = () => read({ items: [user], total: 1, page: 1, pageSize: 10 })
authApi.adminRoles = () => read([{ roleId: 1, name: 'Receptionist', userCount: 1 }, { roleId: 2, name: 'Doctor', userCount: 0 }])
authApi.updateAdminUserStatus = async (_id, isActive) => { await mutation(); user = { ...user, isActive }; return { ...user } }
authApi.updateAdminUserRoles = async (_id, roles) => { await mutation(); user = { ...user, roles }; return { ...user } }
authApi.resetAdminUserPassword = async () => { await mutation(); return null }
scheduleAdminApi.schedules = () => read([schedule])
scheduleAdminApi.createSchedules = async input => { await mutation(); return input.dayOfWeeks.map(dayOfWeek => ({ ...schedule, ...input, dayOfWeek })) }
scheduleAdminApi.updateSchedule = async (_id, input) => { await mutation(); return { ...schedule, ...input } }
scheduleAdminApi.deleteSchedule = async () => { await mutation(); return null }
scheduleAdminApi.timeOff = () => read([leave])
scheduleAdminApi.createTimeOff = async input => { await mutation(); return { ...leave, ...input } }
scheduleAdminApi.updateTimeOff = async (_id, input) => { await mutation(); return { ...leave, ...input } }
scheduleAdminApi.deleteTimeOff = async () => { await mutation(); return null }
const pages = { specialties: SpecialtyManagementPage, services: ServiceManagementPage, doctors: DoctorManagementPage,
  users: UserManagementPage, schedules: ScheduleManagementPage, leave: TimeOffManagementPage }
export default function Preview() {
  const [page, setPage] = useState<keyof typeof pages>('specialties')
  const [revision, setRevision] = useState(0)
  const Page = pages[page]
  return <MemoryRouter><AppToaster />
    <aside className="space-y-2 border-b border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p>DEMO QUẢN TRỊ — dữ liệu tổng hợp trong bộ nhớ, không sửa tài khoản/quyền/lịch thật.</p>
      <p id="demo-writes">Lần gửi DEMO: {writes}</p>
      <label>Trang DEMO <select aria-label="Trang DEMO" value={page} onChange={event => { toast.dismiss(); setPage(event.target.value as keyof typeof pages) }}>
        <option value="specialties">Chuyên khoa</option><option value="services">Dịch vụ</option><option value="doctors">Bác sĩ</option>
        <option value="users">Người dùng</option><option value="schedules">Lịch làm việc & nghỉ</option><option value="leave">Lịch nghỉ riêng</option>
      </select></label>{' '}
      <label>Kết quả DEMO <select aria-label="Kết quả DEMO" defaultValue={mode} onChange={event => { mode = event.target.value; if (mode === 'success') reloadFails = false }}>
        <option value="success">Thành công</option><option value="pending">Chờ phản hồi</option><option value="error">Lỗi nội bộ</option><option value="reload-error">Lưu được, tải lại lỗi</option>
      </select></label>{' '}
      <button onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button>{' '}
      <button onClick={() => { writes = 0; reloadFails = false; release = null; toast.dismiss(); setRevision(value => value + 1) }}>Làm lại DEMO</button>
    </aside>
    <main className="mx-auto max-w-7xl p-6"><Page key={`${page}-${revision}`} /></main>
  </MemoryRouter>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
