// Isolated real-page preview: synthetic patient/appointments, blocked HTTP and writes.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { appointmentApi } from '../../src/features/appointments/api/appointment-api'
import type { Appointment } from '../../src/features/appointments/types/appointment'
import { appointmentTimestamp, clinicDateInput } from '../../src/features/appointments/utils/patient-appointment-groups'
import MyAppointmentsPage from '../../src/workspaces/patient/pages/MyAppointmentsPage'
import '../../src/index.css'

let now = Date.parse('2026-10-06T08:00:00+07:00')
Date.now = () => now
let reads = 0
let blocked = 0
const unavailable = async (): Promise<never> => { blocked++; throw new Error('DEMO: Không cho phép gửi yêu cầu hoặc thay đổi dữ liệu thật.') }
window.fetch = unavailable
for (const key of Object.keys(appointmentApi) as (keyof typeof appointmentApi)[]) Object.assign(appointmentApi, { [key]: unavailable })
const appointment = (id: number, status: number, startTime: string): Appointment => ({ id, status, startTime,
  endTime: startTime.replace(':00:00', ':30:00'), appointmentCode: `DEMO-${id}`, doctorName: `Bác sĩ DEMO ${id}`,
  doctorSpecialty: 'Khám tổng quát', doctorRoom: 'Phòng DEMO', patientId: 1, patientName: 'Bệnh nhân DEMO', doctorId: 1,
  source: 0, statusName: 'INTERNAL_STATUS', createdAt: '2026-10-01T08:00:00', serviceName: 'Khám tổng quát', feeSnapshot: 150000 })
const records = [
  ...Array.from({ length: 11 }, (_, index) => appointment(index + 1, index % 2, `2026-10-06T${String(index + 9).padStart(2, '0')}:00:00`)),
  appointment(12, 1, '2026-10-08T09:00:00'),
  appointment(20, 0, '2026-10-05T09:00:00'), appointment(21, 1, '2026-10-05T10:00:00'),
  appointment(22, 1, '2026-10-06T08:00:00'), appointment(23, 0, 'invalid'), appointment(24, 99, '2026-10-08T10:00:00'),
  appointment(30, 2, '2026-10-05T11:00:00'), appointment(31, 2, '2026-10-06T11:00:00'),
  appointment(40, 3, '2026-10-04T09:00:00'), appointment(41, 3, '2026-10-05T09:00:00'),
  appointment(50, 4, '2026-10-07T09:00:00'), appointment(51, 5, '2026-10-05T09:00:00'),
]
appointmentApi.myAppointments = async (filters = {}) => {
  reads++
  const result = records.filter(item => !filters.date || clinicDateInput(appointmentTimestamp(item.startTime)) === filters.date)
  const stats = document.getElementById('fixture-stats')
  if (stats) stats.textContent = `Lượt tải DEMO: ${reads}. Thao tác bị chặn: ${blocked}. Không đổi trạng thái lịch.`
  return result.map(item => ({ ...item }))
}
appointmentApi.availableSlots = async () => [{ startTime: '2026-10-08T10:00:00', endTime: '2026-10-08T10:30:00', isAvailable: true }]
const auth: AuthContextValue = { user: { id: 11, patientId: 1, doctorId: null, fullName: 'Bệnh nhân DEMO', roles: ['Patient'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }

export default function Preview() {
  const [advanced, setAdvanced] = useState(false)
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/my-appointments']}>
    <aside className="relative z-50 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" aria-label="Kiểm thử DEMO">
      <p>DỮ LIỆU MÔ PHỎNG — không đọc hồ sơ hoặc thay dữ liệu thật.</p>
      <p id="fixture-stats">Đang tải DEMO…</p>
      <button className="mt-2 rounded border border-amber-400 px-3 py-1" disabled={advanced} onClick={() => {
        now = Date.parse('2026-10-07T08:00:00+07:00'); setAdvanced(true); window.dispatchEvent(new Event('focus'))
      }}>Chuyển sang ngày kế tiếp (DEMO)</button>
    </aside><MyAppointmentsPage />
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<Preview />)
