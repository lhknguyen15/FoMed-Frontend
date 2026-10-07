// Real booking pages and attachment component. All APIs mocked; HTTP blocked.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { appointmentApi } from '../../src/features/appointments/api/appointment-api'
import type { Appointment } from '../../src/features/appointments/types/appointment'
import { catalogApi } from '../../src/features/catalogs/api/catalog-api'
import { patientApi, patientStaffApi } from '../../src/features/patients/api/patient-api'
import type { Patient } from '../../src/features/patients/types/patient'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import type { ClinicalAttachment } from '../../src/features/clinical/types/clinical'
import { ApiError } from '../../src/shared/api/api-error'
import AppToaster from '../../src/shared/notifications/AppToaster'
import BookingPage from '../../src/workspaces/patient/pages/BookingPage'
import ReceptionBookingPage from '../../src/workspaces/reception/pages/ReceptionBookingPage'
import AttachmentPanel from '../../src/features/clinical/components/AttachmentPanel'
import AppShell from '../../src/components/AppShell'
import '../../src/index.css'

const blocked = async (): Promise<never> => { throw new Error('DEMO: Chặn kết nối ngoài phạm vi.') }
window.fetch = blocked
for (const api of [appointmentApi, catalogApi, patientApi, patientStaffApi, clinicalApi]) {
  for (const key of Object.keys(api)) Object.assign(api, { [key]: blocked })
}
const patient: Patient = { patientId: 1, patientCode: 'BN-DEMO', fullName: 'Người dùng DEMO', phone: '0000000000', isActive: true }
const initialAttachments = (): ClinicalAttachment[] => [
  { id: 1, medicalRecordId: 1, orderId: null, fileName: 'tai-lieu-demo.pdf', contentType: 'application/pdf', fileSize: 128, uploadedAt: '2026-10-07T08:00:00Z', downloadable: true },
  { id: 2, medicalRecordId: 1, orderId: null, fileName: 'tep-cu-demo.pdf', contentType: 'application/pdf', fileSize: 128, uploadedAt: '2026-10-07T08:00:00Z', downloadable: false },
]
let mode = 'success'
let operations = 0
let savedBookings = 0
let attachments = initialAttachments()
let bookedSlots = new Set<string>()
let reloadFails = false
let release: (() => void) | null = null
const stats = () => {
  const node = document.getElementById('demo-stats')
  if (node) node.textContent = `Thao tác DEMO: ${operations}; lịch đã lưu: ${savedBookings}; tệp mới: ${attachments.length - 2}.`
}
async function mutation() {
  const outcome = mode
  operations++; stats()
  if (outcome === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (outcome === 'error') throw new Error('SqlClient exception: secret=DEMO')
  return outcome
}
catalogApi.specialties = async () => [{ specialtyId: 1, name: 'Chuyên khoa DEMO' }]
catalogApi.doctors = async () => [{ doctorId: 1, fullName: 'Bác sĩ DEMO', specialtyId: 1, specialtyName: 'Chuyên khoa DEMO', consultationFee: 100000 }]
catalogApi.services = async () => [{ id: 1, name: 'Dịch vụ DEMO', price: 100000 }]
patientApi.me = async () => ({ ...patient })
patientStaffApi.search = async () => [{ ...patient }]
patientStaffApi.create = async () => { await mutation(); return { ...patient } }
appointmentApi.availableSlots = async (_id, date) => {
  if (reloadFails || mode === 'slots-error') throw new Error('SqlClient exception: secret=DEMO')
  return ['08:00:00', '09:00:00'].map(time => ({ startTime: `${date}T${time}`, endTime: `${date}T${time.replace(':00:00', ':30:00')}`, isAvailable: !bookedSlots.has(`${date}T${time}`) }))
}
async function saveBooking(startTime: string, source: number): Promise<Appointment> {
  const outcome = await mutation()
  if (outcome === 'conflict') { bookedSlots.add(startTime); throw new ApiError('Khung giờ đã được đặt. Vui lòng chọn giờ khác.', 409) }
  savedBookings++; bookedSlots.add(startTime); stats(); reloadFails = outcome === 'reload-error'
  return { id: savedBookings, appointmentCode: `LH-DEMO-${savedBookings}`, patientId: 1, patientName: patient.fullName,
    doctorId: 1, doctorName: 'Bác sĩ DEMO', doctorSpecialty: 'Chuyên khoa DEMO', startTime, endTime: startTime,
    status: source ? 1 : 0, statusName: source ? 'Đã xác nhận' : 'Chờ xác nhận', source, createdAt: startTime }
}
appointmentApi.book = request => saveBooking(request.startTime, 0)
appointmentApi.staffBook = request => saveBooking(request.startTime, request.source)
clinicalApi.attachments = async (_recordId, page = 1) => {
  if (reloadFails) throw new Error('SqlClient exception: secret=DEMO')
  return { items: attachments.slice((page - 1) * 10, page * 10), total: attachments.length, page, pageSize: 10 }
}
clinicalApi.uploadAttachment = async (recordId, file, orderId) => {
  const outcome = await mutation()
  if (outcome === 'forbidden') throw new ApiError('Không có quyền truy cập tệp bệnh án này.', 403)
  const row: ClinicalAttachment = { id: attachments.length + 1, medicalRecordId: recordId, orderId: orderId ?? null,
    fileName: file.name, contentType: file.type, fileSize: file.size, uploadedAt: '2026-10-07T08:00:00Z', downloadable: true }
  attachments = [row, ...attachments]; reloadFails = outcome === 'reload-error'; stats(); return row
}
clinicalApi.downloadAttachment = async () => {
  const outcome = await mutation()
  if (outcome === 'forbidden') throw new ApiError('Không có quyền truy cập tệp bệnh án này.', 403)
  return { blob: new Blob(['%PDF-1.4\n% SYNTHETIC DEMO\n%%EOF'], { type: 'application/pdf' }), fileName: 'tai-lieu-demo.pdf' }
}
const auth: AuthContextValue = { user: { id: 1, patientId: 1, doctorId: 1, fullName: 'Người dùng DEMO', roles: ['Patient', 'Receptionist', 'Doctor'] },
  isReady: true, isAuthenticated: true, login: blocked, register: blocked, forgotPassword: blocked, logout() {}, updateFullName() {} }
function Controls({ reset }: { reset: () => void }) {
  const navigate = useNavigate()
  return <aside className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
    <p>DEMO — không tạo lịch, hồ sơ hay tải tệp lên hệ thống thật.</p><p id="demo-stats">{`Thao tác DEMO: ${operations}; lịch đã lưu: ${savedBookings}; tệp mới: ${attachments.length - 2}.`}</p>
    <label>Kết quả DEMO <select aria-label="Kết quả DEMO" defaultValue={mode} onChange={event => { mode = event.target.value; if (mode === 'success') reloadFails = false }}>
      <option value="success">Thành công</option><option value="pending">Chờ phản hồi</option><option value="error">Lỗi nội bộ</option>
      <option value="conflict">Giờ vừa được đặt</option><option value="forbidden">Không có quyền</option><option value="slots-error">Lỗi tải khung giờ</option><option value="reload-error">Lưu được, tải lại lỗi</option>
    </select></label>
    <div className="flex flex-wrap gap-3">{[['Bệnh nhân đặt lịch', '/booking'], ['Lễ tân đặt lịch', '/reception/booking'], ['Tệp đính kèm', '/doctor/attachments'], ['Tệp chỉ đọc', '/attachments-readonly']].map(([label, route]) =>
      <button key={route} onClick={() => { toast.dismiss(); reloadFails = false; navigate(route) }}>{label}</button>)}
      <button onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button><button onClick={reset}>Làm lại DEMO</button>
    </div>
  </aside>
}
export default function Preview() {
  const [revision, setRevision] = useState(0)
  const reset = () => { operations = 0; savedBookings = 0; attachments = initialAttachments(); bookedSlots = new Set(); reloadFails = false; release = null; toast.dismiss(); setRevision(value => value + 1) }
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/booking']}><AppToaster /><Controls key={`controls-${revision}`} reset={reset} />
    <Routes key={`routes-${revision}`}><Route path="/booking" element={<BookingPage />} /><Route path="/reception/booking" element={<ReceptionBookingPage />} />
      <Route path="/doctor/attachments" element={<AppShell><h1 className="mb-5 text-2xl font-bold">Tệp minh họa DEMO</h1><AttachmentPanel recordId={1} canUpload /></AppShell>} />
      <Route path="/attachments-readonly" element={<AppShell><AttachmentPanel recordId={1} /></AppShell>} />
      <Route path="/my-appointments" element={<AppShell><p>Lịch DEMO đã lưu: {savedBookings}. Lịch trực tuyến chờ lễ tân xác nhận.</p></AppShell>} />
    </Routes>
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
