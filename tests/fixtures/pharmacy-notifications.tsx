// Real pharmacy pages and Sonner; all operations use synthetic in-memory data.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import { pharmacyApi } from '../../src/features/pharmacy/api/pharmacy-api'
import type { DispensePrescriptionResponse, PharmacyPrescription } from '../../src/features/pharmacy/types/pharmacy'
import { ApiError } from '../../src/shared/api/api-error'
import AppToaster from '../../src/shared/notifications/AppToaster'
import PharmacyReceiptPage from '../../src/workspaces/pharmacy/pages/PharmacyReceiptPage'
import PharmacyDispensePage from '../../src/workspaces/pharmacy/pages/PharmacyDispensePage'
import '../../src/index.css'

const unavailable = async (): Promise<never> => { throw new Error('DEMO: Chặn yêu cầu ngoài phạm vi.') }
window.fetch = unavailable
for (const api of [clinicalApi, pharmacyApi]) {
  for (const key of Object.keys(api)) Object.assign(api, { [key]: unavailable })
}
let mode = 'success'
let operations = 0
let receipts = 0
let stockDeductions = 0
let dispensed = false
let release: (() => void) | null = null
function stats() {
  const target = document.getElementById('fixture-stats')
  if (target) target.textContent = `Thao tác DEMO: ${operations}; phiếu nhập: ${receipts}; lần trừ kho: ${stockDeductions}.`
}
async function mutation() {
  const outcome = mode
  operations++; stats()
  if (outcome === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (outcome === 'error') throw new Error('SqlClient exception: secret=DEMO')
  if (outcome === 'conflict') throw new ApiError('Không đủ tồn kho để phát đơn thuốc.', 409)
  return outcome
}
clinicalApi.medicines = async () => {
  if (mode === 'load-error') throw new Error('SqlClient exception: secret=DEMO')
  return [{ id: 1, name: 'Thuốc minh họa DEMO', price: 1000 }]
}
pharmacyApi.receiveReceipt = async request => {
  await mutation(); receipts++; stats()
  const items = request.items.map(item => ({ ...item, medicineName: 'Thuốc minh họa DEMO', lineAmount: item.quantity * item.unitCost }))
  return { id: receipts, supplierName: request.supplierName, documentNo: request.documentNo,
    receivedAt: '2026-10-07T08:00:00Z', totalAmount: items.reduce((sum, item) => sum + item.lineAmount, 0), items }
}
pharmacyApi.prescription = async id => {
  const blocked = mode === 'blocked'
  const item: PharmacyPrescription['items'][number] = { medicineId: 1, medicineName: 'Thuốc minh họa DEMO',
    quantity: 2, dispensedQuantity: dispensed ? 2 : 0, dosage: 'Liều dùng DEMO, không có giá trị điều trị.',
    unit: 'viên', availableQuantity: blocked ? 0 : 10, remainingQuantity: dispensed ? 0 : 2,
    shortageQuantity: blocked ? 2 : 0, proposedBatches: dispensed || blocked ? [] : [{ batchId: 1,
      lotNumber: 'LOT-DEMO', expiryDate: '2028-01-01', availableQuantity: 10, proposedQuantity: 2 }] }
  return { prescriptionId: id, medicalRecordId: 1000, patientName: 'Bệnh nhân DEMO', patientCode: 'DEMO',
    doctorName: 'Bác sĩ DEMO', isFinalized: true, appointmentStatus: 3, isDispensed: dispensed,
    isFullyDispensed: dispensed, canDispense: !dispensed && !blocked,
    blockedReason: blocked ? 'Không đủ thuốc để cấp phát.' : dispensed ? 'Đơn thuốc đã được cấp phát đủ.' : null, items: [item] }
}
pharmacyApi.dispense = async id => {
  const outcome = await mutation()
  const alreadyDispensed = dispensed || outcome === 'already'
  if (!alreadyDispensed) stockDeductions++
  dispensed = true; stats()
  const response: DispensePrescriptionResponse = { prescriptionId: id, dispensedAt: '2026-10-07T08:00:00Z', alreadyDispensed,
    lines: [{ prescriptionItemId: 1, medicineId: 1, medicineName: 'Thuốc minh họa DEMO', batchId: 1,
      lotNumber: 'LOT-DEMO', quantity: 2, expiryDate: '2028-01-01' }] }
  return response
}
const auth: AuthContextValue = { user: { id: 11, doctorId: null, patientId: null, fullName: 'Dược sĩ DEMO', roles: ['Pharmacist'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }
function Controls({ reset }: { reset: () => void }) {
  const navigate = useNavigate()
  return <aside aria-label="Kiểm thử DEMO" className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
    <p>DỮ LIỆU MÔ PHỎNG — không sửa dữ liệu thật, không nhập hay xuất thuốc thật.</p>
    <p id="fixture-stats">Thao tác DEMO: 0; phiếu nhập: 0; lần trừ kho: 0.</p>
    <label className="inline-flex flex-wrap items-center gap-2">Kết quả thao tác<select aria-label="Kết quả thao tác DEMO" className="rounded border bg-white p-1" defaultValue={mode} onChange={event => { mode = event.target.value }}>
      <option value="success">Thành công</option><option value="error">Lỗi nội bộ</option><option value="pending">Chờ phản hồi</option>
      <option value="already">Đơn đã phát trước đó</option><option value="conflict">Tồn kho thay đổi</option>
      <option value="blocked">Không đủ thuốc</option><option value="load-error">Lỗi tải danh sách thuốc</option>
    </select></label>
    <div className="flex flex-wrap gap-2">{[['Nhập kho DEMO', '/pharmacy/receipts'], ['Cấp phát DEMO', '/pharmacy/dispense/1000']].map(([label, path]) => <button key={path} className="rounded border px-2 py-1" onClick={() => { toast.dismiss(); navigate(path) }}>{label}</button>)}
      <button className="rounded border px-2 py-1" onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button>
      <button className="rounded border px-2 py-1" onClick={reset}>Làm lại DEMO</button></div>
  </aside>
}
export default function Preview() {
  const [revision, setRevision] = useState(0)
  const reset = () => { dispensed = false; operations = 0; receipts = 0; stockDeductions = 0; release = null; toast.dismiss(); setRevision(value => value + 1) }
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/pharmacy/receipts']}>
    <Controls key={`controls-${revision}`} reset={reset} /><AppToaster />
    <Routes key={`routes-${revision}`}><Route path="/pharmacy/receipts" element={<PharmacyReceiptPage />} />
      <Route path="/pharmacy/dispense/:prescriptionId" element={<PharmacyDispensePage />} /></Routes>
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
