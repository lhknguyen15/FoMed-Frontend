// Real pages + Sonner, synthetic data only. No session, HTTP or clinical writes.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { appointmentApi } from '../../src/features/appointments/api/appointment-api'
import type { Appointment } from '../../src/features/appointments/types/appointment'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import type { MedicalRecord, Prescription, PrescribingMedicine, CreatePrescriptionRequest, ServiceOrder } from '../../src/features/clinical/types/clinical'
import { ApiError } from '../../src/shared/api/api-error'
import AppToaster from '../../src/shared/notifications/AppToaster'
import DoctorExamPage from '../../src/workspaces/doctor/pages/DoctorExamPage'
import DoctorPrescriptionPage from '../../src/workspaces/doctor/pages/DoctorPrescriptionPage'
import DoctorServicesPage from '../../src/workspaces/doctor/pages/DoctorServicesPage'
import '../../src/index.css'

const unavailable = async (): Promise<never> => { throw new Error('DEMO: Chặn yêu cầu ngoài phạm vi.') }
window.fetch = unavailable
for (const api of [appointmentApi, clinicalApi]) {
  for (const key of Object.keys(api)) Object.assign(api, { [key]: unavailable })
}
let mode = 'success'
let operations = 0
let release: (() => void) | null = null
const initialRecord: MedicalRecord = { id: 1000, appointmentId: 1000, patientId: 1000, doctorId: 1,
  symptoms: 'Nội dung DEMO', diagnosis: 'Chẩn đoán DEMO, không có giá trị điều trị.',
  isFinalized: false, createdAt: '2026-10-06T08:00:00Z' }
let record = structuredClone(initialRecord)
let prescription: Prescription | null = null
let orders: ServiceOrder[] = []
const medicine: PrescribingMedicine = { id: 1, name: 'Thuốc minh họa DEMO', unit: 'viên', price: 1000, availableQuantity: 10 }
const appointment: Appointment = { id: 1000, appointmentCode: 'AP-DEMO', patientId: 1000,
  patientName: 'Bệnh nhân DEMO', doctorId: 1, doctorName: 'Bác sĩ DEMO', doctorSpecialty: 'DEMO',
  startTime: '2026-10-06T13:00:00', endTime: '2026-10-06T13:30:00', status: 2,
  statusName: 'Đang khám', source: 0, createdAt: '2026-10-06T08:00:00Z' }
function stats() {
  const target = document.getElementById('fixture-stats')
  if (target) target.textContent = `Thao tác DEMO: ${operations}. Không dùng dữ liệu thật.`
}
async function mutation(kind: string) {
  operations++; stats()
  if (mode === 'error') throw new Error('SqlClient exception: secret=DEMO')
  if (mode === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (mode === 'finalize-error' && kind === 'complete') throw new Error('SqlClient exception: secret=DEMO')
  if (mode === 'stock-error' && kind === 'prescription') throw new ApiError('Tồn kho đã thay đổi. Vui lòng kiểm tra lại số lượng.', 409)
}
clinicalApi.record = async () => structuredClone(record)
clinicalApi.recordHistory = async () => []
clinicalApi.prescribingContext = async () => ({ medicalRecordId: 1000, patientName: 'Bệnh nhân DEMO',
  allergies: 'Tiền sử dị ứng DEMO', medicines: [{ ...medicine }] })
clinicalApi.searchMedicines = async () => ({ items: [{ ...medicine }], page: 1, pageSize: 20, totalCount: 1 })
clinicalApi.prescription = async () => prescription ? structuredClone(prescription) : Promise.reject(new ApiError('Không có đơn DEMO.', 404))
clinicalApi.updateRecord = async (_id, request) => { await mutation('record'); record = { ...record, ...request }; return structuredClone(record) }
appointmentApi.getById = async () => ({ ...appointment })
appointmentApi.complete = async () => { await mutation('complete'); record = { ...record, isFinalized: true }; return { ...appointment, status: 3 } }
async function savePrescription(_id: number, request: CreatePrescriptionRequest): Promise<Prescription> {
  await mutation('prescription')
  prescription = { id: 1, medicalRecordId: 1000, note: request.note, isDispensed: false,
    items: request.items.map(item => ({ ...item, medicineName: medicine.name, unitPriceSnapshot: medicine.price })) }
  return structuredClone(prescription)
}
clinicalApi.createPrescription = savePrescription
clinicalApi.updatePrescription = savePrescription
clinicalApi.servicesCatalog = async () => [{ id: 1, name: 'Dịch vụ minh họa DEMO', price: 10000 }]
clinicalApi.serviceOrders = async () => structuredClone(orders)
clinicalApi.attachments = async () => ({ items: [], page: 1, pageSize: 20, total: 0 })
clinicalApi.orderService = async (_id, request) => { await mutation('order'); const order = { id: orders.length + 1,
  medicalRecordId: 1000, serviceId: request.serviceId, serviceName: 'Dịch vụ minh họa DEMO', status: 0,
  quantity: request.quantity, unitPriceSnapshot: 10000 }; orders = [...orders, order]; return { ...order } }
clinicalApi.cancelOrder = async id => { await mutation('cancel'); orders = orders.map(item => item.id === id ? { ...item, status: 2 } : item); return { ...orders.find(item => item.id === id)! } }
const auth: AuthContextValue = { user: { id: 11, doctorId: 1, patientId: null, fullName: 'Bác sĩ DEMO', roles: ['Doctor'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }
function Controls({ reset }: { reset: () => void }) {
  const navigate = useNavigate()
  return <aside aria-label="Kiểm thử DEMO" className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
    <p>DỮ LIỆU MÔ PHỎNG — không có giá trị điều trị, không sửa hồ sơ thật.</p>
    <p id="fixture-stats">Thao tác DEMO: 0.</p>
    <label className="inline-flex flex-wrap items-center gap-2">Kết quả thao tác<select aria-label="Kết quả thao tác DEMO" className="rounded border bg-white p-1" defaultValue="success" onChange={event => { mode = event.target.value }}>
      <option value="success">Thành công</option><option value="error">Lỗi nội bộ</option><option value="pending">Chờ phản hồi</option>
      <option value="finalize-error">Lưu được, chốt thất bại</option><option value="stock-error">Tồn kho thay đổi</option>
    </select></label>
    <div className="flex flex-wrap gap-2">{[['Bệnh án DEMO', '/doctor/exam/1000'], ['Đơn thuốc DEMO', '/doctor/exam/1000/prescription'], ['Chỉ định DEMO', '/doctor/exam/1000/services']].map(([label, path]) => <button key={path} className="rounded border px-2 py-1" onClick={() => { toast.dismiss(); navigate(path) }}>{label}</button>)}</div>
    <div className="flex flex-wrap gap-2"><button className="rounded border px-2 py-1" onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button>
      <button className="rounded border px-2 py-1" onClick={reset}>Làm lại DEMO</button></div>
  </aside>
}
export default function Preview() {
  const [revision, setRevision] = useState(0)
  const reset = () => { record = structuredClone(initialRecord); prescription = null; orders = []; operations = 0; mode = 'success'; release = null; toast.dismiss(); setRevision(value => value + 1) }
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/doctor/exam/1000']}><Controls key={`controls-${revision}`} reset={reset} /><AppToaster />
    <Routes key={`routes-${revision}`}><Route path="/" element={<DoctorExamPage />} />
      <Route path="/doctor/exam/:recordId" element={<DoctorExamPage />} />
      <Route path="/doctor/exam/:recordId/prescription" element={<DoctorPrescriptionPage />} />
      <Route path="/doctor/exam/:recordId/services" element={<DoctorServicesPage />} /></Routes>
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
