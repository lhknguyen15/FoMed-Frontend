// Real pages/navigation, synthetic snapshots only. All HTTP and writes are blocked.
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { appointmentApi } from '../../src/features/appointments/api/appointment-api'
import type { Appointment } from '../../src/features/appointments/types/appointment'
import { catalogApi } from '../../src/features/catalogs/api/catalog-api'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import { appointmentTimestamp, clinicDateInput } from '../../src/features/appointments/utils/patient-appointment-groups'
import AppShell from '../../src/components/AppShell'
import MyAppointmentsPage from '../../src/workspaces/patient/pages/MyAppointmentsPage'
import ReceptionQueuePage from '../../src/workspaces/reception/pages/ReceptionQueuePage'
import DoctorQueuePage from '../../src/workspaces/doctor/pages/DoctorQueuePage'
import '../../src/index.css'

let now = Date.parse('2026-10-06T08:00:00+07:00')
Date.now = () => now
let mode = 'populated'
let reads = 0
let blocked = 0
const unavailable = async (): Promise<never> => { blocked++; throw new Error('DEMO: Không cho phép gửi yêu cầu hoặc thay đổi dữ liệu thật.') }
window.fetch = unavailable
for (const api of [appointmentApi, catalogApi, clinicalApi]) {
  for (const key of Object.keys(api)) Object.assign(api, { [key]: unavailable })
}
const appointment = (id: number, status: number, startTime: string, doctorId = 1): Appointment => ({ id, status, startTime,
  endTime: startTime.replace(':00:00', ':30:00'), appointmentCode: `DEMO-${id}`, doctorName: `Bác sĩ DEMO ${doctorId}`,
  doctorSpecialty: 'Khám tổng quát', patientId: 1, patientName: `Bệnh nhân DEMO ${id}`, doctorId, source: 0,
  statusName: 'INTERNAL', createdAt: '2026-10-01T08:00:00', checkedInAt: '2026-10-06T00:30:00Z', queueNumber: id })
const patientRows = [appointment(1, 0, '2026-10-06T09:00:00'), appointment(2, 1, '2026-10-06T10:00:00'),
  appointment(3, 1, '2026-10-08T09:00:00'), appointment(4, 1, '2026-10-05T09:00:00'),
  appointment(5, 2, '2026-10-05T10:00:00'), appointment(6, 3, '2026-10-05T11:00:00')]
const queueRows = Array.from({ length: 4 }, (_, index) => appointment(index + 10, 1, `2026-10-06T${String(index + 9).padStart(2, '0')}:00:00`, index < 2 ? 1 : 2))
async function snapshot<T>(data: T[]): Promise<T[]> {
  reads++
  const stats = document.getElementById('fixture-stats')
  if (stats) stats.textContent = `Lượt tải danh sách DEMO: ${reads}. Thao tác bị chặn: ${blocked}.`
  if (mode === 'pending') return new Promise(() => {})
  if (mode === 'error') throw new Error('Không thể tải danh sách DEMO. Vui lòng thử lại.')
  return mode === 'empty' ? [] : data.map(item => ({ ...item }))
}
appointmentApi.myAppointments = async (filters = {}) => snapshot(patientRows.filter(item => !filters.date || clinicDateInput(appointmentTimestamp(item.startTime)) === filters.date))
appointmentApi.waitingQueue = async (date, doctorId) => snapshot(queueRows.filter(item => clinicDateInput(appointmentTimestamp(item.startTime)) === date && (!doctorId || item.doctorId === doctorId)))
appointmentApi.doctorQueue = async date => snapshot(queueRows.filter(item => item.doctorId === 1 && clinicDateInput(appointmentTimestamp(item.startTime)) === date)
  .map(appointment => ({ appointment, recentHistory: [] })))
appointmentApi.doctorInProgress = async () => []
catalogApi.doctors = async () => [1, 2].map(doctorId => ({ doctorId, fullName: `Bác sĩ DEMO ${doctorId}`, specialtyId: 1, specialtyName: 'Khám tổng quát', consultationFee: 150000 }))
const auth: AuthContextValue = { user: { id: 11, patientId: 1, doctorId: 1, fullName: 'Người dùng DEMO', roles: ['Patient', 'Receptionist', 'Doctor'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }

export default function Preview() {
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/my-appointments']}>
    <aside className="relative z-10 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]" aria-label="Kiểm thử DEMO">
      <p>DỮ LIỆU MÔ PHỎNG — không đọc hồ sơ hoặc thay dữ liệu thật.</p>
      <p id="fixture-stats">Đang tải DEMO…</p>
      <label className="mr-3 inline-flex flex-wrap items-center gap-2">Kết quả tải DEMO<select aria-label="Kết quả tải DEMO" defaultValue="populated" className="rounded border border-amber-300 bg-white p-1" onChange={event => { mode = event.target.value }}>
        <option value="populated">Có dữ liệu</option><option value="empty">Danh sách rỗng</option><option value="error">Lỗi tải</option><option value="pending">Đang tải</option>
      </select></label>
      <button className="mt-2 rounded border border-amber-400 px-3 py-1" onClick={() => { now = Date.parse('2026-10-07T08:00:00+07:00'); window.dispatchEvent(new Event('focus')) }}>Chuyển sang ngày kế tiếp (DEMO)</button>
      <p>Chọn kết quả rồi bấm Làm mới trên màn hình. Không bấm thao tác ghi hồ sơ.</p>
    </aside>
    <Routes>
      <Route path="/my-appointments" element={<MyAppointmentsPage />} />
      <Route path="/reception" element={<AppShell><p>Màn hình chưa tải hàng chờ — không có số đếm.</p></AppShell>} />
      <Route path="/reception/queue" element={<ReceptionQueuePage />} />
      <Route path="/doctor/queue" element={<DoctorQueuePage />} />
      <Route path="/booking" element={<AppShell><p>Màn hình chưa tải lịch hẹn — không có số đếm.</p></AppShell>} />
    </Routes>
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<Preview />)
