// Real inventory page and Sonner; all business API calls and fetch are replaced.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { clinicalApi } from '../../src/features/clinical/api/clinical-api'
import { pharmacyApi } from '../../src/features/pharmacy/api/pharmacy-api'
import type { InventoryBatch, StockTransaction } from '../../src/features/pharmacy/types/pharmacy'
import { ApiError } from '../../src/shared/api/api-error'
import AppToaster from '../../src/shared/notifications/AppToaster'
import PharmacyInventoryPage from '../../src/workspaces/pharmacy/pages/PharmacyInventoryPage'
import '../../src/index.css'

const unavailable = async (): Promise<never> => { throw new Error('DEMO: Chặn yêu cầu ngoài phạm vi.') }
window.fetch = unavailable
for (const api of [clinicalApi, pharmacyApi]) for (const key of Object.keys(api)) Object.assign(api, { [key]: unavailable })
const initial = (): InventoryBatch[] => [{ batchId: 1, medicineId: 1, medicineName: 'Thuốc minh họa DEMO', unit: 'viên',
  lotNumber: 'LOT-DEMO', expiryDate: '2028-01-01', quantity: 10, unitPrice: 1000, isExpired: false }]
let batches = initial()
let journal: StockTransaction[] = []
let mode = 'success'
let operations = 0
let release: (() => void) | null = null
let reloadFails = false
const stats = () => {
  const target = document.getElementById('fixture-stats')
  if (target) target.textContent = `Lần gửi DEMO: ${operations}; thay đổi kho: ${journal.length}.`
}
async function mutation() {
  const outcome = mode
  operations++; stats()
  if (outcome === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (outcome === 'error') throw new Error('SqlClient exception: secret=DEMO')
  if (outcome === 'conflict') throw new ApiError('Số lượng điều chỉnh vượt tồn kho.', 409)
  if (outcome === 'lot-conflict') throw new ApiError('Lô thuốc đã tồn tại với hạn dùng khác.', 409)
  return outcome
}
clinicalApi.medicines = async () => {
  if (mode === 'catalog-error') throw new Error('SqlClient exception: secret=DEMO')
  return [{ id: 1, name: 'Thuốc minh họa DEMO', price: 1000 }]
}
pharmacyApi.inventory = async (_page, medicineId, expiringBefore) => {
  if (reloadFails) throw new Error('SqlClient exception: secret=DEMO')
  return batches.filter(batch => (!medicineId || batch.medicineId === medicineId) && (!expiringBefore || batch.expiryDate <= expiringBefore))
}
pharmacyApi.transactions = async batchId => journal.filter(item => item.batchId === batchId)
pharmacyApi.adjustStock = async request => {
  const outcome = await mutation()
  const batch = batches.find(item => item.batchId === request.batchId)!
  if (batch.quantity + request.quantity < 0) throw new ApiError('Số lượng điều chỉnh vượt tồn kho.', 409)
  const updated = { ...batch, quantity: batch.quantity + request.quantity }
  batches = batches.map(item => item.batchId === updated.batchId ? updated : item)
  journal = [...journal, { id: journal.length + 1, batchId: updated.batchId, type: 3, quantity: request.quantity,
    refType: 'Adjustment', refId: updated.batchId, createdAt: '2026-10-07T08:00:00Z' }]
  reloadFails = outcome === 'reload-error'; stats()
  return updated
}
pharmacyApi.receiveStock = async request => {
  const outcome = await mutation()
  const existing = batches.find(item => item.medicineId === request.medicineId && item.lotNumber === request.lotNumber)
  if (existing && existing.expiryDate !== request.expiryDate) throw new ApiError('Lô thuốc đã tồn tại với hạn dùng khác.', 409)
  const updated: InventoryBatch = existing ? { ...existing, quantity: existing.quantity + request.quantity } : {
    batchId: batches.length + 1, medicineId: request.medicineId, medicineName: 'Thuốc minh họa DEMO', unit: 'viên',
    lotNumber: request.lotNumber, expiryDate: request.expiryDate, quantity: request.quantity, unitPrice: 1000, isExpired: false }
  batches = existing ? batches.map(item => item.batchId === updated.batchId ? updated : item) : [...batches, updated]
  journal = [...journal, { id: journal.length + 1, batchId: updated.batchId, type: 0, quantity: request.quantity,
    refType: 'Receipt', refId: updated.batchId, createdAt: '2026-10-07T08:00:00Z' }]
  reloadFails = outcome === 'reload-error'; stats()
  return updated
}
const auth: AuthContextValue = { user: { id: 11, doctorId: null, patientId: null, fullName: 'Dược sĩ DEMO', roles: ['Pharmacist'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }
export default function Preview() {
  const [revision, setRevision] = useState(0)
  const reset = () => { batches = initial(); journal = []; operations = 0; release = null; reloadFails = false; toast.dismiss(); setRevision(value => value + 1) }
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/pharmacy/inventory']}>
    <aside key={`controls-${revision}`} aria-label="Kiểm thử DEMO" className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
      <p>DỮ LIỆU MÔ PHỎNG — không đọc hoặc thay đổi kho thuốc thật.</p><p id="fixture-stats">Lần gửi DEMO: 0; thay đổi kho: 0.</p>
      <label className="inline-flex flex-wrap items-center gap-2">Kết quả thao tác<select aria-label="Kết quả thao tác DEMO" className="rounded border bg-white p-1" defaultValue={mode} onChange={event => { mode = event.target.value; if (mode === 'success') reloadFails = false }}>
        <option value="success">Thành công</option><option value="pending">Chờ phản hồi</option><option value="error">Lỗi nội bộ</option><option value="conflict">Vượt tồn kho</option>
        <option value="lot-conflict">Lô trùng nhưng khác hạn dùng</option><option value="catalog-error">Lỗi danh sách thuốc</option><option value="reload-error">Lưu được nhưng tải lại lỗi</option>
      </select></label><div className="flex flex-wrap gap-2"><button className="rounded border px-2 py-1" onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button><button className="rounded border px-2 py-1" onClick={reset}>Làm lại DEMO</button></div>
    </aside><AppToaster /><PharmacyInventoryPage key={`page-${revision}`} />
  </MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
