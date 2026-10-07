// Real pages and real Sonner; all API calls stay in synthetic in-memory data.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { appointmentApi } from '../../src/features/appointments/api/appointment-api'
import type { Appointment } from '../../src/features/appointments/types/appointment'
import { invoiceApi } from '../../src/features/billing/api/billing-api'
import type { Invoice } from '../../src/features/billing/types/billing'
import { catalogApi } from '../../src/features/catalogs/api/catalog-api'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import { clinicDateInput } from '../../src/features/appointments/utils/patient-appointment-groups'
import AppToaster from '../../src/shared/notifications/AppToaster'
import { notify } from '../../src/shared/notifications/notify'
import ReceptionQueuePage from '../../src/workspaces/reception/pages/ReceptionQueuePage'
import DoctorQueuePage from '../../src/workspaces/doctor/pages/DoctorQueuePage'
import MyAppointmentsPage from '../../src/workspaces/patient/pages/MyAppointmentsPage'
import ReceptionCashierPage from '../../src/workspaces/reception/pages/ReceptionCashierPage'
import '../../src/index.css'

const unavailable = async (): Promise<never> => { throw new Error('DEMO: Chặn yêu cầu ngoài phạm vi.') }
window.fetch = unavailable
for (const api of [appointmentApi, invoiceApi, catalogApi, clinicalApi]) {
  for (const key of Object.keys(api)) Object.assign(api, { [key]: unavailable })
}
let mode = 'success'
let operations = 0
let release: (() => void) | null = null
const appointment = (id: number, startTime: string): Appointment => ({ id, patientId: 1, doctorId: 1,
  patientName: `Bệnh nhân DEMO ${id}`, doctorName: 'Bác sĩ DEMO', doctorSpecialty: 'Khám tổng quát',
  startTime, endTime: startTime, status: 1, statusName: 'Đã xác nhận', source: 0, createdAt: startTime,
  appointmentCode: `DEMO-${id}`, checkedInAt: startTime, queueNumber: id })
let queue = [appointment(1, `${clinicDateInput(Date.now())}T08:00:00`), appointment(2, `${clinicDateInput(Date.now())}T09:00:00`)]
let patientRows = [appointment(3, new Date(Date.now() + 3 * 86400000).toISOString())]
let invoice: Invoice = { id: 101, invoiceNo: 'HD-DEMO-101', patientId: 1, totalAmount: 261000,
  paidAmount: 0, status: 0, consultationFee: 0,
  items: [{ description: 'Dịch vụ DEMO', quantity: 1, unitPrice: 261000, amount: 261000 }], payments: [] }
function stats() {
  const target = document.getElementById('fixture-stats')
  if (target) target.textContent = `Thao tác DEMO: ${operations}; khoản thu DEMO: ${invoice.payments.length}. Không dùng dữ liệu thật.`
}
async function mutation() {
  operations++; stats()
  if (mode === 'error') throw new Error('Lỗi SqlClient database: secret=DEMO')
  if (mode === 'pending') await new Promise<void>(resolve => { release = resolve })
}
appointmentApi.waitingQueue = async () => queue.map(item => ({ ...item }))
appointmentApi.doctorQueue = async () => queue.map(appointment => ({ appointment: { ...appointment }, recentHistory: [] }))
appointmentApi.doctorInProgress = async () => []
appointmentApi.myAppointments = async () => patientRows.map(item => ({ ...item }))
appointmentApi.callNext = async () => { await mutation(); const first = queue[0]; if (!first) throw new Error('Hiện không có bệnh nhân đang chờ khám.'); queue = queue.slice(1); return first }
appointmentApi.moveToEnd = async id => { await mutation(); const item = queue.find(item => item.id === id); if (!item) return unavailable(); queue = [...queue.filter(item => item.id !== id), item]; return item }
appointmentApi.cancel = async id => { await mutation(); patientRows = patientRows.map(item => item.id === id ? { ...item, status: 4 } : item); return patientRows.find(item => item.id === id) ?? unavailable() }
catalogApi.doctors = async () => [{ doctorId: 1, fullName: 'Bác sĩ DEMO', specialtyId: 1, specialtyName: 'Khám tổng quát', consultationFee: 150000 }]
invoiceApi.getById = async () => ({ ...invoice, payments: [...invoice.payments] })
invoiceApi.pay = async (_id, payload) => {
  await mutation()
  if (payload.amount !== 261000 || payload.method !== 0 || payload.cashReceived !== 300000 || invoice.status !== 0) return unavailable()
  invoice = { ...invoice, paidAmount: 261000, status: 1, payments: [{ id: 1, amount: payload.amount,
    method: 0, paidAt: new Date().toISOString(), cashReceived: 300000, changeAmount: 39000,
    idempotencyKey: payload.idempotencyKey, receivedByName: 'Lễ tân DEMO' }] }
  stats()
  if (mode === 'lost') throw new TypeError('Failed to fetch')
  return invoice
}
const auth: AuthContextValue = { user: { id: 11, patientId: 1, doctorId: 1, fullName: 'Người dùng DEMO', roles: ['Receptionist', 'Doctor', 'Patient'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }
function DemoControls() {
  const navigate = useNavigate()
  return <aside aria-label="Kiểm thử DEMO" className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
    <p>DỮ LIỆU MÔ PHỎNG — chỉ kiểm tra giao diện, không gửi tiền hoặc sửa hồ sơ thật.</p>
    <p id="fixture-stats">Thao tác DEMO: 0; khoản thu DEMO: 0.</p>
    <label className="inline-flex flex-wrap items-center gap-2">Kết quả thao tác<select aria-label="Kết quả thao tác DEMO" className="rounded border bg-white p-1" defaultValue="success" onChange={event => { mode = event.target.value }}>
      <option value="success">Thành công</option><option value="error">Lỗi nội bộ</option><option value="pending">Chờ phản hồi</option><option value="lost">Thu xong nhưng mất phản hồi</option>
    </select></label>
    <div className="flex flex-wrap gap-2">{[['Hàng chờ lễ tân', '/reception/queue'], ['Hàng chờ bác sĩ', '/doctor/queue'], ['Lịch hẹn bệnh nhân', '/my-appointments'], ['Thu ngân', '/reception/cashier/101']].map(([label, path]) => <button key={path} className="rounded border px-2 py-1" onClick={() => navigate(path)}>{label}</button>)}</div>
    <div className="flex flex-wrap gap-2"><button className="rounded border px-2 py-1" onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button>
      <button className="rounded border px-2 py-1" onClick={() => notify.info('Lịch đã gần hoặc qua giờ hẹn. Vui lòng liên hệ lễ tân để đổi hoặc hủy lịch.')}>Thử lời nhắc DEMO</button>
      <button className="rounded border px-2 py-1" onClick={() => navigate('/reception/cashier/101', { state: { invoiceCreated: true } })}>Thử thông báo lập hóa đơn</button></div>
  </aside>
}
export default function Preview() {
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/reception/queue']}><DemoControls /><AppToaster />
    <Routes><Route path="/reception/queue" element={<ReceptionQueuePage />} /><Route path="/doctor/queue" element={<DoctorQueuePage />} />
      <Route path="/my-appointments" element={<MyAppointmentsPage />} /><Route path="/reception/cashier/:invoiceId" element={<ReceptionCashierPage />} /></Routes>
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
