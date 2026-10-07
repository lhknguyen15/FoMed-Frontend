// Real technician pages and Sonner; synthetic in-memory data only, all HTTP blocked.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import type { ServiceOrder } from '../../src/features/clinical/types/clinical'
import { ApiError } from '../../src/shared/api/api-error'
import AppToaster from '../../src/shared/notifications/AppToaster'
import TechnicianOrdersPage from '../../src/workspaces/technician/pages/TechnicianOrdersPage'
import TechnicianResultsPage from '../../src/workspaces/technician/pages/TechnicianResultsPage'
import '../../src/index.css'

const unavailable = async (): Promise<never> => { throw new Error('DEMO: Chặn yêu cầu ngoài phạm vi.') }
window.fetch = unavailable
for (const key of Object.keys(clinicalApi)) Object.assign(clinicalApi, { [key]: unavailable })
const initialOrders = (): ServiceOrder[] => [1, 2].map(id => ({ id, medicalRecordId: 1000 + id,
  serviceId: id, serviceName: `Dịch vụ DEMO ${id}`, status: 0, quantity: 1, unitPriceSnapshot: 1000 }))
let pending = initialOrders()
let history: ServiceOrder[] = []
let mode = 'success'
let operations = 0
let release: (() => void) | null = null
let reloadFails = false
const stats = () => {
  const target = document.getElementById('fixture-stats')
  if (target) target.textContent = `Lần gửi DEMO: ${operations}; kết quả đã lưu: ${history.length}.`
}
clinicalApi.pendingLabOrders = async () => {
  if (mode === 'load-error' || reloadFails) throw new Error('SqlClient exception: secret=DEMO')
  return pending
}
clinicalApi.labResults = async (_keyword, page = 1) => ({ items: history.map(order => ({ order,
  patientName: 'Bệnh nhân DEMO', patientCode: 'DEMO' })), page, pageSize: 10, total: history.length })
clinicalApi.saveLabResult = async (id, request) => {
  const outcome = mode
  operations++; stats()
  if (outcome === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (outcome === 'error') throw new Error('SqlClient exception: secret=DEMO')
  if (outcome === 'conflict') throw new ApiError('Chỉ định đã có kết quả. Vui lòng tải lại danh sách.', 409)
  const order = pending.find(item => item.id === id)
  if (!order) throw new ApiError('Chỉ định không còn chờ thực hiện.', 409)
  const result = { ...order, ...request, status: 1, resultAt: '2026-10-07T08:00:00Z' }
  pending = pending.filter(item => item.id !== id)
  history = [...history, result]
  reloadFails = outcome === 'reload-error'
  stats()
  return result
}
const auth: AuthContextValue = { user: { id: 11, doctorId: null, patientId: null, fullName: 'Kỹ thuật viên DEMO', roles: ['Technician'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }
export default function Preview() {
  const [revision, setRevision] = useState(0)
  const reset = () => { pending = initialOrders(); history = []; operations = 0; release = null; reloadFails = false; toast.dismiss(); setRevision(value => value + 1) }
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/technician/orders']}>
    <aside key={`controls-${revision}`} aria-label="Kiểm thử DEMO" className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
      <p>DỮ LIỆU MÔ PHỎNG — không đọc hoặc ghi kết quả xét nghiệm thật.</p>
      <p id="fixture-stats">Lần gửi DEMO: 0; kết quả đã lưu: 0.</p>
      <label className="inline-flex flex-wrap items-center gap-2">Kết quả thao tác<select aria-label="Kết quả thao tác DEMO" className="rounded border bg-white p-1" defaultValue={mode} onChange={event => { mode = event.target.value; if (mode === 'success') reloadFails = false }}>
        <option value="success">Thành công</option><option value="pending">Chờ phản hồi</option><option value="error">Lỗi nội bộ</option>
        <option value="conflict">Chỉ định đã có kết quả</option><option value="load-error">Lỗi tải danh sách</option><option value="reload-error">Lưu được nhưng tải lại lỗi</option>
      </select></label>
      <div className="flex flex-wrap gap-2"><button className="rounded border px-2 py-1" onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button>
        <button className="rounded border px-2 py-1" onClick={reset}>Làm lại DEMO</button></div>
    </aside><AppToaster /><Routes key={`routes-${revision}`}>
      <Route path="/technician/orders" element={<TechnicianOrdersPage />} /><Route path="/technician/results" element={<TechnicianResultsPage />} />
    </Routes>
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
